import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  type Hex,
  type Address,
  decodeErrorResult,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { mainnet } from "viem/chains";

// Contract addresses
// Use local fork's newly deployed delegate with IERC721Receiver fix
const REGISTRATION_DELEGATE = "0x0e8ad62c468e6614c21e63a1cc24578e83254a5b" as const;
const AGENT_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

// ABIs
const executeRegistrationAbi = [
  {
    inputs: [
      { name: "agentURI", type: "string" },
      { name: "deadline", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "executeRegistration",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "agentURI", type: "string" }],
    name: "executeSimpleRegistration",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const registryAbi = [
  {
    inputs: [{ name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main() {
  // Use local fork
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  console.log("Using RPC:", rpcUrl);

  // Sponsor account
  const sponsorKey = process.env.SPONSOR_PRIVATE_KEY || "0xe31ace14051f413ab81de139904629c446332ac84b1c9d87e06071297807ceae";
  const sponsorAccount = privateKeyToAccount(sponsorKey as Hex);
  console.log("Sponsor:", sponsorAccount.address);

  // Generate fresh agent wallet
  const agentKey = generatePrivateKey();
  const agentAccount = privateKeyToAccount(agentKey);
  console.log("Agent (fresh):", agentAccount.address);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account: sponsorAccount,
    chain: mainnet,
    transport: http(rpcUrl),
  });

  const agentClient = createWalletClient({
    account: agentAccount,
    chain: mainnet,
    transport: http(rpcUrl),
  });

  // Test agent URI
  const agentURI = `data:application/json,{"name":"Debug Test Agent ${Date.now()}"}`;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

  console.log("\n=== Step 1: Sign EIP-7702 Authorization ===");
  const authorization = await agentClient.signAuthorization({
    contractAddress: REGISTRATION_DELEGATE,
  });
  console.log("Authorization:", {
    address: authorization.address,
    chainId: authorization.chainId,
    nonce: authorization.nonce,
  });

  console.log("\n=== Step 2: Sign EIP-712 Registration Intent ===");
  const intentSignature = await agentClient.signTypedData({
    domain: {
      name: "AgentRegistrationDelegate",
      version: "1",
      chainId: 1,
      verifyingContract: REGISTRATION_DELEGATE,
    },
    types: {
      Registration: [
        { name: "agentURI", type: "string" },
        { name: "deadline", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "Registration",
    message: {
      agentURI,
      deadline,
      nonce: 0n,
    },
  });
  console.log("Intent signature:", intentSignature.slice(0, 20) + "...");

  console.log("\n=== Step 3: Prepare Type-4 Transaction ===");
  const callData = encodeFunctionData({
    abi: executeRegistrationAbi,
    functionName: "executeRegistration",
    args: [agentURI, deadline, intentSignature],
  });
  console.log("Call data:", callData.slice(0, 50) + "...");

  const authList = [
    {
      address: authorization.address,
      chainId: authorization.chainId,
      nonce: authorization.nonce,
      r: authorization.r,
      s: authorization.s,
      yParity: authorization.yParity,
    },
  ];

  console.log("\n=== Step 4: Simulate with eth_call ===");
  try {
    const result = await publicClient.call({
      account: sponsorAccount,
      to: agentAccount.address,
      data: callData,
      // Note: authorizationList might not be supported in eth_call
    });
    console.log("Simulation result:", result);
  } catch (error: any) {
    console.log("Simulation error:", error.message);
    if (error.cause?.data) {
      console.log("Error data:", error.cause.data);
    }
  }

  console.log("\n=== Step 5: Try Simple Registration (no intent signature) ===");
  const simpleCallData = encodeFunctionData({
    abi: executeRegistrationAbi,
    functionName: "executeSimpleRegistration",
    args: [agentURI],
  });

  try {
    console.log("Sending simple registration tx...");
    const txHash = await walletClient.sendTransaction({
      to: agentAccount.address,
      data: simpleCallData,
      authorizationList: authList,
    });
    console.log("TX Hash:", txHash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log("Status:", receipt.status);
    console.log("Logs:", receipt.logs);
  } catch (error: any) {
    console.log("\n=== SIMPLE REGISTRATION FAILED ===");
    console.log("Error:", error.message);
    if (error.cause) {
      console.log("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }

  console.log("\n=== Step 6: Try Full Registration ===");
  try {
    console.log("Sending full registration tx...");
    const txHash = await walletClient.sendTransaction({
      to: agentAccount.address,
      data: callData,
      authorizationList: authList,
    });
    console.log("TX Hash:", txHash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log("Status:", receipt.status);
    console.log("Logs:", receipt.logs);
  } catch (error: any) {
    console.log("\n=== FULL REGISTRATION FAILED ===");
    console.log("Error:", error.message);
    if (error.cause) {
      console.log("Cause:", JSON.stringify(error.cause, null, 2));
    }
  }

  console.log("\n=== Step 7: Test direct registry call (without delegation) ===");
  // Fund the agent first
  console.log("Funding agent for direct test...");
  const fundTx = await walletClient.sendTransaction({
    to: agentAccount.address,
    value: 10000000000000000n, // 0.01 ETH
  });
  await publicClient.waitForTransactionReceipt({ hash: fundTx });
  console.log("Agent funded");

  const agentWallet = createWalletClient({
    account: agentAccount,
    chain: mainnet,
    transport: http(rpcUrl),
  });

  try {
    console.log("Direct registry.register() call...");
    const directTx = await agentWallet.writeContract({
      address: AGENT_REGISTRY,
      abi: registryAbi,
      functionName: "register",
      args: [agentURI],
    });
    console.log("Direct TX:", directTx);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: directTx });
    console.log("Direct registration status:", receipt.status);
  } catch (error: any) {
    console.log("Direct registration failed:", error.message);
  }
}

main().catch(console.error);
