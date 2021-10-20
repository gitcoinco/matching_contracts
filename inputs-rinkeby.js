// yarn hardhat verify --constructor-args inputs-rinkeby.js --network rinkeby <CONTRACT_ADDRESS>

const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const funder = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const dai = '0x2e055eEe18284513B993dB7568A592679aB13188';

module.exports = [owner, funder, dai];
