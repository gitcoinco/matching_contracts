// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.7.0;

contract GrantMatchPayouts {
  string public greeting;

  constructor(string memory _greeting) {
    greeting = _greeting;
  }

  function greet() public view returns (string memory) {
    return greeting;
  }

  function setGreeting(string memory _greeting) public {
    greeting = _greeting;
  }
}
