"use client";

import Link from "next/link";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

const Home = () => {
  // Get delegate address from deployed contracts
  const getDelegateAddress = () => {
    const localhost = (deployedContracts as any)?.[31337]?.RegistrationDelegate?.address;
    const mainnet = (deployedContracts as any)?.[1]?.RegistrationDelegate?.address;
    return localhost || mainnet || null;
  };

  const delegateAddress = getDelegateAddress();

  return (
    <div className="flex flex-col items-center gap-10 py-10 px-4">
      {/* Hero */}
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">
          🤖 Sponsored Agent Registration
        </h1>
        <p className="text-xl text-base-content/70 mb-4">
          Register your AI agent on <strong>ERC-8004</strong> without paying gas.
        </p>
        <p className="text-lg text-secondary">
          Powered by EIP-7702 code delegation.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-title">Registry</div>
          <div className="stat-value text-sm font-mono">
            <a 
              href={`https://etherscan.io/address/${ERC8004_REGISTRY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover"
            >
              {ERC8004_REGISTRY.slice(0, 10)}...
            </a>
          </div>
          <div className="stat-desc">ERC-8004 on Mainnet</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Delegate</div>
          <div className="stat-value text-sm font-mono">
            {delegateAddress ? (
              delegateAddress.slice(0, 10) + "..."
            ) : (
              <span className="text-warning">Not deployed</span>
            )}
          </div>
          <div className="stat-desc">EIP-7702 Target</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Gas Cost</div>
          <div className="stat-value text-primary">$0</div>
          <div className="stat-desc">For agents</div>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Link href="/how-it-works" className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <h2 className="card-title">
              <span className="text-2xl">📖</span> How It Works
            </h2>
            <p className="text-base-content/70">
              Learn how EIP-7702 + ERC-8004 enable gas-free agent registration.
            </p>
            <div className="card-actions justify-end">
              <span className="btn btn-primary btn-sm">Learn More →</span>
            </div>
          </div>
        </Link>

        <Link href="/for-developers" className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <h2 className="card-title">
              <span className="text-2xl">🛠️</span> For Developers
            </h2>
            <p className="text-base-content/70">
              Copy-paste code snippets to register your agent in minutes.
            </p>
            <div className="card-actions justify-end">
              <span className="btn btn-secondary btn-sm">Get Code →</span>
            </div>
          </div>
        </Link>

        <Link href="/sponsor" className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <h2 className="card-title">
              <span className="text-2xl">💰</span> Sponsor Dashboard
            </h2>
            <p className="text-base-content/70">
              Submit sponsored transactions and help agents get registered.
            </p>
            <div className="card-actions justify-end">
              <span className="btn btn-accent btn-sm">Open Dashboard →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* The Flow Diagram */}
      <div className="w-full max-w-4xl bg-base-200 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">The Registration Flow</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-40">
            <div className="text-3xl mb-2">🤖</div>
            <div className="font-bold text-center">Agent Signs</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              7702 auth + intent
            </div>
          </div>

          <div className="text-2xl text-primary hidden md:block">→</div>
          <div className="text-2xl text-primary md:hidden">↓</div>

          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-40">
            <div className="text-3xl mb-2">📤</div>
            <div className="font-bold text-center">Submit to Sponsor</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              API endpoint
            </div>
          </div>

          <div className="text-2xl text-primary hidden md:block">→</div>
          <div className="text-2xl text-primary md:hidden">↓</div>

          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-40">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-bold text-center">Sponsor Pays Gas</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              Type-4 tx
            </div>
          </div>

          <div className="text-2xl text-primary hidden md:block">→</div>
          <div className="text-2xl text-primary md:hidden">↓</div>

          <div className="flex flex-col items-center p-4 bg-base-100 rounded-xl w-40">
            <div className="text-3xl mb-2">🎉</div>
            <div className="font-bold text-center">Agent Owns NFT</div>
            <div className="text-xs text-base-content/60 text-center mt-1">
              ERC-8004 identity
            </div>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="w-full max-w-4xl">
        <div className="bg-base-200 rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">📋 Contract Addresses</h2>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Address</th>
                  <th>Network</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ERC-8004 Registry</td>
                  <td><Address address={ERC8004_REGISTRY} /></td>
                  <td><span className="badge badge-primary">Mainnet</span></td>
                </tr>
                {delegateAddress && (
                  <tr>
                    <td>Registration Delegate</td>
                    <td><Address address={delegateAddress} /></td>
                    <td><span className="badge badge-secondary">Deployed</span></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col md:flex-row gap-4">
        <Link href="/for-developers" className="btn btn-primary btn-lg">
          Get Started →
        </Link>
        <a 
          href="https://eips.ethereum.org/EIPS/eip-8004" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-outline btn-lg"
        >
          Read ERC-8004 Spec
        </a>
      </div>
    </div>
  );
};

export default Home;
