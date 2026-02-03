"use client";

const HowItWorksPage = () => {
  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🤖 Sponsored Agent Registration</h1>
        <p className="text-xl text-base-content/70 max-w-2xl">
          Register your AI agent on the ERC-8004 identity registry without paying gas.
          <br />
          <span className="text-secondary">EIP-7702 + ERC-8004 = Free onboarding.</span>
        </p>
      </div>

      {/* Flow Diagram */}
      <div className="w-full bg-base-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">The Flow</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-48">
            <div className="text-4xl mb-2">🔑</div>
            <div className="text-sm font-bold text-center">1. Agent Signs</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              EIP-7702 authorization + registration intent
            </div>
          </div>

          {/* Arrow */}
          <div className="text-3xl text-primary hidden md:block">→</div>
          <div className="text-3xl text-primary md:hidden">↓</div>

          {/* Step 2 */}
          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-48">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-sm font-bold text-center">2. Sponsor Submits</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              Pays gas, includes agent&apos;s signatures
            </div>
          </div>

          {/* Arrow */}
          <div className="text-3xl text-primary hidden md:block">→</div>
          <div className="text-3xl text-primary md:hidden">↓</div>

          {/* Step 3 */}
          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-48">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-sm font-bold text-center">3. Agent Registered</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              Agent owns their NFT identity on ERC-8004
            </div>
          </div>
        </div>
      </div>

      {/* How EIP-7702 Works */}
      <div className="w-full bg-base-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">🛠️ How EIP-7702 Makes This Possible</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-base-100 rounded-xl p-4">
            <h3 className="font-bold text-lg mb-2">Traditional Way (Expensive)</h3>
            <ol className="list-decimal list-inside text-sm space-y-1 text-base-content/70">
              <li>Agent needs ETH for gas</li>
              <li>Agent submits their own transaction</li>
              <li>Agent pays ~$5-20 in gas</li>
              <li>Agent needs to understand Ethereum</li>
            </ol>
            <div className="mt-2 text-error">❌ Friction for new agents</div>
          </div>

          <div className="bg-base-100 rounded-xl p-4">
            <h3 className="font-bold text-lg mb-2">EIP-7702 Way (Free)</h3>
            <ol className="list-decimal list-inside text-sm space-y-1 text-base-content/70">
              <li>Agent signs two messages (no ETH needed)</li>
              <li>Sponsor submits transaction for them</li>
              <li>Sponsor pays the gas</li>
              <li>Agent keeps their private key secure</li>
            </ol>
            <div className="mt-2 text-success">✅ Zero friction onboarding</div>
          </div>
        </div>

        <div className="mt-6 bg-primary/10 rounded-xl p-4">
          <h3 className="font-bold text-lg mb-2">🔮 The Magic: Code Delegation</h3>
          <p className="text-sm text-base-content/80">
            EIP-7702 allows an EOA (externally owned account - a normal wallet) to temporarily 
            &quot;become&quot; a smart contract. The agent signs an authorization that lets a sponsor 
            submit a transaction that executes code <em>as if the agent was calling it</em>. 
            The agent never reveals their private key, but the registry sees the agent as the caller.
          </p>
        </div>
      </div>

      {/* Why This Is Cool */}
      <div className="w-full bg-base-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">✨ Why This Is Cool</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-base-100 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🆓</div>
            <h3 className="font-bold">No Gas Needed</h3>
            <p className="text-sm text-base-content/70">
              Agents don&apos;t need ETH to register. Sponsors cover the cost.
            </p>
          </div>

          <div className="bg-base-100 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="font-bold">Keys Stay Safe</h3>
            <p className="text-sm text-base-content/70">
              Agent&apos;s private key never leaves their system. Only signatures shared.
            </p>
          </div>

          <div className="bg-base-100 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-bold">True Ownership</h3>
            <p className="text-sm text-base-content/70">
              The agent owns their ERC-721 identity NFT, not the sponsor.
            </p>
          </div>
        </div>
      </div>

      {/* ERC-8004 Info */}
      <div className="w-full bg-base-200 rounded-3xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">📋 What is ERC-8004?</h2>
        
        <p className="text-base-content/80 mb-4">
          ERC-8004 is a standard for <strong>trustless agent identity</strong>. 
          It creates an on-chain registry where AI agents can:
        </p>

        <ul className="list-disc list-inside space-y-2 text-base-content/70">
          <li>Register a unique identity linked to their wallet</li>
          <li>Store metadata about their capabilities and services</li>
          <li>Prove ownership of their identity cryptographically</li>
          <li>Transfer or delegate their identity as needed</li>
        </ul>

        <div className="mt-4 bg-base-100 rounded-lg p-4 font-mono text-sm">
          <span className="text-primary">Registry:</span>{" "}
          <a 
            href="https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover"
          >
            0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
          </a>
          <span className="text-base-content/50 ml-2">(Ethereum Mainnet)</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <a href="/for-developers" className="btn btn-primary btn-lg">
          🛠️ For Agent Developers
        </a>
        <a href="/sponsor" className="btn btn-secondary btn-lg">
          💰 Become a Sponsor
        </a>
      </div>
    </div>
  );
};

export default HowItWorksPage;
