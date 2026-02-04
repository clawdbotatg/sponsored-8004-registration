import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// Bytecode from compilation - we'll get this from artifacts
import * as fs from "fs";
import * as path from "path";

async function main() {
  const rpcUrl = "http://127.0.0.1:8545";
  
  // Use hardhat's default account (has ETH on fork)
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(privateKey as Hex);
  
  console.log("Deployer:", account.address);
  
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(rpcUrl),
  });
  
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  // Read the contract artifact
  const artifactPath = path.join(
    __dirname,
    "../../hardhat/artifacts/contracts/RegistrationDelegate.sol/RegistrationDelegate.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  // Registry address
  const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
  
  // Encode constructor args
  const { encodeAbiParameters, parseAbiParameters } = await import("viem");
  const constructorArgs = encodeAbiParameters(
    parseAbiParameters("address"),
    [ERC8004_REGISTRY]
  );
  
  const deployData = (artifact.bytecode + constructorArgs.slice(2)) as Hex;
  
  console.log("Deploying RegistrationDelegate...");
  
  // Deploy with high gas
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as Hex,
    args: [ERC8004_REGISTRY],
  });
  
  console.log("Deploy tx:", hash);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Deployed to:", receipt.contractAddress);
  
  // Save the new address
  fs.writeFileSync(
    path.join(__dirname, "deployed-delegate.txt"),
    receipt.contractAddress || ""
  );
  
  console.log("\n✅ New delegate with IERC721Receiver deployed!");
  console.log("Update debug-registration.ts to use:", receipt.contractAddress);
}

main().catch(console.error);
