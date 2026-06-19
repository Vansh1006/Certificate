const AMOY_CHAIN_ID_DECIMAL = 80002;
const AMOY_EXPLORER = "https://amoy.polygonscan.com";
let ipfsGateway = "https://gateway.pinata.cloud/ipfs";
let backendStorageEnabled = false;
let defaultContractAddress = "";
let publicAppUrl = "https://ndisk-blockchain-infrastructure.onrender.com";

let lastIssuedCertificate = null;

const issueForm = document.querySelector("#issueForm");
const txVerifyForm = document.querySelector("#txVerifyForm");
const manualVerifyForm = document.querySelector("#manualVerifyForm");
const issueResult = document.querySelector("#issueResult");
const verifyResult = document.querySelector("#verifyResult");
const downloadPdfBtn = document.querySelector("#downloadPdfBtn");
const uploadPdfBtn = document.querySelector("#uploadPdfBtn");
const contractAddressInput = document.querySelector("#contractAddressInput");
const storageStatus = document.querySelector("#storageStatus");
const qrCertificatePreview = document.querySelector("#qrCertificatePreview");

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}Panel`).classList.add("active");
  });
});

issueForm.addEventListener("submit", issueCertificate);
txVerifyForm.addEventListener("submit", verifyByTransactionHash);
manualVerifyForm.addEventListener("submit", verifyByManualDetails);

downloadPdfBtn.addEventListener("click", async () => {
  if (!lastIssuedCertificate) return;
  try {
    const blob = await createCertificatePdfBlob(lastIssuedCertificate);
    saveBlob(blob, certificateFileName(lastIssuedCertificate));
  } catch (error) {
    setResult(issueResult, readableError(error), true);
  }
});

uploadPdfBtn.addEventListener("click", async () => {
  if (!lastIssuedCertificate) return;
  await uploadLastCertificatePdf();
});

init();

async function init() {
  await loadBackendConfig();
  prefillFromQr();
}

async function loadBackendConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Backend config unavailable");
    const config = await response.json();
    defaultContractAddress = config.contractAddress || "";
    ipfsGateway = config.ipfsGateway || ipfsGateway;
    publicAppUrl = config.publicAppUrl || publicAppUrl;
    backendStorageEnabled = Boolean(config.storageEnabled);
    contractAddressInput.value = defaultContractAddress;
    storageStatus.textContent = backendStorageEnabled
      ? "Cloud PDF storage enabled on backend"
      : "Cloud storage needs Pinata JWT or API secret in backend .env";
  } catch {
    storageStatus.textContent = "Backend config unavailable. Start with npm run dev.";
  }
}

async function issueCertificate(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(issueResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before issuing certificates.", true);
    return;
  }

  try {
    const details = getFormDetails(issueForm);
    setResult(issueResult, "Issuing certificate from approved backend issuer wallet...");
    const issue = await issueCertificateFromBackend(details);

    lastIssuedCertificate = {
      ...details,
      certificateHash: issue.certificateHash,
      metadataURI: issue.metadataURI,
      pdfURI: "",
      txHash: issue.txHash,
      contractAddress: issue.contractAddress || getContractAddress(),
      chainId: issue.chainId || AMOY_CHAIN_ID_DECIMAL,
      issuedAt: issue.issuedAt,
      issuerWallet: issue.issuerWallet,
    };

    downloadPdfBtn.disabled = false;
    uploadPdfBtn.disabled = false;

    let cloudMessage = "";
    if (backendStorageEnabled) {
      cloudMessage = await uploadLastCertificatePdf({ silent: true });
    }

    setResult(
      issueResult,
      `<strong>Certificate issued successfully.</strong><br />
      Certificate hash: ${issue.certificateHash}<br />
      Transaction: <a href="${AMOY_EXPLORER}/tx/${issue.txHash}" target="_blank" rel="noreferrer">${issue.txHash}</a><br />
      PDF download is ready.${cloudMessage}`
    );
  } catch (error) {
    setResult(issueResult, readableError(error), true);
  }
}

async function issueCertificateFromBackend(details) {
  const response = await fetch("/api/issue-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ details }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Backend issue failed with status ${response.status}`);
  }
  return payload;
}

