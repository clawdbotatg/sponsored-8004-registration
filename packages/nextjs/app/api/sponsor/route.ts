import { NextResponse } from "next/server";
import { createPublicClient, formatEther, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const MIN_BALANCE_ETH = 0.01; // Threshold for "ready" status

export async function GET(): Promise<NextResponse> {
  const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

  if (!sponsorPrivateKey) {
    return NextResponse.json({ error: "Sponsor wallet not configured" }, { status: 503 });
  }

  try {
    // Derive address from private key
    const account = privateKeyToAccount(sponsorPrivateKey as Hex);

    // Create public client to check balance
    const rpcUrl =
      process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/8GVG8WjDs-sGFRr6Rm839";

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    // Get balance
    const balanceWei = await publicClient.getBalance({ address: account.address });
    const balanceEth = formatEther(balanceWei);

    return NextResponse.json({
      address: account.address,
      balance: balanceEth,
      balanceWei: balanceWei.toString(),
      ready: parseFloat(balanceEth) >= MIN_BALANCE_ETH,
    });
  } catch (error) {
    console.error("Error fetching sponsor info:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sponsor info" },
      { status: 500 },
    );
  }
}
