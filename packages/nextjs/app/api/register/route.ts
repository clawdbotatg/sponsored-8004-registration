import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEventLogs,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// Contract addresses
// V2 delegate with IERC721Receiver fix (deployed 2026-02-04)
const REGISTRATION_DELEGATE = "0x77fb3D2ff6dB9dcbF1b7E0693b3c746B30499eE8" as const;

// ABI for the executeRegistration function
const executeRegistrationAbi = [
  {
    inputs: [
      { internalType: "string", name: "agentURI", type: "string" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "executeRegistration",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Event ABI for parsing the RegistrationExecuted event
const registrationEventAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "agent", type: "address" },
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "agentURI", type: "string" },
      { indexed: true, internalType: "address", name: "sponsor", type: "address" },
    ],
    name: "RegistrationExecuted",
    type: "event",
  },
] as const;

// Request body schema
interface RegisterRequest {
  agentAddress: Address;
  agentURI: string;
  deadline: string; // Unix timestamp as string (bigint serialization)
  authorization: {
    chainId: number;
    address: Address; // RegistrationDelegate address
    nonce: string; // bigint as string
    r: Hex;
    s: Hex;
    yParity: number;
  };
  intentSignature: Hex; // EIP-712 registration intent signature
}

// Response schema
interface RegisterResponse {
  success: boolean;
  agentId?: number;
  txHash?: Hex;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    // Validate environment
    const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;
    if (!sponsorPrivateKey) {
      console.error("SPONSOR_PRIVATE_KEY not configured");
      return NextResponse.json(
        { success: false, error: "Sponsor service not configured" },
        { status: 503 },
      );
    }

    // Parse request body
    const body: RegisterRequest = await request.json();

    // Validate required fields
    if (!body.agentAddress) {
      return NextResponse.json({ success: false, error: "agentAddress is required" }, { status: 400 });
    }
    if (!body.agentURI) {
      return NextResponse.json({ success: false, error: "agentURI is required" }, { status: 400 });
    }
    if (!body.deadline) {
      return NextResponse.json({ success: false, error: "deadline is required" }, { status: 400 });
    }
    if (!body.authorization) {
      return NextResponse.json({ success: false, error: "authorization is required" }, { status: 400 });
    }
    if (!body.intentSignature) {
      return NextResponse.json({ success: false, error: "intentSignature is required" }, { status: 400 });
    }

    // Validate authorization object
    const { authorization } = body;
    if (!authorization.address || !authorization.r || !authorization.s || authorization.yParity === undefined) {
      return NextResponse.json({ success: false, error: "Invalid authorization object" }, { status: 400 });
    }

    // Verify authorization is for the correct delegate contract
    if (authorization.address.toLowerCase() !== REGISTRATION_DELEGATE.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: `Authorization must be for delegate ${REGISTRATION_DELEGATE}` },
        { status: 400 },
      );
    }

    // Check deadline hasn't expired
    const deadline = BigInt(body.deadline);
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (deadline <= now) {
      return NextResponse.json({ success: false, error: "Registration deadline has expired" }, { status: 400 });
    }

    // Create sponsor wallet client
    const sponsorAccount = privateKeyToAccount(sponsorPrivateKey as Hex);
    const rpcUrl =
      process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/8GVG8WjDs-sGFRr6Rm839";

    const walletClient = createWalletClient({
      account: sponsorAccount,
      chain: mainnet,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    // Encode the function call
    const callData = encodeFunctionData({
      abi: executeRegistrationAbi,
      functionName: "executeRegistration",
      args: [body.agentURI, deadline, body.intentSignature],
    });

    // Build the authorization list for EIP-7702
    // The authorization must be signed by the agent (which we received)
    const authorizationList = [
      {
        address: authorization.address,
        chainId: authorization.chainId,
        nonce: Number(authorization.nonce),
        r: authorization.r,
        s: authorization.s,
        yParity: authorization.yParity,
      },
    ];

    console.log("Submitting sponsored registration:", {
      agent: body.agentAddress,
      agentURI: body.agentURI,
      deadline: deadline.toString(),
      sponsor: sponsorAccount.address,
    });

    // Send the Type-4 transaction
    // The `to` is the agent's EOA - the delegated code runs in that context
    const txHash = await walletClient.sendTransaction({
      to: body.agentAddress,
      data: callData,
      authorizationList,
    });

    console.log("Transaction submitted:", txHash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000, // 60 second timeout
    });

    if (receipt.status === "reverted") {
      console.error("Transaction reverted:", txHash);
      return NextResponse.json({ success: false, error: "Transaction reverted", txHash }, { status: 500 });
    }

    // Parse the RegistrationExecuted event to get the agentId
    const logs = parseEventLogs({
      abi: registrationEventAbi,
      logs: receipt.logs,
    });

    const registrationEvent = logs.find(log => log.eventName === "RegistrationExecuted");

    if (!registrationEvent) {
      console.error("RegistrationExecuted event not found in logs");
      return NextResponse.json(
        {
          success: true,
          txHash,
          error: "Registration may have succeeded but could not parse agentId",
        },
        { status: 200 },
      );
    }

    const agentId = Number(registrationEvent.args.agentId);

    console.log("Registration successful:", {
      agent: body.agentAddress,
      agentId,
      txHash,
    });

    return NextResponse.json({
      success: true,
      agentId,
      txHash,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Check for common contract errors
    if (errorMessage.includes("Registration expired")) {
      return NextResponse.json({ success: false, error: "Registration signature has expired" }, { status: 400 });
    }
    if (errorMessage.includes("Invalid signature")) {
      return NextResponse.json({ success: false, error: "Invalid registration signature" }, { status: 400 });
    }
    if (errorMessage.includes("insufficient funds")) {
      return NextResponse.json(
        { success: false, error: "Sponsor has insufficient funds for gas" },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Health check / info endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: "Sponsored Agent Registration",
    version: "1.0.0",
    delegate: REGISTRATION_DELEGATE,
    chain: "mainnet",
    chainId: 1,
    endpoints: {
      POST: "Submit registration with EIP-7702 authorization and EIP-712 signature",
    },
  });
}
