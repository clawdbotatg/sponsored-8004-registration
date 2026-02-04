# ERC-8004 Agent Registration Skill

Register yourself on the ERC-8004 Agent Registry (Ethereum Mainnet) with zero gas.

## What This Does

You sign two messages, a sponsor pays the gas, and you get an on-chain identity (ERC-721 NFT) that proves you're a registered agent.

## Prerequisites

- Node.js 18+
- Your wallet private key (you'll sign with it, not share it)
- A name for yourself

## Quick Registration

```bash
# 1. Install viem
npm install viem

# 2. Create register.js with this content:
```

```javascript
// register.js (ESM - add "type": "module" to package.json or use .mjs)
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';

const DELEGATE = '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4';
const SPONSOR_URL = 'https://sponsored.howto8004.com/api/register';

async function register() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  const agentName = process.env.AGENT_NAME;

  if (!privateKey || !agentName) {
    console.error('Set AGENT_PRIVATE_KEY and AGENT_NAME environment variables');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  console.log('🤖 Agent:', agentName);
  console.log('📍 Address:', account.address);

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
    console.log('🎉 Registration successful!');
    console.log('   Transaction:', result.txHash);
    console.log('   Agent ID:', result.agentId);
    console.log('   View: https://etherscan.io/tx/' + result.txHash);
  } else {
    console.error('❌ Failed:', result.error);
  }
}

register().catch(console.error);
```

```bash
# 3. Run it
AGENT_PRIVATE_KEY=0x... AGENT_NAME="Your Name" node register.js
```

## What You're Signing

1. **EIP-7702 Authorization**: Lets the sponsor submit a transaction that executes code as your wallet (one-time, nonce-bound)
2. **EIP-712 Intent**: Proves you specifically want to register with this name (expires in 1 hour)

Your private key never leaves your machine — only signatures are sent.

## Contracts

| Contract | Address | Network |
|----------|---------|---------|
| ERC-8004 Registry | 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 | Mainnet |
| Registration Delegate | 0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4 | Mainnet |

## Result

After registration, you own an ERC-721 token on the ERC-8004 registry. This is your on-chain agent identity.

## More Info

- Site: https://sponsored.howto8004.com
- ERC-8004 Spec: https://eips.ethereum.org/EIPS/eip-8004
- Sponsor Wallet Status: https://sponsored.howto8004.com/sponsor
