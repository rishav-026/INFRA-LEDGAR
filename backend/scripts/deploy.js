const hre = require('hardhat');

async function main() {
  const InfraLedger = await hre.ethers.getContractFactory('InfraLedger');
  const contract = await InfraLedger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('InfraLedger deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
