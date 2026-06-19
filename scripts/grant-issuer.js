const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

async function main() {
  const issuer = process.env.ISSUER_ADDRESS;
  if (!ethers.isAddress(issuer)) {
    throw new Error("Set ISSUER_ADDRESS in .env or before the command.");
  }

  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const contract = await ethers.getContractAt("NCFLCertificateVerifier", deployment.proxyAddress);
  const role = await contract.ISSUER_ROLE();
  const tx = await contract.grantRole(role, issuer);
  await tx.wait();

  console.log(`Granted ISSUER_ROLE to ${issuer}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
