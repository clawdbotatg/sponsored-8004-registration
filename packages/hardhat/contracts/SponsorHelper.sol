// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RegistrationDelegate.sol";
import "./IAgentRegistry.sol";

/**
 * @title SponsorHelper
 * @notice Helper contract for sponsors to execute registrations
 * @dev This contract is NOT required for 7702 sponsorship to work.
 *      It's a convenience wrapper that can be useful for:
 *      - Batching multiple registrations
 *      - Adding sponsor-side logic (rate limiting, whitelisting, etc.)
 *      - Emitting sponsor-specific events for tracking
 * 
 *      The actual 7702 flow works by:
 *      1. Sponsor submits type-4 tx with agent's auth
 *      2. Tx destination is the agent's EOA (now delegated)
 *      3. Tx data calls RegistrationDelegate.executeRegistration(...)
 */
contract SponsorHelper {
    RegistrationDelegate public immutable delegate;
    IAgentRegistry public immutable registry;

    // Sponsor tracking
    mapping(address => uint256) public sponsorRegistrationCount;
    
    event Sponsored(
        address indexed sponsor,
        address indexed agent,
        uint256 indexed agentId
    );

    constructor(address _delegate, address _registry) {
        delegate = RegistrationDelegate(_delegate);
        registry = IAgentRegistry(_registry);
    }

    /**
     * @notice Record a sponsored registration (call after successful 7702 tx)
     * @dev This is for tracking only - the actual registration happens via 7702
     */
    function recordSponsorship(address agent, uint256 agentId) external {
        // Verify the agent actually owns this agentId
        require(
            registry.getAgentWallet(agentId) == agent,
            "Agent doesn't own this ID"
        );
        
        sponsorRegistrationCount[msg.sender]++;
        emit Sponsored(msg.sender, agent, agentId);
    }

    /**
     * @notice Get sponsor's total registration count
     */
    function getSponsorCount(address sponsor) external view returns (uint256) {
        return sponsorRegistrationCount[sponsor];
    }

    /**
     * @notice Helper to compute the 7702 authorization message hash
     * @dev The agent signs this to create the auth tuple for type-4 tx
     * 
     * Authorization = [chainId, delegateAddress, nonce]
     * Message = keccak256(0x05 || rlp([chainId, delegateAddress, nonce]))
     * 
     * Note: This is informational - actual signing should use proper RLP encoding
     */
    function getAuthMessage(
        uint256 chainId,
        uint256 agentNonce
    ) external view returns (bytes32) {
        // Simplified - actual 7702 uses RLP encoding
        // This is for demonstration purposes
        return keccak256(
            abi.encodePacked(
                bytes1(0x05),  // MAGIC
                chainId,
                address(delegate),
                agentNonce
            )
        );
    }
}
