// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IAgentRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RegistrationDelegate
 * @notice Contract that EOAs delegate to via EIP-7702 for sponsored registration
 * @dev When an EOA delegates to this contract via EIP-7702, calls to the EOA
 *      execute this code in the EOA's context. msg.sender becomes the EOA's address.
 * 
 * Flow:
 * 1. Agent (EOA) signs EIP-7702 authorization delegating to this contract
 * 2. Agent signs EIP-712 registration intent (agentURI, deadline)
 * 3. Sponsor creates type-4 tx with agent's auth, calls EOA.executeRegistration(...)
 * 4. This code executes in EOA's context, registers agent on ERC-8004
 * 5. Agent owns the NFT, sponsor paid the gas
 */
contract RegistrationDelegate {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IAgentRegistry public immutable registry;
    
    // Domain separator for EIP-712
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    // Typehash for registration intent
    bytes32 public constant REGISTRATION_TYPEHASH = keccak256(
        "Registration(string agentURI,uint256 deadline,uint256 nonce)"
    );

    // Nonces for replay protection (in the context of delegated EOA)
    // Note: When delegated, this maps to storage slot in the EOA
    mapping(address => uint256) public nonces;

    event RegistrationExecuted(
        address indexed agent,
        uint256 indexed agentId,
        string agentURI,
        address indexed sponsor
    );

    constructor(address _registry) {
        registry = IAgentRegistry(_registry);
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("AgentRegistrationDelegate"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Execute registration on behalf of the delegating EOA
     * @dev This function executes in the context of the delegating EOA.
     *      When called, `address(this)` = the agent's EOA address.
     *      The agent must have signed a registration intent to authorize this.
     * 
     * @param agentURI The URI for the agent's registration file
     * @param deadline Timestamp after which the signature expires
     * @param signature Agent's EIP-712 signature authorizing this registration
     * @return agentId The ID of the newly registered agent
     */
    function executeRegistration(
        string calldata agentURI,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256 agentId) {
        require(block.timestamp <= deadline, "Registration expired");
        
        // In delegated execution, address(this) is the agent's EOA
        address agent = address(this);
        
        // Get nonce for this agent (stored in EOA's storage when delegated)
        uint256 nonce = nonces[agent];
        
        // Construct the EIP-712 digest
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTRATION_TYPEHASH,
                keccak256(bytes(agentURI)),
                deadline,
                nonce
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        // Recover signer and verify it matches the agent EOA
        address signer = digest.recover(signature);
        require(signer == agent, "Invalid signature");
        
        // Increment nonce
        nonces[agent] = nonce + 1;
        
        // Register the agent - msg.sender will be the sponsor's tx destination (agent's EOA)
        // Since we're executing as the EOA, the registry sees us as the owner
        agentId = registry.register(agentURI);
        
        // tx.origin is the sponsor who submitted the transaction
        emit RegistrationExecuted(agent, agentId, agentURI, tx.origin);
    }

    /**
     * @notice Simple registration without additional signature verification
     * @dev Use this when the EIP-7702 authorization alone is sufficient trust
     *      The agent has already signed the 7702 auth, proving intent to register
     * 
     * @param agentURI The URI for the agent's registration file
     * @return agentId The ID of the newly registered agent
     */
    function executeSimpleRegistration(
        string calldata agentURI
    ) external returns (uint256 agentId) {
        address agent = address(this);
        
        agentId = registry.register(agentURI);
        
        emit RegistrationExecuted(agent, agentId, agentURI, tx.origin);
    }

    /**
     * @notice Get the next nonce for an agent
     * @dev Useful for constructing the registration intent off-chain
     */
    function getNonce(address agent) external view returns (uint256) {
        return nonces[agent];
    }

    /**
     * @notice Compute the registration digest for off-chain signing
     */
    function getRegistrationDigest(
        string calldata agentURI,
        uint256 deadline,
        uint256 nonce
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTRATION_TYPEHASH,
                keccak256(bytes(agentURI)),
                deadline,
                nonce
            )
        );
        
        return keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
    }
}
