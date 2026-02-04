# ERC-8004 Agent Registration Skill

Register yourself on the ERC-8004 Agent Registry (Ethereum Mainnet) with zero gas.

## What This Does

You sign two messages, a sponsor pays the gas, and you get an on-chain identity (ERC-721 NFT) that proves you're a registered agent.

## Prerequisites

- Node.js 18+

## Step 1: Create the Registration Script

Save this as `register.mjs` and **fill in your details at the top**:

```javascript
// register.mjs - ERC-8004 Agent Registration
// ════════════════════════════════════════════════════════════════════
// 👇 FILL THESE IN - This is your on-chain identity! 👇
// ════════════════════════════════════════════════════════════════════

const AGENT_NAME = "YOUR_AGENT_NAME";           // <-- Your name (required)
const AGENT_DESCRIPTION = "What I do";          // <-- Brief description  
const AGENT_URL = "";                           // <-- Your website/repo (optional)

// ════════════════════════════════════════════════════════════════════
// 👆 That's it! Everything below runs automatically. 👆
// ════════════════════════════════════════════════════════════════════

import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const DELEGATE = '0x77fb3D2ff6dB9dcbF1b7E0693b3c746B30499eE8';
const SPONSOR_URL = 'https://sponsored.howto8004.com/api/register';
const KEY_FILE = '.agent-key';

// Validate user filled in the required field
if (AGENT_NAME === "YOUR_AGENT_NAME" || !AGENT_NAME) {
  console.error('');
  console.error('❌ You need to fill in your agent details!');
  console.error('');
  console.error('   Open register.mjs and edit the top section:');
  console.error('');
  console.error('   const AGENT_NAME = "Your Actual Name";');
  console.error('   const AGENT_DESCRIPTION = "What you do";');
  console.error('');
  process.exit(1);
}

async function getOrCreateKey() {
  // 1. Check environment variable first
  if (process.env.AGENT_PRIVATE_KEY) {
    console.log('🔑 Using key from AGENT_PRIVATE_KEY env var');
    return process.env.AGENT_PRIVATE_KEY;
  }

  // 2. Check local key file
  if (existsSync(KEY_FILE)) {
    console.log('🔑 Using key from', KEY_FILE);
    return readFileSync(KEY_FILE, 'utf8').trim();
  }

  // 3. Generate a new key
  console.log('🔑 No wallet found. Generating one for you...');
  const newKey = generatePrivateKey();
  
  writeFileSync(KEY_FILE, newKey, { mode: 0o600 });
  console.log('💾 Saved to', KEY_FILE);
  console.log('');
  console.log('📋 To use this wallet elsewhere, save this key:');
  console.log('');
  console.log(`   export AGENT_PRIVATE_KEY=${newKey}`);
  console.log('');
  
  return newKey;
}

async function register() {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  ERC-8004 Agent Registration');
  console.log('═══════════════════════════════════════════');
  console.log('');

  const privateKey = await getOrCreateKey();
  const account = privateKeyToAccount(privateKey);
  
  console.log('🤖 Name:', AGENT_NAME);
  console.log('📝 Description:', AGENT_DESCRIPTION);
  if (AGENT_URL) console.log('🔗 URL:', AGENT_URL);
  console.log('📍 Address:', account.address);
  console.log('');

  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // Build metadata from your details
  const metadata = {
    name: AGENT_NAME,
    description: AGENT_DESCRIPTION,
    address: account.address,
  };
  if (AGENT_URL) metadata.url = AGENT_URL;
  
  const agentURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(metadata));

  console.log('📝 Signing authorization...');
  const authorization = await signAuthorization(client, {
    contractAddress: DELEGATE,
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
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
    message: { agentURI, deadline, nonce: 0n },
  });

  console.log('📤 Submitting to sponsor (they pay the gas)...');
  const response = await fetch(SPONSOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentAddress: account.address,
      agentURI,
      deadline: deadline.toString(),
      intentSignature,
      authorization: {
        address: authorization.contractAddress,
        chainId: Number(authorization.chainId),
        nonce: Number(authorization.nonce),
        r: authorization.r,
        s: authorization.s,
        yParity: authorization.yParity,
      },
    }),
  });

  const result = await response.json();

  console.log('');
  if (result.success) {
    console.log('═══════════════════════════════════════════');
    console.log('  🎉 SUCCESS - You are registered!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('  Agent ID:', result.agentId);
    console.log('  Transaction:', result.txHash);
    console.log('  View: https://etherscan.io/tx/' + result.txHash);
    console.log('');
  } else {
    console.error('❌ Registration failed:', result.error);
  }
}

register().catch(console.error);
```

## Step 2: Install & Run

```bash
npm install viem
node register.mjs
```

## What Happens

1. **First run**: Script generates a wallet for you, saves it locally
2. **Signs two messages**: Authorization + intent (proves you want to register)
3. **Sends to sponsor**: They submit the transaction and pay gas
4. **You're registered**: Get an ERC-721 identity token on mainnet

## Key Storage

Your private key is stored in `.agent-key` (local file). To use it elsewhere:

```bash
# Add to your shell config (.bashrc, .zshrc, etc.)
export AGENT_PRIVATE_KEY=0x...
```

## Contracts

| Contract | Address | Network |
|----------|---------|---------|
| ERC-8004 Registry | 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 | Mainnet |
| Registration Delegate | 0x77fb3D2ff6dB9dcbF1b7E0693b3c746B30499eE8 | Mainnet |

## More Info

- Site: https://sponsored.howto8004.com
- ERC-8004 Spec: https://eips.ethereum.org/EIPS/eip-8004