async function uploadLastCertificatePdf(options = {}) {
  if (!lastIssuedCertificate) return "";

  if (!backendStorageEnabled) {
    const message = "Backend cloud storage is not enabled. Add PINATA_JWT or PINATA_API_KEY plus PINATA_SECRET_API_KEY to .env.";
    if (!options.silent) setResult(issueResult, message, true);
    return `<br />${escapeHtml(message)}`;
  }

  try {
    setResult(issueResult, "Generating PDF and uploading it to IPFS...");

    const blob = await createCertificatePdfBlob(lastIssuedCertificate);
    const fileName = certificateFileName(lastIssuedCertificate);
    const upload = await uploadPdfToBackend(blob, fileName, lastIssuedCertificate);
    const ipfsURI = upload.ipfsURI;
    lastIssuedCertificate.metadataURI = ipfsURI;
    lastIssuedCertificate.pdfURI = ipfsURI;

    const gatewayURL = ipfsToGatewayUrl(ipfsURI);
    const message = `<br />Cloud PDF: <a href="${gatewayURL}" target="_blank" rel="noreferrer">${escapeHtml(ipfsURI)}</a><br />Stored on backend for future verification downloads.`;

    if (!options.silent) {
      setResult(issueResult, `<strong>Upload complete.</strong>${message}`);
    }
    return message;
  } catch (error) {
    const message = `Cloud upload failed: ${readableError(error)}. Local PDF download still works.`;
    if (!options.silent) setResult(issueResult, message, true);
    return `<br />${message}`;
  }
}

async function verifyByManualDetails(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(verifyResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before verification.", true);
    return;
  }

  try {
    const details = getFormDetails(manualVerifyForm);
    setResult(verifyResult, "Verifying certificate through backend POST...");
    const payload = await verifyCertificateWithBackend({ details });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, readableError(error), true);
  }
}

async function verifyByTransactionHash(event) {
  event.preventDefault();
  if (!isContractConfigured()) {
    setResult(verifyResult, "N-DISC's official smart contract is not configured on the backend. Add CONTRACT_ADDRESS to the backend environment before transaction verification.", true);
    return;
  }

  try {
    const formData = new FormData(txVerifyForm);
    const txHash = String(formData.get("txHash")).trim();
    setResult(verifyResult, "Verifying transaction through backend POST...");
    const payload = await verifyCertificateWithBackend({ txHash });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, readableError(error), true);
  }
}

async function verifyCertificateWithBackend(body) {
  const response = await fetch("/api/verify-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Backend verification failed with status ${response.status}`);
  }
  return payload;
}

function renderVerificationResult(result, certificateHash, txHash = "") {
  const [valid, revoked, issuer, issuedAt, revokedAt, metadataURI] = result;

  if (!valid) {
    const revokedMessage = revoked
      ? `<strong>Certificate was found but has been revoked.</strong><br />Revoked At: ${new Date(Number(revokedAt) * 1000).toLocaleString()}`
      : `Certificate hash ${certificateHash} was not found on-chain.`;
    setResult(verifyResult, revokedMessage, true);
    return;
  }

  const issuedDate = Number(issuedAt) ? new Date(Number(issuedAt) * 1000).toLocaleString() : "Recorded on-chain";
  const downloadLink = metadataURI && isDownloadableURI(metadataURI)
    ? `<br />Certificate PDF: <a href="${ipfsToGatewayUrl(metadataURI)}" target="_blank" rel="noreferrer">Download stored certificate</a>`
    : "";

  setResult(
    verifyResult,
    `<strong>Certificate verified on Polygon Amoy.</strong><br />
    Certificate Hash: ${certificateHash}<br />
    Issued At: ${issuedDate}<br />
    Issued By: ${issuer}
    ${downloadLink}
    ${txHash ? `<br />Transaction: <a href="${AMOY_EXPLORER}/tx/${txHash}" target="_blank" rel="noreferrer">${txHash}</a>` : ""}`
  );
}

