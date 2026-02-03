// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAgentRegistry
 * @notice Minimal interface for ERC-8004 Agent Identity Registry
 * @dev Based on https://eips.ethereum.org/EIPS/eip-8004
 */
interface IAgentRegistry {
    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue);

    /// @notice Register a new agent with URI and metadata
    function register(string calldata agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId);

    /// @notice Register a new agent with just URI
    function register(string calldata agentURI) external returns (uint256 agentId);

    /// @notice Register a new agent (URI added later)
    function register() external returns (uint256 agentId);

    /// @notice Update the agent's URI
    function setAgentURI(uint256 agentId, string calldata newURI) external;

    /// @notice Get the agent wallet address
    function getAgentWallet(uint256 agentId) external view returns (address);
}
