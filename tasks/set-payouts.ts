import * as fs from 'fs';
import { Signer } from '@ethersproject/abstract-signer';
import { task } from 'hardhat/config';
import { PayoutFields } from '../types';

task('set-payouts', 'Sets a payout mapping for testing', async (_taskArgs, hre) => {
  const { parseEther } = hre.ethers.utils;
  // Verify we are on localhost
  if (hre.network.name !== 'localhost') {
    throw new Error('This task is only for use on localhost');
  }

  // Since this task is for localhost only, the contract addresses are deterministic
  const matchPayoutsAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const matchPayouts = await hre.ethers.getContractAt('MatchPayouts', matchPayoutsAddress);

  // Define payout mapping
  const payouts: PayoutFields[] = [];
  const accounts: Signer[] = await hre.ethers.getSigners();

  for (const [index, account] of accounts.entries()) {
    const address = await account.getAddress();
    const amount = parseEther(String(1000 * (index + 1))); // e.g. 1000 DAI, 2000 DAI, etc.
    payouts.push({
      recipient: address,
      amount: amount.toString(),
    });
  }

  // Set payout mapping
  const owner = accounts[1]; // owner defined in deploy.ts
  const tx = await matchPayouts.connect(owner).setPayouts(payouts);
  await tx.wait();
  console.log('Payout mapping set!');

  // Save off payout mapping to verify it later
  const json = JSON.stringify(payouts);
  const outDir = 'outputs';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir); // Create outputs folder if it doesn't exist
  fs.writeFileSync(`${outDir}/payouts.json`, json);
});
