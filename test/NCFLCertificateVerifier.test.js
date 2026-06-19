const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("NCFLCertificateVerifier", function () {
  async function deployFixture() {
    const [admin, issuer, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NCFLCertificateVerifier");
    const verifier = await upgrades.deployProxy(Factory, [admin.address], {
      initializer: "initialize",
      kind: "uups",
    });
    await verifier.waitForDeployment();

    return { verifier, admin, issuer, outsider };
  }

  function certHash(seed) {
    return ethers.keccak256(ethers.toUtf8Bytes(seed));
  }

  it("allows only issuer role holders to issue certificates", async function () {
    const { verifier, outsider } = await deployFixture();
    const hash = certHash("cert-1");

    await expect(
      verifier.connect(outsider).issueCertificate(hash, "ipfs://metadata-1")
    ).to.be.reverted;

    await expect(verifier.issueCertificate(hash, "ipfs://metadata-1"))
      .to.emit(verifier, "CertificateIssued")
      .withArgs(hash, await verifier.runner.getAddress(), "ipfs://metadata-1", anyValue);
  });

  it("prevents duplicate certificate hashes", async function () {
    const { verifier } = await deployFixture();
    const hash = certHash("cert-duplicate");

    await verifier.issueCertificate(hash, "ipfs://metadata-1");
    await expect(verifier.issueCertificate(hash, "ipfs://metadata-2")).to.be.revertedWith(
      "Already issued"
    );
  });

  it("supports granting issuer role", async function () {
    const { verifier, issuer } = await deployFixture();
    const role = await verifier.ISSUER_ROLE();

    await verifier.grantRole(role, issuer.address);
    await verifier.connect(issuer).issueCertificate(certHash("cert-issuer"), "ipfs://issuer");

    const result = await verifier.verifyCertificate(certHash("cert-issuer"));
    expect(result.valid).to.equal(true);
    expect(result.issuer).to.equal(issuer.address);
  });

  it("marks revoked certificates invalid", async function () {
    const { verifier } = await deployFixture();
    const hash = certHash("cert-revoke");

    await verifier.issueCertificate(hash, "ipfs://metadata");
    await verifier.revokeCertificate(hash, "Incorrect details");

    const result = await verifier.verifyCertificate(hash);
    expect(result.valid).to.equal(false);
    expect(result.revoked).to.equal(true);
  });

  it("supports batch issuing", async function () {
    const { verifier } = await deployFixture();
    const hashes = [certHash("batch-1"), certHash("batch-2")];

    await verifier.issueBatch(hashes, ["ipfs://batch-1", "ipfs://batch-2"]);

    const first = await verifier.verifyCertificate(hashes[0]);
    const second = await verifier.verifyCertificate(hashes[1]);
    expect(first.valid).to.equal(true);
    expect(second.valid).to.equal(true);
  });
});
