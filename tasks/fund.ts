/**
 * @dev Used on localhost to fund the contract with token
 */

import { task } from 'hardhat/config';

task('fund', 'Transfers ERC20 token to the MatchPayouts contract', async (_taskArgs, hre) => {
  const { parseEther } = hre.ethers.utils;
  // Verify we are on localhost
  if (hre.network.name !== 'localhost') {
    throw new Error('This task is only for use on localhost');
  }

  // Since this task is for localhost only, the contract addresses are deterministic
  const matchPayoutsAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const token = await hre.ethers.getContractAt('MockERC20', tokenAddress);

  // Mint token to the contract
  const amount = '210000'; // hardcoded amount that matches total payout amount from set-payouts.ts
  const tx = await token.mint(matchPayoutsAddress, parseEther(amount));
  await tx.wait();
});
