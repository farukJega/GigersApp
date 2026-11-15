// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract GigersEscrow {
    enum GigStatus { Open, InProgress, Completed, Cancelled }
    enum MStatus { Pending, Submitted, Paid, Refunded, Disputed }

    struct Milestone {
        uint256 amount;
        bytes32 workHash;
        uint64 submittedAt;
        MStatus status;
    }

    struct Gig {
        address client;
        address worker;
        bytes32 metadataHash;
        uint64 deadline;
        uint256 totalAmount;
        uint256 applicantCount;
        uint256 resolvedCount;
        GigStatus status;
    }

    IERC20 public immutable usdc;
    address public arbiter;
    uint256 public gigCount;
    uint256 public constant MAX_MILESTONES = 10;
    uint64 public constant REVIEW_PERIOD = 7 days;
    uint64 public constant REFUND_GRACE = 3 days;

    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => Milestone[]) private _milestones;
    mapping(uint256 => address[]) private _applicants;
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    uint256 private _lock = 1;
    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    event GigCreated(uint256 indexed gigId, address indexed client, uint256 totalAmount, uint64 deadline, bytes32 metadataHash, uint256 milestoneCount);
    event Applied(uint256 indexed gigId, address indexed applicant);
    event WorkerAccepted(uint256 indexed gigId, address indexed worker);
    event WorkSubmitted(uint256 indexed gigId, uint256 indexed index, bytes32 workHash);
    event MilestonePaid(uint256 indexed gigId, uint256 indexed index, address indexed worker, uint256 amount);
    event MilestoneRefunded(uint256 indexed gigId, uint256 indexed index, address indexed client, uint256 amount);
    event MilestoneDisputed(uint256 indexed gigId, uint256 indexed index, address by);
    event GigCancelled(uint256 indexed gigId);
    event GigCompleted(uint256 indexed gigId);

    constructor(address usdcAddress, address arbiterAddress) {
        require(usdcAddress != address(0) && arbiterAddress != address(0), "zero addr");
        usdc = IERC20(usdcAddress);
        arbiter = arbiterAddress;
    }

    function createGig(bytes32 metadataHash, uint64 deadline, uint256[] calldata amounts)
        external nonReentrant returns (uint256 gigId)
    {
        require(amounts.length > 0 && amounts.length <= MAX_MILESTONES, "bad milestones");
        require(deadline > block.timestamp, "bad deadline");

        uint256 total;
        gigId = ++gigCount;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "zero amount");
            total += amounts[i];
            _milestones[gigId].push(Milestone(amounts[i], bytes32(0), 0, MStatus.Pending));
        }

        gigs[gigId] = Gig(msg.sender, address(0), metadataHash, deadline, total, 0, 0, GigStatus.Open);

        require(usdc.transferFrom(msg.sender, address(this), total), "deposit failed");
        emit GigCreated(gigId, msg.sender, total, deadline, metadataHash, amounts.length);
    }

    function acceptWorker(uint256 gigId, address worker) external {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.client, "not client");
        require(g.status == GigStatus.Open, "not open");
        require(hasApplied[gigId][worker], "not applicant");
        g.worker = worker;
        g.status = GigStatus.InProgress;
        emit WorkerAccepted(gigId, worker);
    }

    function cancelGig(uint256 gigId) external nonReentrant {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.client, "not client");
        require(g.status == GigStatus.Open, "not open");
        g.status = GigStatus.Cancelled;
        uint256 amount = g.totalAmount;
        require(usdc.transfer(g.client, amount), "refund failed");
        emit GigCancelled(gigId);
    }

    function approveMilestone(uint256 gigId, uint256 index) external nonReentrant {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.client, "not client");
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Submitted, "not submitted");
        _pay(gigId, index, g, m);
    }

    function refundMilestone(uint256 gigId, uint256 index) external nonReentrant {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.client, "not client");
        require(g.status == GigStatus.InProgress, "not active");
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Pending, "not pending");
        require(block.timestamp > g.deadline + REFUND_GRACE, "too early");
        m.status = MStatus.Refunded;
        uint256 amount = m.amount;
        g.resolvedCount++;
        _maybeComplete(gigId, g);
        require(usdc.transfer(g.client, amount), "refund failed");
        emit MilestoneRefunded(gigId, index, g.client, amount);
    }

    function applyToGig(uint256 gigId) external {
        Gig storage g = gigs[gigId];
        require(g.client != address(0), "no gig");
        require(g.status == GigStatus.Open, "not open");
        require(block.timestamp < g.deadline, "expired");
        require(msg.sender != g.client, "client cannot apply");
        require(!hasApplied[gigId][msg.sender], "already applied");
        hasApplied[gigId][msg.sender] = true;
        _applicants[gigId].push(msg.sender);
        g.applicantCount++;
        emit Applied(gigId, msg.sender);
    }

    function submitWork(uint256 gigId, uint256 index, bytes32 workHash) external {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.worker, "not worker");
        require(g.status == GigStatus.InProgress, "not active");
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Pending, "not pending");
        m.status = MStatus.Submitted;
        m.workHash = workHash;
        m.submittedAt = uint64(block.timestamp);
        emit WorkSubmitted(gigId, index, workHash);
    }

    function claimAfterTimeout(uint256 gigId, uint256 index) external nonReentrant {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.worker, "not worker");
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Submitted, "not submitted");
        require(block.timestamp > m.submittedAt + REVIEW_PERIOD, "review period");
        _pay(gigId, index, g, m);
    }

    function raiseDispute(uint256 gigId, uint256 index) external {
        Gig storage g = gigs[gigId];
        require(msg.sender == g.client || msg.sender == g.worker, "not party");
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Submitted, "not submitted");
        m.status = MStatus.Disputed;
        emit MilestoneDisputed(gigId, index, msg.sender);
    }

    function resolveDispute(uint256 gigId, uint256 index, bool payWorker) external nonReentrant {
        require(msg.sender == arbiter, "not arbiter");
        Gig storage g = gigs[gigId];
        Milestone storage m = _milestones[gigId][index];
        require(m.status == MStatus.Disputed, "not disputed");
        if (payWorker) {
            _pay(gigId, index, g, m);
        } else {
            m.status = MStatus.Refunded;
            uint256 amount = m.amount;
            g.resolvedCount++;
            _maybeComplete(gigId, g);
            require(usdc.transfer(g.client, amount), "refund failed");
            emit MilestoneRefunded(gigId, index, g.client, amount);
        }
    }

    function setArbiter(address newArbiter) external {
        require(msg.sender == arbiter && newArbiter != address(0), "not allowed");
        arbiter = newArbiter;
    }

    function getMilestones(uint256 gigId) external view returns (Milestone[] memory) {
        return _milestones[gigId];
    }

    function getApplicants(uint256 gigId) external view returns (address[] memory) {
        return _applicants[gigId];
    }

    function _pay(uint256 gigId, uint256 index, Gig storage g, Milestone storage m) internal {
        m.status = MStatus.Paid;
        uint256 amount = m.amount;
        g.resolvedCount++;
        _maybeComplete(gigId, g);
        require(usdc.transfer(g.worker, amount), "payment failed");
        emit MilestonePaid(gigId, index, g.worker, amount);
    }

    function _maybeComplete(uint256 gigId, Gig storage g) internal {
        if (g.resolvedCount == _milestones[gigId].length) {
            g.status = GigStatus.Completed;
            emit GigCompleted(gigId);
        }
    }
}
