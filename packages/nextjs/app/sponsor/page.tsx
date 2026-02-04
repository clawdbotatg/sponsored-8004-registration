"use client";

import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";

interface SponsorInfo {
  address: string;
  balance: string;
  balanceWei: string;
  ready: boolean;
}

const SponsorPage = () => {
  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsorInfo = async () => {
      try {
        const res = await fetch("/api/sponsor");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch sponsor info");
        }
        const data = await res.json();
        setSponsorInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSponsorInfo();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSponsorInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70">Loading sponsor info...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-error">Error</h2>
        <p className="text-base-content/70">{error}</p>
      </div>
    );
  }

  if (!sponsorInfo) {
    return null;
  }

  const balanceFloat = parseFloat(sponsorInfo.balance);
  const formattedBalance = balanceFloat.toFixed(4);

  return (
    <div className="flex flex-col items-center gap-10 py-10 px-4">
      {/* Hero */}
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-4">💰 Sponsor Wallet</h1>
        <p className="text-xl text-base-content/70">
          This wallet pays gas for agent registrations
        </p>
      </div>

      {/* Status Card */}
      <div className="card bg-base-200 shadow-xl w-full max-w-lg">
        <div className="card-body items-center text-center gap-6">
          {/* Status Badge */}
          <div className={`badge badge-lg gap-2 ${sponsorInfo.ready ? "badge-success" : "badge-error"}`}>
            <div className={`w-3 h-3 rounded-full ${sponsorInfo.ready ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
            {sponsorInfo.ready ? "Ready to Sponsor" : "Low Balance"}
          </div>

          {/* Address */}
          <div className="w-full">
            <div className="text-sm text-base-content/60 mb-2">Wallet Address</div>
            <div className="flex justify-center">
              <Address address={sponsorInfo.address as `0x${string}`} format="long" />
            </div>
          </div>

          {/* Divider */}
          <div className="divider my-0"></div>

          {/* Balance */}
          <div className="w-full">
            <div className="text-sm text-base-content/60 mb-2">ETH Balance (Mainnet)</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-bold">{formattedBalance}</span>
              <span className="text-2xl text-base-content/60">ETH</span>
            </div>
            {!sponsorInfo.ready && (
              <p className="text-sm text-warning mt-3">
                ⚠️ Balance is below 0.01 ETH - please top up to continue sponsoring
              </p>
            )}
          </div>

          {/* Etherscan Link */}
          <a
            href={`https://etherscan.io/address/${sponsorInfo.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm gap-2"
          >
            View on Etherscan
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">
              <span>🔄</span> Auto-Refresh
            </h3>
            <p className="text-sm text-base-content/70">
              Balance updates every 30 seconds automatically.
            </p>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">
              <span>⛽</span> Gas Costs
            </h3>
            <p className="text-sm text-base-content/70">
              Each registration costs ~0.002-0.005 ETH depending on gas prices.
            </p>
          </div>
        </div>
      </div>

      {/* How to Top Up */}
      <div className="bg-base-200 rounded-3xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-center">💸 How to Top Up</h2>
        <ol className="list-decimal list-inside space-y-2 text-base-content/80">
          <li>Copy the sponsor wallet address above</li>
          <li>Send ETH from any wallet on Ethereum Mainnet</li>
          <li>Wait for confirmation - balance updates automatically</li>
        </ol>
      </div>
    </div>
  );
};

export default SponsorPage;
