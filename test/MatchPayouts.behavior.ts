import { expect } from 'chai';
import { parseEther } from '@ethersproject/units'; // parseEther works since DAI is 18 decimals

export function shouldBehaveLikeMatchPayouts(): void {
  // ============================================ Setup ============================================
  describe('Setup', async function () {
    it('deploys and initializes properly', async function () {
      expect(await this.matchPayouts.owner()).to.equal(this.accounts.owner);
      expect(await this.matchPayouts.funder()).to.equal(this.accounts.funder);
      expect(await this.matchPayouts.dai()).to.equal(this.dai.address);
      expect(await this.matchPayouts.finalized()).to.equal(false);
      expect(await this.matchPayouts.funded()).to.equal(false);
    });
  });

  // ======================================== Restrictions =========================================
  describe('Restrictions', async function () {
    it('restricts who can set the payout mapping', async function () {
      const payouts = [{ recipient: this.accounts.evilUser, amount: parseEther('1') }];
      const tx = this.matchPayouts.connect(this.signers.evilUser).setPayouts(payouts);
      await expect(tx).to.be.revertedWith('MatchPayouts: caller is not the owner');
    });

    it('restricts who can set the `finalized` flag', async function () {
      const tx = this.matchPayouts.connect(this.signers.evilUser).finalize();
      await expect(tx).to.be.revertedWith('MatchPayouts: caller is not the owner');
    });

    it("restricts who is allowed to withdraw funders' DAI from the contract", async function () {
      const tx = this.matchPayouts.connect(this.signers.evilUser).withdrawFunding();
      await expect(tx).to.be.revertedWith('MatchPayouts: caller is not the funder');
    });

    it('restricts who can set the `funded` flag', async function () {
      const tx = this.matchPayouts.connect(this.signers.evilUser).enablePayouts();
      await expect(tx).to.be.revertedWith('MatchPayouts: caller is not the owner');
    });

    it('prevents setting the payout mapping when the `finalized` flag is true', async function () {
      // Activate flag
      await this.matchPayouts.connect(this.signers.owner).finalize();
      // Try to set payouts
      const payouts = [{ recipient: this.accounts.evilUser, amount: parseEther('1') }];
      const tx = this.matchPayouts.connect(this.signers.owner).setPayouts(payouts);
      await expect(tx).to.be.revertedWith('MatchPayouts: Payouts already finalized');
    });

    it('prevents toggling the `funded` flag if `finalized` is false', async function () {
      const tx = this.matchPayouts.connect(this.signers.owner).enablePayouts();
      await expect(tx).to.be.revertedWith('MatchPayouts: Payouts not finalized');
    });

    it('prevents match from being withdrawn when `funded` is false', async function () {
      await this.matchPayouts.connect(this.signers.owner).finalize();
      const tx = this.matchPayouts.connect(this.signers.evilUser).claimMatchPayout(this.accounts.evilUser);
      await expect(tx).to.be.revertedWith('MatchPayouts: Not yet funded');
    });
  });

  // ======================================== Functionality ========================================
  describe('Functionality', async function () {
    it('lets the owner set the payout mapping', async function () {
      // Match amounts should be zero to start
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal('0');

      // Set payouts and and check for events. Waffle doesn't have an easy way to check for multiple
      // event emissions in one transaction so we only check for one here
      const matchAmounts = [parseEther('1'), parseEther('1.5')];
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      const tx = this.matchPayouts.connect(this.signers.owner).setPayouts(payouts);
      await expect(tx)
        .to.emit(this.matchPayouts, 'PayoutAdded')
        .withArgs(this.accounts.grantOwners[0], matchAmounts[0]);

      // Check that payouts were set properly
      expect(await this.matchPayouts.finalized()).to.equal(false); // sanity check that contract didn't finalize
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal(matchAmounts[1]);
    });

    it('lets the owner finalize payout mapping', async function () {
      expect(await this.matchPayouts.finalized()).to.equal(false);
      const tx = this.matchPayouts.connect(this.signers.owner).finalize();
      await expect(tx).to.emit(this.matchPayouts, 'Finalized');
      expect(await this.matchPayouts.finalized()).to.equal(true);
    });

    it('lets the funder withdraw their DAI', async function () {
      // Mint Dai to the contract to simulate funders transferring funds to it
      const funderAmount = parseEther('300000'); // 300k DAI
      await this.dai.mint(this.matchPayouts.address, funderAmount);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(funderAmount);
      expect(await this.dai.balanceOf(this.accounts.funder)).to.equal('0');

      // Withdraw funds
      const tx = this.matchPayouts.connect(this.signers.funder).withdrawFunding();
      await expect(tx).to.emit(this.matchPayouts, 'FundingWithdrawn');
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal('0');
      expect(await this.dai.balanceOf(this.accounts.funder)).to.equal(funderAmount);
    });

    it('lets the owner indicate that match payments can be withdrawn', async function () {
      expect(await this.matchPayouts.funded()).to.equal(false);
      await this.matchPayouts.connect(this.signers.owner).finalize();
      const tx = this.matchPayouts.connect(this.signers.owner).enablePayouts();
      await expect(tx).to.emit(this.matchPayouts, 'Funded');
      expect(await this.matchPayouts.funded()).to.equal(true);
    });

    it('lets users claim match payouts', async function () {
      // Mint Dai to the contract to simulate funders transferring funds to it
      const funderAmount = parseEther('300000'); // 300k DAI
      await this.dai.mint(this.matchPayouts.address, funderAmount);

      // Set payouts
      const matchAmounts = [parseEther('1'), parseEther('1.5')];
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts);

      // Finalize everything
      await this.matchPayouts.connect(this.signers.owner).finalize();
      await this.matchPayouts.connect(this.signers.owner).enablePayouts();

      // Withdraw
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal('0');

      const tx1 = this.matchPayouts.connect(this.signers.grantOwners[0]).claimMatchPayout(payouts[0].recipient);
      await expect(tx1).to.emit(this.matchPayouts, 'PayoutClaimed').withArgs(payouts[0].recipient, payouts[0].amount);

      const tx2 = this.matchPayouts.connect(this.signers.grantOwners[1]).claimMatchPayout(payouts[1].recipient);
      await expect(tx2).to.emit(this.matchPayouts, 'PayoutClaimed').withArgs(payouts[1].recipient, payouts[1].amount);
    });

    it('End to end test of everything after payout mapping is finalized', async function () {
      // ------------------------------------------ Setup ------------------------------------------
      // Mint Dai to funders
      const funderAmount = parseEther('300000'); // 300k DAI
      await this.dai.mint(this.accounts.funder, funderAmount);

      // Set payouts
      const matchAmounts = [parseEther('15000'), parseEther('37000')]; // 15k and 37k DAI match payouts
      const payouts = [
        { recipient: this.accounts.grantOwners[0], amount: matchAmounts[0] },
        { recipient: this.accounts.grantOwners[1], amount: matchAmounts[1] },
      ];
      await this.matchPayouts.connect(this.signers.owner).setPayouts(payouts);

      // Finalize payout mapping
      await this.matchPayouts.connect(this.signers.owner).finalize();

      // ----------------------------------------- Funding -----------------------------------------
      // Funder directly transfers DAI to contract
      await this.dai.connect(this.signers.funder).transfer(this.matchPayouts.address, funderAmount);

      // Check that total balances in contract is correct
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(funderAmount);

      // Owner marks contract as funded
      await this.matchPayouts.connect(this.signers.owner).enablePayouts();

      // --------------------------------------- Withdrawals ---------------------------------------
      // Grant owners should initially have no balance
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal('0');

      // First grant owner withdraws on their own
      const tx1 = this.matchPayouts.connect(this.signers.grantOwners[0]).claimMatchPayout(payouts[0].recipient);
      await expect(tx1).to.emit(this.matchPayouts, 'PayoutClaimed').withArgs(payouts[0].recipient, payouts[0].amount);

      // Make sure contract balance decreased
      const firstBalance = funderAmount.sub(matchAmounts[0]); // expected contract balance
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(firstBalance);

      // First grant owner should have their match funds
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal('0');

      // Evil user tries to withdraw funds for second grant owner
      const tx2 = this.matchPayouts.connect(this.signers.evilUser).claimMatchPayout(payouts[1].recipient);
      await expect(tx2).to.emit(this.matchPayouts, 'PayoutClaimed').withArgs(payouts[1].recipient, payouts[1].amount);

      // Make sure contract balance decreased again
      const secondBalance = firstBalance.sub(matchAmounts[1]); // new expected contract balance
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(secondBalance);

      // Withdrawal amount still should have went to the second grant owner
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal(matchAmounts[1]);
      expect(await this.dai.balanceOf(this.accounts.evilUser)).to.equal('0');

      // Users can try to withdraw again, but won't receive any extra DAI
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[0])).to.equal('0');
      expect(await this.matchPayouts.payouts(this.accounts.grantOwners[1])).to.equal('0');

      await this.matchPayouts.connect(this.signers.grantOwners[1]).claimMatchPayout(this.accounts.grantOwners[1]);
      expect(await this.dai.balanceOf(this.matchPayouts.address)).to.equal(secondBalance);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[0])).to.equal(matchAmounts[0]);
      expect(await this.dai.balanceOf(this.accounts.grantOwners[1])).to.equal(matchAmounts[1]);
      expect(await this.dai.balanceOf(this.accounts.evilUser)).to.equal('0');
    });
  });
}
