const path = require("path");
const fs = require("fs");
const express = require("express");
const dotenv = require("dotenv");
const { ethers } = require("ethers");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5173);
const publicDir = __dirname;
const registryPath = path.join(__dirname, "data", "certificates.json");
const verifierAbi = [
  "event CertificateIssued(bytes32 indexed certificateHash,address indexed issuer,string metadataURI,uint256 issuedAt)",
  "function ISSUER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role,address account) view returns (bool)",
  "function certificateExists(bytes32 certificateHash) view returns (bool)",
  "function issueCertificate(bytes32 certificateHash,string metadataURI)",
  "function verifyCertificate(bytes32 certificateHash) view returns (bool valid,bool revoked,address issuer,uint256 issuedAt,uint256 revokedAt,string metadataURI)",
];

app.use(express.json({ limit: "15mb" }));

app.get("/api/config", (_req, res) => {
  res.json({
    contractAddress: process.env.CONTRACT_ADDRESS || "",
    chainId: 80002,
    ipfsGateway: process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs",
    publicAppUrl: process.env.PUBLIC_APP_URL || "https://ncfl-blockchain-verification.onrender.com",
    storageEnabled: hasPinataCredentials(),
  });
});

app.post("/api/upload-certificate", async (req, res) => {
  try {
    if (!hasPinataCredentials()) {
      return res.status(500).json({
        error:
          "Pinata backend credentials are missing. Set PINATA_JWT or PINATA_API_KEY plus PINATA_SECRET_API_KEY in .env.",
      });
    }

    const { fileName, pdfBase64, txHash, certificateHash } = req.body || {};
    if (!fileName || !pdfBase64) {
      return res.status(400).json({ error: "fileName and pdfBase64 are required." });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const formData = new FormData();
    formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), fileName);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: fileName,
        keyvalues: {
          project: "NCFL Blockchain Verification System",
          txHash: txHash || "",
          certificateHash: certificateHash || "",
        },
      })
    );

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: pinataHeaders(),
      body: formData,
    });

    const payloadText = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Pinata upload failed: ${payloadText}`,
      });
    }

    const payload = JSON.parse(payloadText);
    const gateway = process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";
    const ipfsURI = `ipfs://${payload.IpfsHash}`;
    saveCertificateFileRecord({
      certificateHash,
      txHash,
      fileName,
      ipfsURI,
      gatewayURL: `${gateway}/${payload.IpfsHash}`,
      uploadedAt: new Date().toISOString(),
    });

    res.json({
      ipfsURI,
      gatewayURL: `${gateway}/${payload.IpfsHash}`,
      fileName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Upload failed." });
  }
});

app.post("/api/issue-certificate", async (req, res) => {
  try {
    const { details } = req.body || {};
    const contractAddress = process.env.CONTRACT_ADDRESS || "";
    if (!details) {
      return res.status(400).json({ error: "Certificate details are required." });
    }
    if (!ethers.isAddress(contractAddress)) {
      return res.status(500).json({ error: "Backend CONTRACT_ADDRESS is not configured." });
    }
    if (!process.env.PRIVATE_KEY) {
      return res.status(500).json({ error: "Backend PRIVATE_KEY is missing. Cannot issue certificate server-side." });
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"
    );
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, verifierAbi, wallet);
    const certificateHash = hashCertificate(details);
    const issuerRole = await contract.ISSUER_ROLE();
    const canIssue = await contract.hasRole(issuerRole, wallet.address);
    if (!canIssue) {
      return res.status(403).json({
        error: `Backend issuer wallet ${wallet.address} does not have ISSUER_ROLE.`,
      });
    }

    const exists = await contract.certificateExists(certificateHash);
    if (exists) {
      return res.status(409).json({
        error: "This certificate already exists on-chain. Change Certificate ID or details.",
        certificateHash,
      });
    }

    const metadataURI = `urn:ncfl:pending:${certificateHash}`;
    await contract.issueCertificate.staticCall(certificateHash, metadataURI);
    const tx = await contract.issueCertificate(certificateHash, metadataURI);
    const receipt = await tx.wait();

    res.json({
      certificateHash,
      metadataURI,
      txHash: receipt.hash,
      issuerWallet: wallet.address,
      contractAddress,
      chainId: 80002,
      issuedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: normalizeBlockchainError(error) });
  }
});

app.get("/api/issuer-status/:address", async (req, res) => {
  try {
    const address = req.params.address;
    const contractAddress = process.env.CONTRACT_ADDRESS || "";
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address." });
    }
    if (!ethers.isAddress(contractAddress)) {
      return res.status(500).json({ error: "Backend CONTRACT_ADDRESS is not configured." });
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"
    );
    const contract = new ethers.Contract(contractAddress, verifierAbi, provider);
    const issuerRole = await contract.ISSUER_ROLE();
    const isIssuer = await contract.hasRole(issuerRole, address);
    res.json({ address, isIssuer, contractAddress });
  } catch (error) {
    res.status(500).json({ error: error.message || "Issuer status check failed." });
  }
});