function renderBackendVerificationResult(payload, element = verifyResult) {
  if (!payload.valid) {
    const message = payload.revoked
      ? `<strong>Certificate was found but has been revoked.</strong><br />Revoked At: ${escapeHtml(payload.revokedAt || "")}`
      : `Certificate hash ${escapeHtml(payload.certificateHash || "")} was not found on-chain.`;
    setResult(element, message, true);
    return;
  }

  const certificatePdfUrl = resolveCertificatePdfUrl(payload);
  const downloadLink = certificatePdfUrl
    ? `<div class="verify-actions"><a class="secondary result-action" href="${escapeHtml(certificatePdfUrl)}" target="_blank" rel="noreferrer" download>Download Certificate PDF</a></div>`
    : "";

  setResult(
    element,
    `<strong>Certificate verified by backend POST on Polygon Amoy.</strong><br />
    Certificate Hash: ${escapeHtml(payload.certificateHash)}<br />
    Issued At: ${escapeHtml(payload.issuedAt || "")}<br />
    Issued By: ${escapeHtml(payload.issuer || "")}
    ${downloadLink}
    ${payload.txHash ? `<br />Transaction: <a href="${AMOY_EXPLORER}/tx/${payload.txHash}" target="_blank" rel="noreferrer">${escapeHtml(payload.txHash)}</a>` : ""}`
  );
}

function resolveCertificatePdfUrl(payload) {
  const storedFile = payload.storedFile || {};
  if (storedFile.gatewayURL) return storedFile.gatewayURL;
  if (storedFile.ipfsURI && isDownloadableURI(storedFile.ipfsURI)) {
    return ipfsToGatewayUrl(storedFile.ipfsURI);
  }
  if (payload.metadataURI && isDownloadableURI(payload.metadataURI)) {
    return ipfsToGatewayUrl(payload.metadataURI);
  }
  return "";
}

function getFormDetails(form) {
  const data = new FormData(form);
  return {
    certificateTitle: clean(data.get("certificateTitle")),
    studentName: clean(data.get("studentName")),
    internshipTitle: clean(data.get("internshipTitle")),
    issuerName: clean(data.get("issuerName")),
    certificateId: clean(data.get("certificateId")),
    startDate: clean(data.get("startDate")),
    endDate: clean(data.get("endDate")),
    description: clean(data.get("description")),
  };
}

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function hashCertificate(details) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "string", "string", "string", "string", "string", "string", "string"],
      [
        details.certificateTitle,
        details.studentName,
        details.internshipTitle,
        details.issuerName,
        details.certificateId,
        details.startDate,
        details.endDate,
        details.description,
      ]
    )
  );
}

