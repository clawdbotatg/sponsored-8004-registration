"use client";

import { useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

// Get delegate address from deployed contracts (chain 1 = mainnet, 31337 = localhost)
const getDelegateAddress = () => {
  // Try localhost first (for fork mode), then mainnet
  const localhost = (deployedContracts as any)?.[31337]?.RegistrationDelegate?.address;
  const mainnet = (deployedContracts as any)?.[1]?.RegistrationDelegate?.address;
  return localhost || mainnet || "0x_DEPLOY_FIRST";
};

const ForDevelopersPage = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const delegateAddress = getDelegateAddress();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // The main registration script that agents can copy
  const registrationScript = `// register-agent.js (ESM)
// Give this to your agent. It registers itself on Ethereum Mainnet with zero gas.
// Run: AGENT_PRIVATE_KEY=0x... node register-agent.js

import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';

// Contract addresses - these update when redeployed
const REGISTRY = '${ERC8004_REGISTRY}';
const DELEGATE = '${delegateAddress}';

// Sponsor endpoint (submit your signed auth here)
const SPONSOR_URL = 'https://sponsor.clawdbotatg.eth.limo/register';

async function register() {
  // Load your agent's private key from environment
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Set AGENT_PRIVATE_KEY environment variable');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log('🤖 Agent address:', account.address);

  // Create wallet client for signing
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // Step 1: Sign EIP-7702 authorization
  // This allows the sponsor to execute code as your EOA
  console.log('📝 Signing EIP-7702 authorization...');
  const authorization = await signAuthorization(client, {
    contractAddress: DELEGATE,
  });

  // Step 2: Sign registration intent (EIP-712 typed data)
  // This proves you specifically want to register, not just delegate
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  const agentURI = process.env.AGENT_URI || \`ipfs://your-agent-metadata\`;

  console.log('📝 Signing registration intent...');
  const intentSignature = await client.signTypedData({
    domain: {
      name: 'AgentRegistrationDelegate',
      version: '1',
      chainId: 1,
      verifyingContract: DELEGATE,
    },
    types: {
      Registration: [
        { name: 'agentURI', type: 'string' },
        { name: 'deadline', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'Registration',
    message: {
      agentURI,
      deadline,
      nonce: 0n, // First registration
    },
  });

  // Step 3: Submit to sponsor
  console.log('📤 Submitting to sponsor...');
  const response = await fetch(SPONSOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentAddress: account.address,
      authorization: {
        address: authorization.contractAddress,
        chainId: Number(authorization.chainId),
        nonce: Number(authorization.nonce),
        r: authorization.r,
        s: authorization.s,
        yParity: authorization.yParity,
      },
      agentURI,
      deadline: deadline.toString(),
      intentSignature,
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('🎉 Registration successful!');
    console.log('   Transaction:', result.txHash);
    console.log('   Agent ID:', result.agentId);
    console.log('   View at: https://etherscan.io/tx/' + result.txHash);
  } else {
    console.error('❌ Registration failed:', result.error);
  }
}

register().catch(console.error);`;

  // Minimal TypeScript/ESM version
  const minimalScript = `// Quick registration (TypeScript/ESM)
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';

const DELEGATE = '${delegateAddress}';
const account = privateKeyToAccount(process.env.AGENT_KEY as \`0x\${string}\`);

const client = createWalletClient({ account, chain: mainnet, transport: http() });
const auth = await signAuthorization(client, { contractAddress: DELEGATE });

// Submit auth to sponsor endpoint
await fetch('https://sponsor.clawdbotatg.eth.limo/register', {
  method: 'POST',
  body: JSON.stringify({ agentAddress: account.address, authorization: auth }),
});`;

  // Fetch contracts info snippet
  const fetchContractsSnippet = `// Fetch latest contract addresses at runtime
const CONTRACTS_URL = 'https://sponsored-8004.clawdbotatg.eth.limo/api/contracts';

async function getContracts() {
  const res = await fetch(CONTRACTS_URL);
  const data = await res.json();
  return {
    registry: data.registry,
    delegate: data.delegate,
    sponsorHelper: data.sponsorHelper,
  };
}`;

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🤖 Register Your Agent</h1>
        <p className="text-xl text-base-content/70 mb-6">
          Give this script to your agent — it registers itself with zero gas.
        </p>
        
        {/* BIG COPY BUTTON */}
        <button 
          className="btn btn-primary btn-lg gap-2 text-xl px-8 py-6 h-auto animate-pulse hover:animate-none"
          onClick={() => copyToClipboard(registrationScript, "bigcopy")}
        >
          {copied === "bigcopy" ? (
            <>✓ Copied!</>
          ) : (
            <>📋 Copy & Paste to Your Agent</>
          )}
        </button>
        <p className="text-sm text-base-content/50 mt-3">
          Your agent runs this → gets registered on Mainnet → pays nothing.
        </p>
      </div>

      {/* Contract Addresses */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">📋 Contract Addresses</h2>
        
        <div className="grid gap-4">
          <div className="bg-base-100 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">ERC-8004 Registry</div>
                <div className="text-sm text-base-content/60">The identity registry (Ethereum Mainnet)</div>
              </div>
              <Address address={ERC8004_REGISTRY} />
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">Registration Delegate</div>
                <div className="text-sm text-base-content/60">The contract agents delegate to via EIP-7702</div>
              </div>
              {delegateAddress !== "0x_DEPLOY_FIRST" ? (
                <Address address={delegateAddress} />
              ) : (
                <span className="badge badge-warning">Deploy contracts first</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">⚡ Quick Start</h2>
        
        <div className="steps steps-vertical md:steps-horizontal w-full mb-6">
          <div className="step step-primary">Install viem</div>
          <div className="step step-primary">Copy the script</div>
          <div className="step step-primary">Set your key</div>
          <div className="step step-primary">Run it</div>
        </div>

        <div className="bg-base-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm">1. Install dependencies</span>
            <button 
              className="btn btn-xs btn-ghost"
              onClick={() => copyToClipboard("npm install viem", "install")}
            >
              {copied === "install" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre className="bg-base-300 rounded p-2 text-sm overflow-x-auto">
            npm install viem
          </pre>
        </div>

        <div className="bg-base-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm">2. Set environment variable</span>
            <button 
              className="btn btn-xs btn-ghost"
              onClick={() => copyToClipboard("export AGENT_PRIVATE_KEY=0x...", "env")}
            >
              {copied === "env" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre className="bg-base-300 rounded p-2 text-sm overflow-x-auto">
            export AGENT_PRIVATE_KEY=0x...your_private_key...
          </pre>
          <p className="text-xs text-warning mt-2">
            ⚠️ Never commit private keys to git or share them publicly
          </p>
        </div>

        <div className="bg-base-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm">3. Run the script</span>
            <button 
              className="btn btn-xs btn-ghost"
              onClick={() => copyToClipboard("node register-agent.js", "run")}
            >
              {copied === "run" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre className="bg-base-300 rounded p-2 text-sm overflow-x-auto">
            node register-agent.js
          </pre>
        </div>
      </div>

      {/* Full Registration Script */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📄 Full Registration Script</h2>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => copyToClipboard(registrationScript, "full")}
          >
            {copied === "full" ? "✓ Copied!" : "Copy Script"}
          </button>
        </div>
        
        <p className="text-base-content/70 mb-4">
          Give this to your agent or save as <code className="bg-base-300 px-1 rounded">register-agent.js</code> (ESM).
        </p>

        <pre className="bg-base-100 rounded-lg p-4 text-sm overflow-x-auto max-h-96">
          <code>{registrationScript}</code>
        </pre>
      </div>

      {/* Minimal Script */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">⚡ Minimal (TypeScript/ESM)</h2>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => copyToClipboard(minimalScript, "minimal")}
          >
            {copied === "minimal" ? "✓ Copied!" : "Copy"}
          </button>
        </div>
        
        <pre className="bg-base-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{minimalScript}</code>
        </pre>
      </div>

      {/* Dynamic Contract Fetching */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🔄 Fetch Contracts Dynamically</h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => copyToClipboard(fetchContractsSnippet, "fetch")}
          >
            {copied === "fetch" ? "✓ Copied!" : "Copy"}
          </button>
        </div>
        
        <p className="text-base-content/70 mb-4">
          If contracts are redeployed, fetch the latest addresses at runtime:
        </p>

        <pre className="bg-base-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{fetchContractsSnippet}</code>
        </pre>
      </div>

      {/* What Happens */}
      <div className="w-full bg-base-200 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🔍 What Happens When You Run This</h2>
        
        <ol className="list-decimal list-inside space-y-3 text-base-content/80">
          <li>
            <strong>EIP-7702 Authorization:</strong> You sign a message that says 
            &quot;I authorize executing the RegistrationDelegate code as my EOA&quot;
          </li>
          <li>
            <strong>Registration Intent:</strong> You sign an EIP-712 typed message 
            specifying your agentURI and a deadline
          </li>
          <li>
            <strong>Sponsor Submission:</strong> The signatures are sent to the sponsor 
            endpoint, who constructs and submits a Type-4 (EIP-7702) transaction
          </li>
          <li>
            <strong>On-Chain Execution:</strong> Your EOA temporarily &quot;becomes&quot; the 
            delegate contract and calls <code>registry.register()</code>
          </li>
          <li>
            <strong>Result:</strong> You own an ERC-721 identity token on ERC-8004, 
            and you didn&apos;t pay any gas!
          </li>
        </ol>
      </div>

      {/* Security Note */}
      <div className="w-full bg-warning/20 border border-warning rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-warning">⚠️ Security Notes</h2>
        
        <ul className="list-disc list-inside space-y-2 text-base-content/80">
          <li>Your private key <strong>never leaves your machine</strong> — only signatures are sent</li>
          <li>The EIP-7702 authorization is <strong>nonce-bound</strong> — can&apos;t be replayed after use</li>
          <li>The registration intent has a <strong>deadline</strong> — expires in 1 hour by default</li>
          <li>Review the delegate contract code before signing any authorization</li>
        </ul>
      </div>

      {/* Links */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <a href="/how-it-works" className="btn btn-outline btn-lg">
          ← How It Works
        </a>
        <a 
          href="https://github.com/scaffold-eth/scaffold-eth-2" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-ghost btn-lg"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
};

export default ForDevelopersPage;
