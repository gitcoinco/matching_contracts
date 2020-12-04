import { Signer } from '@ethersproject/abstract-signer';
import { ethers, artifacts, waffle } from 'hardhat';

import { Accounts, Signers } from '../types';
import { MatchPayouts, MockErc20 } from '../typechain/index';
import { shouldBehaveLikeMatchPayouts } from './MatchPayouts.behavior';

const { deployContract } = waffle;

describe('Unit tests', function () {
  before(async function () {
    this.MatchPayoutsArtifact = await artifacts.readArtifact('MatchPayouts');
    this.MockERC20Artifact = await artifacts.readArtifact('MockERC20');

    this.accounts = {} as Accounts;
    this.signers = {} as Signers;

    const signers: Signer[] = await ethers.getSigners();
    this.signers.deployer = signers[0];
    this.accounts.deployer = await signers[0].getAddress();
    this.accounts.owner = await signers[1].getAddress();
  });

  describe('MatchPayouts', function () {
    beforeEach(async function () {
      // Deploy mock DAI contract
      this.dai = (await deployContract(
        this.signers.deployer,
        this.MockERC20Artifact,
        ['Dai', 'DAI'] // constructor arguments
      )) as MockErc20;

      // Deploy MatchPayouts contract
      this.matchPayouts = (await deployContract(
        this.signers.deployer,
        this.MatchPayoutsArtifact,
        [this.accounts.owner, this.dai.address] // constructor arguments
      )) as MatchPayouts;
    });

    shouldBehaveLikeMatchPayouts();
  });
});
