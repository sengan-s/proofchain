const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ProofChain EvidenceRegistry smart contract...");

  const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();

  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();

  console.log(`EvidenceRegistry deployed successfully to: ${contractAddress}`);

  // Export contract address and ABI for Backend and Frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json");
  let contractArtifact = { abi: [] };
  if (fs.existsSync(artifactPath)) {
    contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  }

  const contractData = {
    address: contractAddress,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi: contractArtifact.abi
  };

  // Ensure directories exist
  const backendDir = path.join(__dirname, "../backend");
  const frontendJsDir = path.join(__dirname, "../frontend/js");
  if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
  if (!fs.existsSync(frontendJsDir)) fs.mkdirSync(frontendJsDir, { recursive: true });

  fs.writeFileSync(
    path.join(backendDir, "contract_data.json"),
    JSON.stringify(contractData, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendJsDir, "contract_config.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract data saved to backend/contract_data.json and frontend/js/contract_config.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
