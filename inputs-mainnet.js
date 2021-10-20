// yarn hardhat verify --constructor-args inputs-mainnet.js --network mainnet <CONTRACT_ADDRESS>

const owner = '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA'; // TODO: UPDATE
const funder = '0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6';
const dai = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

module.exports = [owner, funder, dai];
