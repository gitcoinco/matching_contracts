import { Signer } from '@ethersproject/abstract-signer';
import { ethers, waffle } from 'hardhat';

import GrantMatchPayoutsArtifact from '../artifacts/contracts/GrantMatchPayouts.sol/GrantMatchPayouts.json';

import { Accounts, Signers } from '../types';
import { GrantMatchPayouts } from '../typechain/GrantMatchPayouts';
import { shouldBehaveLikeGrantMatchPayouts } from './GrantMatchPayouts.behavior';

const { deployContract } = waffle;

describe('Unit tests', function () {
  before(async function () {
    this.accounts = {} as Accounts;
    this.signers = {} as Signers;

    const signers: Signer[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.accounts.admin = await signers[0].getAddress();
  });

  describe('GrantMatchPayouts', function () {
    beforeEach(async function () {
      const greeting: string = 'Hello, world!';
      this.grantMatchPayouts = (await deployContract(this.signers.admin, GrantMatchPayoutsArtifact, [
        greeting,
      ])) as GrantMatchPayouts;
    });

    shouldBehaveLikeGrantMatchPayouts();
  });
});
