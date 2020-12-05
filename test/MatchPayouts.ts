import { Signer } from '@ethersproject/abstract-signer';
import { ethers, artifacts, waffle } from 'hardhat';

import { Accounts, Signers } from '../types';
import { MatchPayouts, MockErc20 } from '../typechain/index';
import { shouldBehaveLikeMatchPayouts } from './MatchPayouts.behavior';

const { deployContract } = waffle;

describe('MatchPayouts', function () {
  before(async function () {
    this.MatchPayoutsArtifact = await artifacts.readArtifact('MatchPayouts');
    this.MockERC20Artifact = await artifacts.readArtifact('MockERC20');

    this.accounts = {} as Accounts;
    this.signers = {} as Signers;

    const signers: Signer[] = await ethers.getSigners();

    this.signers.deployer = signers[0];
    this.accounts.deployer = await this.signers.deployer.getAddress();

    this.signers.owner = signers[1];
    this.accounts.owner = await this.signers.owner.getAddress();

    this.signers.newOwner = signers[2];
    this.accounts.newOwner = await this.signers.newOwner.getAddress();

    this.signers.evilUser = signers[3];
    this.accounts.evilUser = await this.signers.evilUser.getAddress();

    this.signers.funders = [];
    this.signers.funders.push(signers[4]);
    this.signers.funders.push(signers[5]);
    this.accounts.funders = [];
    this.accounts.funders.push(await this.signers.funders[0].getAddress());
    this.accounts.funders.push(await this.signers.funders[1].getAddress());

    this.signers.grantOwners = [];
    this.signers.grantOwners.push(signers[4]);
    this.signers.grantOwners.push(signers[5]);
    this.accounts.grantOwners = [];
    this.accounts.grantOwners.push(await this.signers.grantOwners[0].getAddress());
    this.accounts.grantOwners.push(await this.signers.grantOwners[1].getAddress());
  });

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
