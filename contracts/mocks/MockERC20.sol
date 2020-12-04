// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    name; // silence `Code contains empty blocks` compiler warning
  }

  /**
   * @notice Mint tokens
   * @param _to who tokens should be minted to
   * @param _amount amount to mint
   */
  function mint(address _to, uint256 _amount) external {
    _mint(_to, _amount);
  }
}
