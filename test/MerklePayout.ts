import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { deployContract } from 'ethereum-waffle';
import { utils, Contract, BigNumber } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { artifacts, ethers } from 'hardhat';
import { Artifact } from 'hardhat/types';
import { MerklePayout } from '../typechain';
import { setBalance, tokens } from '../utils/index';
import { BalanceTree } from '../utils/balance-tree';

const RANDOM_BYTES32 = utils.randomBytes(32);
const randomAddress = () => ethers.Wallet.createRandom().address;

type Claim = {
  index: number;
  payee: string;
  amount: number;
  merkleProof: string[];
};

describe('MerklePayout', function () {
  let user: SignerWithAddress;
  let funder: SignerWithAddress;
  let payout: MerklePayout;

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

  describe('claim', () => {
    let payout: Contract;
    let tree: BalanceTree;

    // user0
    let user0: SignerWithAddress;
    let proof0: string[];
    let claim0Arg: Claim;
    // user1
    let user1: SignerWithAddress;
    let proof1: string[];
    let claim1Arg: Claim;

    beforeEach(async () => {
      [user0, user1] = await ethers.getSigners();
      tree = new BalanceTree([
        { account: user0.address, amount: BigNumber.from(100) },
        { account: user1.address, amount: BigNumber.from(101) },
      ]);

      const payoutArtifact: Artifact = await artifacts.readArtifact('MerkleGrantRoundPayout');
      payout = await deployContract(user, payoutArtifact, [tokens.dai.address, tree.getHexRoot()]);

      proof0 = tree.getProof(0, user0.address, BigNumber.from(100));
      claim0Arg = { index: 0, payee: user0.address, amount: 100, merkleProof: proof0 };

      proof1 = tree.getProof(1, user1.address, BigNumber.from(101));
      claim1Arg = { index: 1, payee: user1.address, amount: 101, merkleProof: proof1 };

      await setBalance('dai', payout.address, 201);
      await setBalance('dai', user0.address, 0);
      await setBalance('dai', user1.address, 0);
    });

    it('fails for empty proof', async () => {
      claim0Arg = { index: 0, payee: await randomAddress(), amount: 10, merkleProof: [] };
      await expect(payout.claim(claim0Arg)).to.be.revertedWith('MerkleGrantRoundPayout: Invalid proof.');
      await expect(payout.claim(claim1Arg)).to.be.revertedWith('MerkleGrantRoundPayout: Invalid proof.');
    });
  });
});