app.post("/api/verify-certificate", async (req, res) => {
  try {
    const { details, txHash } = req.body || {};
    const contractAddress = process.env.CONTRACT_ADDRESS || "";
    if (!ethers.isAddress(contractAddress)) {
      return res.status(500).json({ error: "Backend CONTRACT_ADDRESS is not configured." });
    }

    const certificateHash = details ? hashCertificate(details) : "";
    const provider = new ethers.JsonRpcProvider(
      process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"
    );
    const contract = new ethers.Contract(contractAddress, verifierAbi, provider);

    let hashToVerify = certificateHash;
    if (txHash) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return res.status(404).json({ error: "Transaction not found on Polygon Amoy." });
      }
      if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
        return res.status(400).json({ error: "Transaction was not sent to the NCFL verifier contract." });
      }

      const iface = new ethers.Interface(verifierAbi);
      const issuedLog = receipt.logs
        .map((log) => {
          try {
            return iface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log) => log?.name === "CertificateIssued");

      if (!issuedLog) {
        return res.status(400).json({ error: "No CertificateIssued event found in transaction." });
      }

      hashToVerify = issuedLog.args.certificateHash;
      if (certificateHash && certificateHash.toLowerCase() !== String(hashToVerify).toLowerCase()) {
        return res.status(400).json({
          error: "QR certificate details do not match the certificate hash emitted by the transaction.",
          certificateHash,
          txCertificateHash: hashToVerify,
        });
      }
    }

    if (!hashToVerify) {
      return res.status(400).json({ error: "Certificate details or transaction hash are required." });
    }

    const result = await contract.verifyCertificate(hashToVerify);
    const [valid, revoked, issuer, issuedAt, revokedAt, metadataURI] = result;
    const storedFile = findCertificateFileRecord(hashToVerify, txHash);
    const resolvedMetadataURI = isDownloadableURI(metadataURI)
      ? metadataURI
      : storedFile?.ipfsURI || metadataURI;

    res.json({
      valid,
      revoked,
      issuer,
      issuedAt: Number(issuedAt) ? new Date(Number(issuedAt) * 1000).toLocaleString() : "",
      revokedAt: Number(revokedAt) ? new Date(Number(revokedAt) * 1000).toLocaleString() : "",
      metadataURI: resolvedMetadataURI,
      storedFile,
      certificateHash: hashToVerify,
      txHash: txHash || "",
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Verification failed." });
  }
});

app.use(express.static(publicDir));

app.listen(port, () => {
  console.log(`NCFL app running at http://localhost:${port}`);
});

function hasPinataCredentials() {
  return Boolean(
    process.env.PINATA_JWT ||
      (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY)
  );
}

function pinataHeaders() {
  if (process.env.PINATA_JWT) {
    return { Authorization: `Bearer ${process.env.PINATA_JWT}` };
  }

  return {
    pinata_api_key: process.env.PINATA_API_KEY,
    pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
  };
}

function hashCertificate(details) {
  const cleanDetails = {
    studentName: clean(details.studentName),
    internshipTitle: clean(details.internshipTitle),
    issuerName: clean(details.issuerName),
    certificateId: clean(details.certificateId),
    startDate: clean(details.startDate),
    endDate: clean(details.endDate),
    description: clean(details.description),
  };

  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "string", "string", "string", "string"],
      [
        cleanDetails.studentName,
        cleanDetails.internshipTitle,
        cleanDetails.issuerName,
        cleanDetails.certificateId,
        cleanDetails.startDate,
        cleanDetails.endDate,
        cleanDetails.description,
      ]
    )
  );
}

function clean(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeBlockchainError(error) {
  const raw = [
    error?.shortMessage,
    error?.reason,
    error?.message,
    JSON.stringify(error?.info || {}),
  ]
    .filter(Boolean)
    .join(" ");

  if (raw.includes("Already issued")) {
    return "This certificate already exists on-chain. Change Certificate ID or details.";
  }
  if (raw.includes("AccessControlUnauthorizedAccount")) {
    return "Backend issuer wallet is not approved on this contract.";
  }
  if (raw.includes("insufficient funds")) {
    return "Backend issuer wallet does not have enough Amoy POL for gas.";
  }
  if (raw.includes("could not coalesce error")) {
    return "Polygon transaction failed at RPC level. Try again with a new Certificate ID/details; if it repeats, check Amoy RPC status and wallet gas.";
  }
  return error?.shortMessage || error?.reason || error?.message || "Blockchain transaction failed.";
}

function saveCertificateFileRecord(record) {
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  const registry = readCertificateFileRegistry();
  const normalizedHash = String(record.certificateHash || "").toLowerCase();
  const normalizedTx = String(record.txHash || "").toLowerCase();
  registry[normalizedHash] = record;
  if (normalizedTx) registry[normalizedTx] = record;
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

function findCertificateFileRecord(certificateHash, txHash) {
  const registry = readCertificateFileRegistry();
  return (
    registry[String(certificateHash || "").toLowerCase()] ||
    registry[String(txHash || "").toLowerCase()] ||
    null
  );
}

function readCertificateFileRegistry() {
  if (!fs.existsSync(registryPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch {
    return {};
  }
}

function isDownloadableURI(uri) {
  return typeof uri === "string" && (
    uri.startsWith("ipfs://") || uri.startsWith("https://") || uri.startsWith("http://")
  );
}