async function createCertificatePdfBlob(certificate) {
  if (!window.jspdf?.jsPDF) {
    throw new Error("PDF library did not load. Check your internet connection and reload the page.");
  }
  if (!window.qrcode) {
    throw new Error("QR library did not load. Check your internet connection and reload the page.");
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const qrUrl = buildVerificationUrl(certificate);
  const qr = qrcode(0, "M");
  qr.addData(qrUrl);
  qr.make();
  const qrDataUrl = qr.createDataURL(5, 1);

  pdf.setFillColor(242, 248, 253);
  pdf.rect(0, 0, width, height, "F");
  pdf.setDrawColor(11, 107, 203);
  pdf.setLineWidth(8);
  pdf.rect(28, 28, width - 56, height - 56);
  pdf.setDrawColor(201, 151, 47);
  pdf.setLineWidth(2);
  pdf.rect(46, 46, width - 92, height - 92);

  pdf.setFont("times", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(11, 107, 203);
  pdf.text("N-DISC Blockchain Infrastructure", width / 2, 92, { align: "center" });

  pdf.setFontSize(18);
  pdf.setTextColor(96, 112, 134);
  pdf.text(certificate.certificateTitle || "Certificate", width / 2, 126, { align: "center" });

  pdf.setFont("times", "normal");
  pdf.setFontSize(16);
  pdf.setTextColor(16, 32, 51);
  pdf.text("This certificate is proudly presented to", width / 2, 180, { align: "center" });

  pdf.setFont("times", "bold");
  pdf.setFontSize(36);
  pdf.setTextColor(16, 32, 51);
  pdf.text(certificate.studentName || "Certificate Holder", width / 2, 226, { align: "center" });

  pdf.setFont("times", "normal");
  pdf.setFontSize(16);
  pdf.text("for successfully completing the internship program as", width / 2, 268, { align: "center" });

  pdf.setFont("times", "bold");
  pdf.setFontSize(23);
  pdf.setTextColor(11, 107, 203);
  pdf.text(certificate.internshipTitle || "Intern", width / 2, 306, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(72, 86, 104);
  const description = pdf.splitTextToSize(certificate.description || "Internship completed successfully.", 520);
  pdf.text(description, width / 2, 350, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(16, 32, 51);
  pdf.text(`Duration: ${formatDate(certificate.startDate)} to ${formatDate(certificate.endDate)}`, 90, 460);
  pdf.text(`Issued by: ${certificate.issuerName || "N-DISC"}`, 90, 486);
  pdf.text(`Certificate ID: ${certificate.certificateId || "NDISC-CERT"}`, 90, 512);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(16, 32, 51);
  pdf.text(`Blockchain hash: ${certificate.certificateHash || "Pending"}`, 90, 540);
  pdf.text(`Transaction: ${certificate.txHash || "Pending"}`, 90, 556);

  pdf.addImage(qrDataUrl, "PNG", width - 190, height - 210, 116, 116);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(11, 107, 203);
  pdf.text("Scan to verify on blockchain", width - 132, height - 82, { align: "center" });

  pdf.setDrawColor(16, 32, 51);
  pdf.line(width - 360, 488, width - 230, 488);
  pdf.setTextColor(16, 32, 51);
  pdf.text("Authorized Signature", width - 295, 512, { align: "center" });

  return pdf.output("blob");
}

async function uploadPdfToBackend(blob, fileName, certificate) {
  const pdfBase64 = await blobToBase64(blob);
  const response = await fetch("/api/upload-certificate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      pdfBase64,
      txHash: certificate.txHash,
      certificateHash: certificate.certificateHash,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Backend upload failed with status ${response.status}`);
  }

  return response.json();
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function certificateFileName(certificate) {
  const rawName = certificate.txHash || certificate.certificateId || "certificate";
  return `${rawName.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
}

function buildVerificationUrl(certificate) {
  const params = new URLSearchParams({
    verify: "1",
    txHash: certificate.txHash || "",
  });
  return `${publicAppUrl.replace(/\/$/, "")}/?${params.toString()}`;
}

function prefillFromQr() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("verify") !== "1") return;

  document.querySelector('[data-tab="verify"]').click();
  if (params.get("txHash")) txVerifyForm.elements.txHash.value = params.get("txHash");

  qrCertificatePreview.hidden = false;
  qrCertificatePreview.innerHTML = `
    <p class="eyebrow">QR Certificate View</p>
    <h3>Blockchain verification link</h3>
    <p>This QR code carries only the blockchain transaction reference.</p>
    <dl>
      ${params.get("txHash") ? `<dt>Transaction</dt><dd><a href="${AMOY_EXPLORER}/tx/${params.get("txHash")}" target="_blank" rel="noreferrer">${escapeHtml(params.get("txHash"))}</a></dd>` : ""}
    </dl>
  `;
  setResult(verifyResult, "Transaction hash loaded from QR. Verifying through backend POST...");
  verifyQrWithBackend({}, params.get("txHash") || "");
}

async function verifyQrWithBackend(details, txHash) {
  try {
    setResult(verifyResult, "Certificate details loaded from QR. Verifying through backend POST...");
    const payload = await verifyCertificateWithBackend({ details, txHash });
    renderBackendVerificationResult(payload);
  } catch (error) {
    setResult(verifyResult, `QR backend verification failed: ${readableError(error)}`, true);
  }
}

function isDownloadableURI(uri) {
  return uri.startsWith("ipfs://") || uri.startsWith("https://") || uri.startsWith("http://");
}

function ipfsToGatewayUrl(uri) {
  if (uri.startsWith("ipfs://")) return `${ipfsGateway}/${uri.replace("ipfs://", "")}`;
  return uri;
}

function setResult(element, html, isError = false) {
  element.hidden = false;
  element.classList.toggle("error", isError);
  element.innerHTML = html;
}

function readableError(error) {
  const raw = error?.shortMessage || error?.reason || error?.message || "Something went wrong.";
  if (raw.includes("could not coalesce error")) {
    return "Blockchain transaction failed. The backend checks issuer role and duplicate certificates before submitting the transaction; reload the page and try again to see the exact cause.";
  }
  if (raw.includes("AccessControlUnauthorizedAccount")) {
    return "The backend issuer wallet is not approved to issue certificates. Grant ISSUER_ROLE to the backend issuer wallet from the admin/deployer wallet.";
  }
  if (raw.includes("Already issued")) {
    return "This certificate already exists on-chain. Change the certificate ID/details or verify the existing certificate.";
  }
  return escapeHtml(raw);
}

function isContractConfigured() {
  return ethers.isAddress(getContractAddress());
}

function getContractAddress() {
  return contractAddressInput.value.trim() || defaultContractAddress;
}

function formatDate(dateString) {
  if (!dateString) return "Not specified";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
