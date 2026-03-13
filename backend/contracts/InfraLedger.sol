// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract InfraLedger {
    address public owner;
    uint256 public projectCounter;

    struct Project {
        uint256 projectId;
        string name;
        uint256 budget; // paise
        address contractor;
        uint256 createdAt;
        bool exists;
    }

    struct FundRelease {
        uint256 projectId;
        uint256 amount; // paise
        uint256 timestamp;
        address releasedBy;
    }

    struct Proof {
        uint256 projectId;
        string ipfsHash;
        uint256 timestamp;
        address uploadedBy;
    }

    mapping(uint256 => Project) public projects;
    FundRelease[] public fundReleases;
    Proof[] public proofs;

    event ProjectCreated(uint256 indexed projectId, string name, uint256 budget, address indexed contractor);
    event FundsReleased(uint256 indexed projectId, uint256 amount, address indexed releasedBy, uint256 timestamp);
    event ProofAdded(uint256 indexed projectId, string ipfsHash, address indexed uploadedBy, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProject(
        string calldata name,
        uint256 budget,
        address contractor
    ) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(budget > 0, "Budget must be > 0");
        require(contractor != address(0), "Invalid contractor");

        projectCounter++;

        projects[projectCounter] = Project({
            projectId: projectCounter,
            name: name,
            budget: budget,
            contractor: contractor,
            createdAt: block.timestamp,
            exists: true
        });

        emit ProjectCreated(projectCounter, name, budget, contractor);
        return projectCounter;
    }

    function releaseFunds(uint256 projectId, uint256 amount) external onlyOwner {
        require(projects[projectId].exists, "Project not found");
        require(amount > 0, "Amount must be > 0");

        fundReleases.push(
            FundRelease({
                projectId: projectId,
                amount: amount,
                timestamp: block.timestamp,
                releasedBy: msg.sender
            })
        );

        emit FundsReleased(projectId, amount, msg.sender, block.timestamp);
    }

    function addProof(uint256 projectId, string calldata ipfsHash) external onlyOwner {
        require(projects[projectId].exists, "Project not found");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        proofs.push(
            Proof({
                projectId: projectId,
                ipfsHash: ipfsHash,
                timestamp: block.timestamp,
                uploadedBy: msg.sender
            })
        );

        emit ProofAdded(projectId, ipfsHash, msg.sender, block.timestamp);
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projects[projectId].exists, "Project not found");
        return projects[projectId];
    }
}
