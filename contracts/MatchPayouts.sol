// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.5;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

/**
 * @dev This contract allows for non-custodial Gitcoin Grants match payouts. It works as follows:
 *  1. During a matching round, deploy a new instance of this contract
 *  2. Once the round is complete, Gitcoin computes the final match amounts earned by each grant
 *  3. Over the course of multiple transactions, the contract owner will set the payout mapping
 *     stored in the `payouts` variable. This maps each grant receiving address to the match amount
 *     owed, in DAI
 *  4. Once this mapping has been set for each grant, the contract owner calls `finalize()`. This
 *     sets `finalized` to `true`, and at this point the payout mapping can no longer be updated.
 *  5. Funders review the payout mapping, and if they approve they transfer their funds to this
 *     contract. This can be done with an ordinary transfer to this contract address.
 *  6. Once all funds have been transferred, the contract owner calls `enablePayouts` which lets
 *     grant owners withdraw their match payments
 *  6. Grant owners can now call `withdraw()` to have their match payout sent to their address.
 *     Anyone can call this method on behalf of a grant owner, which is useful if your Gitcoin
 *     grants address cannot call contract methods.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *        WARNING: DO NOT SEND ANYTHING EXCEPT FOR DAI TO THIS CONTRACT OR IT WILL BE LOST!        *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
contract MatchPayouts {
  using SafeERC20 for IERC20;

  // ======================================= STATE VARIABLES =======================================

  /// @dev Address that can modify contract state
  address public immutable owner;

  /// @dev Address where funding comes from (Gitcoin Grants multisig)
  address public immutable funder;

  /// @dev Token used for match payouts
  IERC20 public immutable dai;

  /// @dev Convenience type used for setting inputs
  struct Payout {
    address recipient; // grant receiving address
    uint256 amount; // match amount for that grant
  }

  /// @dev Maps a grant's receiving address their match amount
  mapping(address => uint256) public payouts;

  /// @dev When true, the payouts mapping is finalized and cannot be updated
  bool public finalized;

  /// @dev When true, the contract has been funded and withdrawals can begin. Contract must be
  /// `finalized` before it can be `funded`
  bool public funded;

  // =========================================== EVENTS ============================================

  /// @dev Emitted when the `finalized` flag is set
  event Finalized();

  /// @dev Emitted when the `funded` flag is set
  event Funded();

  /// @dev Emitted when the funder reclaims the funds in this contract
  event FundingWithdrawn();

  /// @dev Emitted when a payout `amount` is added to the `recipient`'s payout total
  event PayoutAdded(address recipient, uint256 amount);

  /// @dev Emitted when a `recipient` withdraws their payout
  event PayoutClaimed(address recipient);

  // ================================== CONSTRUCTOR AND MODIFIERS ==================================

  /**
   * @param _owner Address of contract owner
   * @param _funder Address of funder
   * @param _dai DAI address
   */
  constructor(address _owner, address _funder, IERC20 _dai) {
    owner = _owner;
    funder = _funder;
    dai = _dai;
  }

  /// @dev Requires caller to be the owner
  modifier onlyOwner() {
    require(msg.sender == owner, "MatchPayouts: caller is not the owner");
    _;
  }

  /// @dev Only allows method to be called once the payouts mapping has been finalized
  modifier onlyWhenFinalized() {
    require(finalized, "MatchPayouts: Payouts not finalized");
    _;
  }

  // ======================================= PRIMARY METHODS =======================================
  // Functions are laid out in the order they will be called over the lifetime of the contract

  /**
   * @notice Set's the mapping of addresses to their match amount
   * @dev This will need to be called multiple times to prevent exceeding the block gas limit, based
   * on the number of grants
   * @param _payouts Array of `Payout`s to set
   */
  function setPayouts(Payout[] calldata _payouts) external onlyOwner {
    require(!finalized, "MatchPayouts: Payouts already finalized");
    // Set each payout amount
    for (uint256 i = 0; i < _payouts.length; i += 1) {
      payouts[_payouts[i].recipient] = _payouts[i].amount;
      emit PayoutAdded(_payouts[i].recipient, _payouts[i].amount);
    }
  }

  /**
   * @notice Called by the owner to signal that the payout mapping is finalized
   * @dev Once called, this cannot be reversed!
   * @dev We use an explicit method here instead of doing this as part of the `setPayouts()` method
   * to reduce the chance of accidentally setting this flag
   */
  function finalize() external onlyOwner {
    finalized = true;
    emit Finalized();
  }

  /**
   * @notice Enables funder to withdraw all funds
   * @dev Escape hatch, intended to be used if the payout mapping is finalized incorrectly. In this
   * case a new MatchPayouts contract can be deployed and that one will be used instead
   */
  function withdrawFunding() external {
    require(msg.sender == funder, "MatchPayouts: caller is not the funder");
    dai.safeTransfer(funder, dai.balanceOf(address(this)));
    emit FundingWithdrawn();
  }

  /**
   * @notice Called by the owner to enable withdrawals of match payouts
   * @dev Once called, this cannot be reversed!
   */
  function enablePayouts() external onlyOwner onlyWhenFinalized {
    funded = true;
    emit Funded();
  }

  /**
   * @notice Withdraws funds owed to `_recipient`
   * @param _recipient Address to withdraw for
   */
  function claimMatchPayout(address _recipient) external onlyWhenFinalized {
    require(funded, "MatchPayouts: Not yet funded");
    uint256 _amount = payouts[_recipient]; // save off amount owed
    payouts[_recipient] = 0; // clear storage to mitigate reentrancy (not likely anyway since we trust Dai)
    dai.safeTransfer(_recipient, _amount);
    emit PayoutClaimed(_recipient);
  }
}
