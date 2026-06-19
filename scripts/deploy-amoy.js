const fs = require("fs");
const path = require("path");
const { ethers, upgrades, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer wallet found. Set PRIVATE_KEY in .env.");
  }

  console.log(`Deploying on ${network.name} with ${deployer.address}`);

  const Factory = await ethers.getContractFactory("NCFLCertificateVerifier");
  const proxy = await upgrades.deployProxy(Factory, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    proxyAddress,
    implementationAddress,
    proxyAdminAddress: adminAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, `${network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log("Deployment complete:");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
