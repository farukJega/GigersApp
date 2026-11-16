import { parseAbi } from "viem";

export const ESCROW_ADDRESS = "0xCE11367DEa3E9Dca96dDE85A3b6670566094C5F4" as const;
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;
export const USDC_DECIMALS = 6;

export const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
]);

export const escrowAbi = parseAbi([
  "function gigCount() view returns (uint256)",
  "function gigs(uint256) view returns (address client, address worker, bytes32 metadataHash, uint64 deadline, uint256 totalAmount, uint256 applicantCount, uint256 resolvedCount, uint8 status)",
  "function hasApplied(uint256, address) view returns (bool)",
  "function getMilestones(uint256) view returns ((uint256 amount, bytes32 workHash, uint64 submittedAt, uint8 status)[])",
  "function getApplicants(uint256) view returns (address[])",
  "function createGig(bytes32 metadataHash, uint64 deadline, uint256[] amounts) returns (uint256)",
  "function applyToGig(uint256 gigId)",
  "function acceptWorker(uint256 gigId, address worker)",
  "function cancelGig(uint256 gigId)",
  "function submitWork(uint256 gigId, uint256 index, bytes32 workHash)",
  "function approveMilestone(uint256 gigId, uint256 index)",
  "function refundMilestone(uint256 gigId, uint256 index)",
  "function claimAfterTimeout(uint256 gigId, uint256 index)",
  "function raiseDispute(uint256 gigId, uint256 index)",
  "function resolveDispute(uint256 gigId, uint256 index, bool payWorker)",
  "function arbiter() view returns (address)",
  "event GigCreated(uint256 indexed gigId, address indexed client, uint256 totalAmount, uint64 deadline, bytes32 metadataHash, uint256 milestoneCount)",
  "event Applied(uint256 indexed gigId, address indexed applicant)",
]);
