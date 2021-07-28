// yarn hardhat verify --constructor-args inputs-rinkeby.js --network rinkeby <CONTRACT_ADDRESS>

const owner = '0x1bCD46B724fD4C08995CEC46ffd51bD45feDE200'; // TODO: UPDATE
const funder = '0x1bCD46B724fD4C08995CEC46ffd51bD45feDE200'; // TODO: UPDATE
const dai = '0x2e055eEe18284513B993dB7568A592679aB13188';

module.exports = [owner, funder, dai];
