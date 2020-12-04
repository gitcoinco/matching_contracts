// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GrantMatchPayouts is Ownable {
  string public greeting;

  constructor(address _owner) {
    transferOwnership(_owner);
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function setGreeting(string memory _greeting) public {
    greeting = _greeting;
  }
}
