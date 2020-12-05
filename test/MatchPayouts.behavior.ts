import { expect } from 'chai';
import { BigNumber } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';
import { parseEther } from '@ethersproject/units'; // parseEther works since Dai is 18 decimals

export function shouldBehaveLikeMatchPayouts(): void {
  // ============================================ Setup ============================================
  describe('Setup', async function () {
    it('deploys and initializes properly', async function () {
      expect(await this.matchPayouts.owner()).to.equal(this.accounts.owner);
      expect(await this.matchPayouts.dai()).to.equal(this.dai.address);
      expect(await this.matchPayouts.readyForPayout()).to.equal(false);
    });

    it('lets ownership be transferred', async function () {
      expect(await this.matchPayouts.owner()).to.equal(this.accounts.owner);
      await this.matchPayouts.connect(this.signers.owner).transferOwnership(this.accounts.newOwner);
      expect(await this.matchPayouts.owner()).to.equal(this.accounts.newOwner);
    });
  });

  // ======================================== Restrictions =========================================
  describe('Restrictions', async function () {
    it('restricts who can transfer ownership', async function () {
      const tx = this.matchPayouts
        .connect(this.signers.evilUser)
        .transferOwnership(this.accounts.evilUser);
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('restricts who can set the payout mapping', async function () {
      const payouts = [{ recipient: this.accounts.evilUser, amount: parseEther('1') }];
      const tx = this.matchPayouts.connect(this.signers.evilUser).setPayouts(payouts, true);
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('restricts who can set the ready for payout flag', async function () {
      const tx = this.matchPayouts.connect(this.signers.evilUser).reset();
      await expect(tx).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('prevents adding funds through the contract if payout mapping is not ready', async function () {
      expect(await this.matchPayouts.readyForPayout()).to.equal(false);
      const tx = this.matchPayouts.connect(this.signers.funders[0]).addFunds(parseEther('1'));
      await expect(tx).to.be.revertedWith('MatchPayouts: Payouts not ready');
    });

    it('prevents setting the payout mapping when the ready for payout flag is true', async function () {
      const payouts = [{ recipient: this.accounts.evilUser, amount: parseEther('1') }];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts, true);
      const tx = this.matchPayouts.connect(this.signers.owner).setPayouts(payouts, true);
      await expect(tx).to.be.revertedWith('MatchPayouts: Payouts already finalized');
    });
  });

  // ======================================== Functionality ========================================
  describe('Functionality', async function () {
    it('lets the owner set the payout mapping without finalizing payout mapping', async function () {
      // Match amounts should be zero to start
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal('0');

      // Set payouts
      const matchAmounts = [parseEther('1'), parseEther('1.5')];
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts, false);

      // Check that it was set properly
      expect(await this.matchPayouts.readyForPayout()).to.equal(false);
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal(
        matchAmounts[0]
      );
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal(
        matchAmounts[1]
      );
    });

    it('lets the owner set the payout mapping and finalize payout mapping', async function () {
      // Match amounts should be zero to start
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal('0');

      // Set payouts
      const matchAmounts = [parseEther('1'), parseEther('1.5')];
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts, true);

      // Check that it was set properly
      expect(await this.matchPayouts.readyForPayout()).to.equal(true);
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal(
        matchAmounts[0]
      );
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal(
        matchAmounts[1]
      );
    });

    it('End to end test of everything after payout mapping is finalized', async function () {
      // ------------------------------------------- Setup -------------------------------------------
      // Mint Dai to funders
      const funderAmounts = [parseEther('100000'), parseEther('200000')]; // 100k and 200k DAI
      await this.dai.mint(this.accounts.funders[0], funderAmounts[0]);
      await this.dai.mint(this.accounts.funders[1], funderAmounts[1]);

      // Set payouts
      const matchAmounts = [parseEther('15000'), parseEther('37000')]; // 15k and 37k DAI
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts, true);

      // ------------------------------------------ Funding ------------------------------------------
      // First funder directly transfers DAI to contract
      await this.dai
        .connect(this.signers.funders[0])
        .transfer(this.matchPayouts.address, funderAmounts[0]);

      // Second funder transfers DAI by calling the MatchPayouts contract
      await this.dai
        .connect(this.signers.funders[1])
        .approve(this.matchPayouts.address, MaxUint256);
      await this.matchPayouts.connect(this.signers.funders[1]).addFunds(funderAmounts[1]);

      // Check that total balances in contract adds up
      const expectedBalance = BigNumber.from(funderAmounts[0]).add(funderAmounts[1]);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(expectedBalance);

      // ---------------------------------------- Withdrawals ----------------------------------------
      // Grant owners should initially have no balance
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal('0');

      // First grant owner withdraws on their own
      await this.matchPayouts
        .connect(this.signers.grantOwners[0])
        .withdraw(this.accounts.grantOwners[0]);
      const firstBalance = expectedBalance.sub(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(firstBalance);

      // First grant owner should have their match funds
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal('0');

      // Evil user withdraws for second grant owner
      await this.matchPayouts.connect(this.signers.evilUser).withdraw(this.accounts.grantOwners[1]);
      const secondBalance = firstBalance.sub(matchAmounts[1]);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(secondBalance);

      // Withdrawal amount still should have went to the second grant owner
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal(matchAmounts[1]);
      expect(await this.dai.balanceOf(this.accounts.evilUser)).to.equal('0');

      // Users can try to withdraw again, but won't receive any extra DAI
      await this.matchPayouts
        .connect(this.signers.grantOwners[1])
        .withdraw(this.accounts.grantOwners[1]);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(secondBalance);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal(matchAmounts[1]);
      expect(await this.dai.balanceOf(this.accounts.evilUser)).to.equal('0');

      // Owner can reset the readyForPayout flag to prepare for the next round
      expect(await this.matchPayouts.readyForPayout()).to.equal(true);
      await this.matchPayouts.connect(this.signers.owner).reset();
      expect(await this.matchPayouts.readyForPayout()).to.equal(false);
    });
  });
}
