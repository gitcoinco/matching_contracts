// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.5;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract MatchPayouts is Ownable {
  using SafeERC20 for IERC20;

  // ======================================= STATE VARIABLES =======================================

  /// @dev Token used for match payouts
  IERC20 public dai;

  /// @dev Convenience type used for setting inputs
  struct Payout {
    address recipient; // grant receiving address
    uint256 amount; // match amount
  }

  /// @dev Maps a grant's receiving address their match amount
  mapping(address => uint256) public payouts;

  /// @dev When true, the payouts mapping is finalized and cannot be updated
  bool public readyForPayout;

  // ================================== CONSTRUCTOR AND MODIFIERS ==================================

  /**
   * @param _owner Address of contract owner
   * @param _dai DAI address
   */
  constructor(address _owner, IERC20 _dai) {
    transferOwnership(_owner);
    dai = _dai;
  }

  /**
   * @dev Only allows method to be called once the payouts mapping has been finalized
   */
  modifier onlyWhenReady() {
    require(readyForPayout, "MatchPayouts: Payouts not ready");
    _;
  }

  // ======================================= PRIMARY METHODS =======================================

  /**
   * @notice Provide funds to the match pool
   * @dev Alternatively, you can just transfer DAI to this contract directly. This method is
   * costlier since it first requires an `approve` call, but is a nice helper method for funders who
   * do not want to copy/paste an address
   * @dev Even though funds can be added any time by just transferring to this contract, the intent
   * is that funds won't be transferred until the payout mapping is ready and approved by the
   * funder. Therefore, if someone is adding funds through this method, we may as well enforce that
   * the payout mapping is ready
   * @param _amount Amount of funds to provide
   */
  function addFunds(uint256 _amount) external onlyWhenReady {
    dai.safeTransferFrom(msg.sender, address(this), _amount);
  }

  /**
   * @notice Withdraws funds owed to `_recipient`
   * @param _recipient Address to withdraw for
   */
  function withdraw(address _recipient) external onlyWhenReady {
    dai.safeTransfer(_recipient, payouts[_recipient]);
    payouts[_recipient] = 0; // safe to put effect after interaction since we trust the Dai contract
  }

  /**
   * @notice Set's the mapping of addresses to their match amount
   * @dev This will need to be called multiple times to prevent exceeding the block gas limit, based
   * on the number of grants
   * @param _payouts Array of `Payout`s to set
   * @param _readyForPayout True if this is the last mapping to set for this grants round
   */
  function setPayouts(Payout[] calldata _payouts, bool _readyForPayout) external onlyOwner {
    require(!readyForPayout, "MatchPayouts: Payouts already finalized");
    // Set each payout amount
    for (uint256 i = 0; i < _payouts.length; i += 1) {
      // This contract can be used for multiple rounds, so we add the amount instead of setting it.
      // That way if a grant owner does not lose their match if they don't withdraw it until the
      // next round
      payouts[_payouts[i].recipient] += _payouts[i].amount;
    }

    // Finalize if specified
    if (_readyForPayout) {
      readyForPayout = _readyForPayout;
    }
  }

  /**
   * @notice Allows contract owner to reset `finalized` parameter to re-use contract
   */
  function reset() external onlyOwner {
    // TODO Should we require a delay, e.g. 1 month, between when readyForPayout is set to true
    // vs. when this can be called?
    readyForPayout = false;
  }
}
