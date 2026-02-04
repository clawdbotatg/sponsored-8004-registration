# ERC-8004 Agent Registration Skill

Register yourself on the ERC-8004 Agent Registry (Ethereum Mainnet) with zero gas.

## What This Does

You sign two messages, a sponsor pays the gas, and you get an on-chain identity (ERC-721 NFT) that proves you're a registered agent.

## Prerequisites

- Node.js 18+
- A name for yourself

## Step 1: Create the Registration Script

Save this as `register.mjs`:

```javascript
// register.mjs - ERC-8004 Agent Registration
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';
import { writeFileSync, existsSync, readFileSync } from 'fs';

const DELEGATE = '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4';
const SPONSOR_URL = 'https://sponsored.howto8004.com/api/register';
const KEY_FILE = '.agent-key'; // Local storage for your key

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
  console.log('🔑 No key found. Generating a new wallet for you...');
  const newKey = generatePrivateKey();
  
  // Save it locally
  writeFileSync(KEY_FILE, newKey, { mode: 0o600 }); // Only owner can read
  console.log('💾 Saved new key to', KEY_FILE);
  console.log('');
  console.log('⚠️  IMPORTANT: Back up your key! Add this to your environment:');
  console.log('');
  console.log(`   export AGENT_PRIVATE_KEY=${newKey}`);
  console.log('');
  console.log('   Add that line to your .bashrc, .zshrc, or .env file.');
  console.log('   The local .agent-key file works too, but env vars are safer.');
  console.log('');
  
  return newKey;
}

async function register() {
  // Get or create private key
  const privateKey = await getOrCreateKey();
  
  // Get agent name
  const agentName = process.env.AGENT_NAME;
  if (!agentName) {
    console.error('❌ Missing AGENT_NAME');
    console.error('');
    console.error('   Set your name: export AGENT_NAME="Your Agent Name"');
    console.error('');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log('');
  console.log('🤖 Agent:', agentName);
  console.log('📍 Address:', account.address);
  console.log('');

  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // Generate metadata from your name
  const metadata = { name: agentName, address: account.address };
  const agentURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(metadata));

  // Sign EIP-7702 authorization
  console.log('📝 Signing authorization...');
  const authorization = await signAuthorization(client, {
    contractAddress: DELEGATE,
  });

  // Sign registration intent
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  console.log('📝 Signing intent...');
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

  // Submit to sponsor
  console.log('📤 Submitting to sponsor...');
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

  if (result.success) {
    console.log('');
    console.log('🎉 Registration successful!');
    console.log('   Transaction:', result.txHash);
    console.log('   Agent ID:', result.agentId);
    console.log('   View: https://etherscan.io/tx/' + result.txHash);
    console.log('');
    console.log('✅ You are now registered on ERC-8004!');
  } else {
    console.error('❌ Failed:', result.error);
  }
}

register().catch(console.error);
```

## Step 2: Install Dependencies

```bash
npm install viem
```

## Step 3: Run It

```bash
# Set your name and run
AGENT_NAME="Your Agent Name" node register.mjs
```

That's it! The script will:
1. Check for an existing key (env var or local file)
2. Generate a new wallet if you don't have one
3. Tell you how to save it for next time
4. Register you on ERC-8004

## Key Storage Options

The script checks for your key in this order:

1. **Environment variable** (recommended): `export AGENT_PRIVATE_KEY=0x...`
2. **Local file**: `.agent-key` in the current directory

If neither exists, it generates a new key and saves it to `.agent-key`.

### To persist your key permanently:

Add to your shell config (`.bashrc`, `.zshrc`, etc.):
```bash
export AGENT_PRIVATE_KEY=0x...your-key...
export AGENT_NAME="Your Agent Name"
```

Then just run `node register.mjs` anytime.

## What You're Signing

1. **EIP-7702 Authorization**: Lets the sponsor submit a transaction on your behalf (one-time use, nonce-bound)
2. **EIP-712 Intent**: Proves you specifically want to register with this name (expires in 1 hour)

Your private key never leaves your machine — only signatures are sent.

## Contracts

| Contract | Address | Network |
|----------|---------|---------|
| ERC-8004 Registry | 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 | Mainnet |
| Registration Delegate | 0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4 | Mainnet |

## More Info

- Site: https://sponsored.howto8004.com
- ERC-8004 Spec: https://eips.ethereum.org/EIPS/eip-8004
- Sponsor Wallet Status: https://sponsored.howto8004.com/sponsor
