// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.5;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";

/**
 * @notice The `MerklePayout` contract enables eligible grant owners to claim their
 * match after round ends and funds have been loaded into this contract. They claim their
 * funds in the given `ERC20` token by providing a merkleProof.
 * This contract is intended to work as follows:
 *  - When a `GrantRound` is complete, compute the match payouts for that round
 *  - Generate a Merkle tree of the match payout results
 *  - Deploy an instance of this contract with the associated Merkle root
 *  - Transfer match funds from the `funder` address to this contract
 *  - Users eligible for match payouts can use the `claim` or `batchClaim` method to claim their funds
 *  - `funder` would be able to withdraw remaining funds if needed
 *
 * @dev code sourced from https://github.com/Uniswap/merkle-distributor/blob/0d478d722da2e5d95b7292fd8cbdb363d98e9a93/contracts/MerkleDistributor.sol
 */
contract MerklePayout {
  using SafeERC20 for IERC20;

  // --- Data ---

  /// @notice Address where funding comes from (Gitcoin Grants multisig)
  address public immutable funder;

  /// @notice token address in which the funds are meant to be paid out
  IERC20 public immutable token;

  /// @notice merkle root generated from distribution
  bytes32 public immutable merkleRoot;

  /// @dev packed array of booleans to keep track of claims
  mapping(uint256 => uint256) private claimedBitMap;

  /// --- Types ---
  struct Claim {
    uint256 index; // index in claimedBitmap
    address payee; // address to which funds are sent
    uint256 amount; // amount to be claimed
    bytes32[] merkleProof; // generated merkle proof
  }

  /// --- Event ---

  /// @notice Emitted when funder reclaims funds
  event FundingWithdrawn(IERC20 token, uint256 amount);

  /// @notice Emitted when `payee` withdraws their payout
  event Claimed(uint256 index, address payee, uint256 amount);

  constructor(
    IERC20 _token,
    bytes32 _merkleRoot,
    address _funder
  ) {
    token = _token;
    merkleRoot = _merkleRoot;
    funder = _funder;
  }

  // --- Core methods ---

  /**
   * @notice Marks claim on the claimedBitMap for given index
   * @param _index index in claimedBitMap which has claimed funds
   */
  function _setClaimed(uint256 _index) private {
    uint256 claimedWordIndex = _index / 256;
    uint256 claimedBitIndex = _index % 256;
    claimedBitMap[claimedWordIndex] |= (1 << claimedBitIndex);
  }

  /**
   * @notice Check if grant payee_address has claimed funds.
   * @dev Checks if index has been marked as claimed.
   * @param _index Index in claimedBitMap
   */
  function hasClaimed(uint256 _index) public view returns (bool) {
    uint256 claimedWordIndex = _index / 256;
    uint256 claimedBitIndex = _index % 256;
    uint256 claimedWord = claimedBitMap[claimedWordIndex];

    uint256 mask = (1 << claimedBitIndex);
    return claimedWord & mask == mask;
  }

  /**
   * @notice Claims token to given address and updates claimedBitMap
   * @dev Reverts a claim if inputs are invalid
   * @param _claim Claim
   */
  function claim(Claim calldata _claim) public {
    uint256 _index = _claim.index;
    address _payee = _claim.payee;
    uint256 _amount = _claim.amount;
    bytes32[] calldata _merkleProof = _claim.merkleProof;

    // check if payee has not claimed funds
    require(!hasClaimed(_index), "MerklePayout: Funds already claimed.");

    // verify the merkle proof
    bytes32 node = keccak256(abi.encodePacked(_index, _payee, _amount));
    require(MerkleProof.verify(_merkleProof, merkleRoot, node), "MerklePayout: Invalid proof.");

    // mark as claimed and transfer
    _setClaimed(_index);
    token.safeTransfer(_payee, _amount);

    // emit event
    emit Claimed(_index, _payee, _amount);
  }

  /**
   * @notice Enables funder to withdraw all funds
   * @dev Escape hatch, intended to be used if the payout mapping is finalized incorrectly. In this
   * case a new MatchPayouts contract can be deployed and that one will be used instead
   * @dev We trust the funder, which is why they are allowed to withdraw funds at any time
   * @param _token Address of token to withdraw from this contract
   */
  function withdrawFunding(IERC20 _token) external {
    require(msg.sender == funder, "MerklePayout: caller is not the funder");
    uint256 _balance = _token.balanceOf(address(this));
    _token.safeTransfer(funder, _balance);
    emit FundingWithdrawn(_token, _balance);
  }
}
