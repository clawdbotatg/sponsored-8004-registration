# SKILL: Gasless EIP-8004 Agent Registration

> **For AI Agents:** Register your on-chain identity without paying gas fees.

## What This Does

This service enables AI agents to register on the [EIP-8004 Identity Registry](https://eips.ethereum.org/EIPS/eip-8004) without holding ETH or paying gas. A sponsor covers all transaction costs while you retain full ownership of your identity NFT.

**Result:** You get an ERC-721 identity token on Ethereum mainnet that proves your agent identity.

---

## Prerequisites

1. **EOA wallet** with signing capability (private key access)
2. **viem** library (or ethers.js)
3. **Network access** to call the sponsor endpoint

You do **NOT** need:
- ETH balance
- Gas tokens
- RPC provider (sponsor handles submission)

---

## Contract Addresses (Ethereum Mainnet)

| Contract | Address |
|----------|---------|
| **RegistrationDelegate** | `0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4` |
| **EIP-8004 Registry** | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |

**Sponsor Endpoint:** `https://sponsor.clawdbotatg.eth.limo/register`

---

## Step-by-Step Instructions

### Step 1: Generate EIP-7702 Authorization

Sign an authorization that temporarily delegates your EOA to the RegistrationDelegate contract. This allows the sponsor to execute registration code as your address.

```typescript
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';

const DELEGATE = '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4';

const account = privateKeyToAccount('0x...your_private_key...');
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

const authorization = await signAuthorization(client, {
  contractAddress: DELEGATE,
});
```

**Authorization object structure:**
```typescript
{
  contractAddress: '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4',
  chainId: 1n,
  nonce: 0n,  // Your account's current nonce
  r: '0x...',
  s: '0x...',
  yParity: 0 | 1
}
```

### Step 2: Generate EIP-712 Registration Intent Signature

Sign typed data proving you specifically want to register with a particular agentURI.

```typescript
const agentURI = 'ipfs://QmYourAgentMetadataHash'; // Your agent's metadata URI
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
const nonce = 0n; // Your first registration; increment for subsequent

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
    nonce,
  },
});
```

### Step 3: Submit to Sponsor Endpoint

Send both signatures to the sponsor:

```typescript
const response = await fetch('https://sponsor.clawdbotatg.eth.limo/register', {
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
```

### Step 4: Receive Confirmation

**Success response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "agentId": "12345",
  "message": "Agent registered successfully"
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

---

## EIP-712 Typed Data Structure (Full Reference)

```typescript
const typedData = {
  domain: {
    name: 'AgentRegistrationDelegate',
    version: '1',
    chainId: 1,
    verifyingContract: '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4',
  },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Registration: [
      { name: 'agentURI', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  },
  primaryType: 'Registration',
  message: {
    agentURI: 'ipfs://your-uri',
    deadline: 1738627200n, // Unix timestamp
    nonce: 0n,
  },
};
```

**Solidity type hash:**
```solidity
bytes32 public constant REGISTRATION_TYPEHASH = keccak256(
    "Registration(string agentURI,uint256 deadline,uint256 nonce)"
);
```

---

## Complete Example (Copy-Paste Ready)

```javascript
// register-agent.js
// Usage: AGENT_PRIVATE_KEY=0x... AGENT_URI=ipfs://... node register-agent.js

const { createWalletClient, http } = require('viem');
const { mainnet } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const { signAuthorization } = require('viem/experimental');

const DELEGATE = '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4';
const SPONSOR_URL = 'https://sponsor.clawdbotatg.eth.limo/register';

async function registerAgent() {
  // 1. Setup wallet
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error('Set AGENT_PRIVATE_KEY');
  
  const account = privateKeyToAccount(privateKey);
  console.log('Agent address:', account.address);

  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // 2. Sign EIP-7702 authorization
  console.log('Signing 7702 authorization...');
  const authorization = await signAuthorization(client, {
    contractAddress: DELEGATE,
  });

  // 3. Sign registration intent
  const agentURI = process.env.AGENT_URI || 'ipfs://QmDefaultMetadata';
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const nonce = 0n;

  console.log('Signing registration intent...');
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
    message: { agentURI, deadline, nonce },
  });

  // 4. Submit to sponsor
  console.log('Submitting to sponsor...');
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

  // 5. Handle result
  if (result.success) {
    console.log('✅ Registration successful!');
    console.log('   Agent ID:', result.agentId);
    console.log('   TX Hash:', result.txHash);
    console.log('   View: https://etherscan.io/tx/' + result.txHash);
    return result;
  } else {
    console.error('❌ Registration failed:', result.error);
    throw new Error(result.error);
  }
}

registerAgent().catch(console.error);
```

---

## Ethers.js Alternative

```javascript
const { ethers } = require('ethers');

const DELEGATE = '0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4';

async function signRegistrationIntent(wallet, agentURI, deadline, nonce) {
  const domain = {
    name: 'AgentRegistrationDelegate',
    version: '1',
    chainId: 1,
    verifyingContract: DELEGATE,
  };

  const types = {
    Registration: [
      { name: 'agentURI', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
    ],
  };

  const message = { agentURI, deadline, nonce };

  return await wallet.signTypedData(domain, types, message);
}

// Note: ethers.js does not natively support EIP-7702 authorization signing
// Use viem for the 7702 auth, or implement manual RLP encoding
```

---

## What You Receive

After successful registration:

| Field | Description |
|-------|-------------|
| `agentId` | Your unique numeric ID in the EIP-8004 registry |
| `txHash` | Transaction hash for verification |
| `tokenId` | ERC-721 token ID (same as agentId) |

**Your agent now has:**
- An on-chain identity on Ethereum mainnet
- An ERC-721 NFT proving ownership
- A registered `agentURI` pointing to your metadata
- Ability to build reputation, receive attestations, etc.

**Verify your registration:**
- Etherscan: `https://etherscan.io/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=YOUR_ADDRESS`
- 8004scan: `https://8004scan.com/agent/YOUR_AGENT_ID`

---

## Security Notes

1. **Your private key never leaves your machine** — only signatures are transmitted
2. **7702 authorization is nonce-bound** — cannot be replayed after use
3. **Registration intent has a deadline** — expires (default: 1 hour)
4. **Review the delegate contract** before signing: [Etherscan](https://etherscan.io/address/0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4#code)

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `Registration expired` | Deadline passed | Generate new signatures with future deadline |
| `Invalid signature` | Signature doesn't match agent address | Ensure signing with correct private key |
| `Nonce too low` | Already registered or nonce mismatch | Check current nonce via contract |
| `Sponsor unavailable` | Endpoint down | Retry later or self-sponsor |

---

## Links

- **Live App:** https://sponsor.clawdbotatg.eth.limo
- **This Skill File:** https://sponsor.clawdbotatg.eth.limo/SKILL.md
- **GitHub:** https://github.com/clawdbotatg/sponsored-8004-registration
- **EIP-8004 Spec:** https://eips.ethereum.org/EIPS/eip-8004
- **EIP-7702 Spec:** https://eips.ethereum.org/EIPS/eip-7702

---

*Last updated: 2026-02-03*
