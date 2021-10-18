import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { deployContract } from 'ethereum-waffle';
import { utils } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { artifacts, ethers } from 'hardhat';
import { Artifact } from 'hardhat/types';
import { MerklePayout } from '../typechain';

const RANDOM_BYTES32 = utils.randomBytes(32);

describe('MerklePayout', function () {
  let user: SignerWithAddress;
  let funder: SignerWithAddress;
  let payout: MerklePayout;

  const tokens = {
    dai: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
    uni: {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    },
  };

  before(async () => {
    [user, funder] = await ethers.getSigners();

    // Deploy MerklePayout
    const payoutArtifact: Artifact = await artifacts.readArtifact('MerklePayout');
    payout = <MerklePayout>await deployContract(user, payoutArtifact, [tokens.dai.address, RANDOM_BYTES32]);
  });

  describe('constructor', () => {
    it('deploys properly', async function () {
      // Verify deploy
      expect(isAddress(payout.address), 'Failed to deploy MerklePayout').to.be.true;

      // Verify constructor parameters
      expect(await payout.token()).to.equal(tokens.dai.address);
      expect(await payout.funder()).to.equal(funder);
      expect(await payout.merkleRoot()).to.equal(utils.hexlify(RANDOM_BYTES32));
    });
  });
});
