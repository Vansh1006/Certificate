const fs = require("fs");
const path = require("path");
const { ethers, upgrades, network } = require("hardhat");

async function main() {
  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Missing deployment file: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const Factory = await ethers.getContractFactory("NCFLCertificateVerifier");
  const upgraded = await upgrades.upgradeProxy(deployment.proxyAddress, Factory);
  await upgraded.waitForDeployment();

  deployment.implementationAddress = await upgrades.erc1967.getImplementationAddress(
    deployment.proxyAddress
  );
  deployment.upgradedAt = new Date().toISOString();

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("Upgrade complete:");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
