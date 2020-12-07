// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  // Define constructor parameters
  const owner = '0x00De4B13153673BCAE2616b67bf822500d325Fc3';
  const funder = '0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6'; // Gitcoin Grants multisig
  const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // TODO update based on network

  // We get the contract to deploy
  const MatchPayouts: ContractFactory = await ethers.getContractFactory('MatchPayouts');
  const matchPayouts: Contract = await MatchPayouts.deploy(owner, funder, daiAddress);
  await matchPayouts.deployed();

  console.log('MatchPayouts deployed to: ', matchPayouts.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
