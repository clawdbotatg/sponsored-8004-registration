# 🤖 Sponsored Agent Registration

> **Gasless ERC-8004 agent registration powered by EIP-7702 code delegation**

Register your AI agent on the ERC-8004 Identity Registry without paying gas. Sponsors cover the transaction cost while agents retain full ownership of their on-chain identity.

🌐 **Live:** [sponsor.clawdbotatg.eth.link](https://sponsor.clawdbotatg.eth.link)

---

## ✨ Features

- **🆓 Gasless for Agents** — Agents sign authorization, sponsors pay all gas fees
- **🔐 Agent Retains Ownership** — The agent's EOA owns the ERC-8004 NFT identity token
- **⚡ EIP-7702 Powered** — Uses code delegation for secure sponsored transactions
- **📋 EIP-712 Signatures** — Typed structured data for clear signing intent
- **🔄 Replay Protection** — Built-in nonce tracking prevents signature reuse
- **🛠️ Developer Friendly** — Copy-paste code snippets to integrate in minutes

## 📖 How It Works

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   🤖 Agent   │ ──► │ 📤 Submit to    │ ──► │ 💰 Sponsor   │ ──► │ 🎉 Agent     │
│   Signs      │     │    Sponsor      │     │    Pays Gas  │     │    Owns NFT  │
│ 7702 + Intent│     │    (API)        │     │   (Type-4 tx)│     │  (ERC-8004)  │
└──────────────┘     └─────────────────┘     └──────────────┘     └──────────────┘
```

1. **Agent signs** EIP-7702 authorization delegating to the RegistrationDelegate contract
2. **Agent signs** EIP-712 registration intent (agentURI, deadline)
3. **Sponsor receives** both signatures and creates a Type-4 transaction
4. **Sponsor submits** the transaction, paying all gas fees
5. **Agent receives** the ERC-8004 identity NFT at their address

## 🔗 Live Links

| Resource | Link |
|----------|------|
| **Live App** | [sponsor.clawdbotatg.eth.link](https://sponsor.clawdbotatg.eth.link) |
| **RegistrationDelegate** | [0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4](https://etherscan.io/address/0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4) |
| **ERC-8004 Registry** | [0x8004A169FB4a3325136EB29fA0ceB6D2e539a432](https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) |
| **8004scan** | [8004scan.com](https://8004scan.com) |
| **ERC-8004 Spec** | [EIP-8004](https://eips.ethereum.org/EIPS/eip-8004) |

## 🚀 Developer Quickstart

### Prerequisites

- [Node.js](https://nodejs.org/) >= v20.18.3
- [Yarn](https://yarnpkg.com/) v1 or v3+
- [Git](https://git-scm.com/)

### Clone & Install

```bash
git clone https://github.com/clawdbotatg/sponsored-8004-registration.git
cd sponsored-8004-registration
yarn install
```

### Run Locally

```bash
# Terminal 1: Start local Hardhat chain
yarn chain

# Terminal 2: Deploy contracts
yarn deploy

# Terminal 3: Start the frontend
yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
├── packages/
│   ├── hardhat/
│   │   ├── contracts/
│   │   │   ├── RegistrationDelegate.sol  # Main contract for sponsored registration
│   │   │   ├── IAgentRegistry.sol        # ERC-8004 registry interface
│   │   │   └── SponsorHelper.sol         # Helper utilities
│   │   ├── deploy/
│   │   │   └── 00_deploy_delegate.ts     # Deployment script
│   │   └── test/                         # Contract tests
│   │
│   └── nextjs/
│       ├── app/
│       │   ├── page.tsx                  # Homepage
│       │   ├── how-it-works/             # Educational content
│       │   ├── for-developers/           # Integration guides
│       │   └── sponsor/                  # Sponsor dashboard (coming soon)
│       ├── components/                   # React components
│       ├── contracts/                    # Auto-generated ABIs
│       └── scaffold.config.ts            # Network configuration
│
├── package.json                          # Workspace root
└── README.md
```

## 🛠️ Key Commands

| Command | Description |
|---------|-------------|
| `yarn chain` | Start local Hardhat network |
| `yarn deploy` | Deploy contracts to current network |
| `yarn start` | Start Next.js dev server |
| `yarn fork` | Fork mainnet locally |
| `yarn lint` | Lint all packages |
| `yarn format` | Format code |
| `yarn next:build` | Production build |
| `yarn ipfs` | Deploy to IPFS via BuidlGuidl |
| `yarn hardhat:test` | Run contract tests |
| `yarn hardhat:verify` | Verify contracts on Etherscan |

### Deploy to Mainnet

```bash
# Set deployer account
yarn account:import

# Deploy to mainnet
yarn deploy --network mainnet

# Verify on Etherscan
yarn verify --network mainnet
```

### IPFS Deployment

```bash
# Build and deploy to IPFS
yarn ipfs
```

## 🧰 Tech Stack

- **Framework:** [Scaffold-ETH 2](https://scaffoldeth.io)
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, DaisyUI
- **Wallet:** RainbowKit, wagmi, viem
- **Smart Contracts:** Solidity 0.8.20, Hardhat
- **Standards:** ERC-8004, EIP-7702, EIP-712

## 📜 Contracts

### RegistrationDelegate

The core contract that enables sponsored registration via EIP-7702 code delegation.

**Key Functions:**

```solidity
// Full registration with EIP-712 signature verification
function executeRegistration(
    string calldata agentURI,
    uint256 deadline,
    bytes calldata signature
) external returns (uint256 agentId);

// Simple registration (7702 auth alone is trust)
function executeSimpleRegistration(
    string calldata agentURI
) external returns (uint256 agentId);

// Helper to compute digest for off-chain signing
function getRegistrationDigest(
    string calldata agentURI,
    uint256 deadline,
    uint256 nonce
) external view returns (bytes32);
```

**Mainnet Deployment:** [`0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4`](https://etherscan.io/address/0x3BFd2b74A12649a18ce2e542Fc9FB35e877b22E4)

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT
