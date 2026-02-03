"use client";

import { useState } from "react";
import Link from "next/link";
import { BlockieAvatar } from "./BlockieAvatar";
import { isAddress } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

type AddressProps = {
  address?: `0x${string}` | string;
  disableAddressLink?: boolean;
  format?: "short" | "long";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
};

const blockExplorerAddressLink = (address: string, blockExplorerBaseURL: string) => {
  return `${blockExplorerBaseURL}/address/${address}`;
};

/**
 * Displays an address (or ENS) with a Blockie image and option to copy address.
 */
export const Address = ({ address, disableAddressLink, format, size = "base" }: AddressProps) => {
  const ens = null; // ENS disabled for now
  const [copySuccess, setCopySuccess] = useState(false);
  const { targetNetwork } = useTargetNetwork();

  // Validate address format
  const validAddress = address && isAddress(address) ? address : undefined;

  // Format the address for display
  const displayAddress =
    format === "long"
      ? validAddress
      : validAddress
        ? `${validAddress.slice(0, 6)}...${validAddress.slice(-4)}`
        : "Invalid address";

  const copyToClipboard = () => {
    if (validAddress) {
      navigator.clipboard.writeText(validAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Determine the block explorer URL
  const blockExplorerBaseURL = targetNetwork?.blockExplorers?.default?.url || "https://etherscan.io";

  if (!validAddress) {
    return <span className="text-error">Invalid address</span>;
  }

  const addressContent = (
    <div className={`flex items-center gap-1 text-${size}`}>
      <BlockieAvatar address={validAddress} size={24} />
      <span className="font-mono">{ens || displayAddress}</span>
      <button
        className="btn btn-ghost btn-xs"
        onClick={e => {
          e.preventDefault();
          copyToClipboard();
        }}
      >
        {copySuccess ? "✓" : "📋"}
      </button>
    </div>
  );

  if (disableAddressLink) {
    return addressContent;
  }

  return (
    <Link
      href={blockExplorerAddressLink(validAddress, blockExplorerBaseURL)}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-80"
    >
      {addressContent}
    </Link>
  );
};
