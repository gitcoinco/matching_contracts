import { expect } from 'chai';

export function shouldBehaveLikeGrantMatchPayouts(): void {
  it('deploys and initializes properly', async function () {
    expect(await this.grantMatchPayouts.owner()).to.equal(this.accounts.owner);
  });

  it("should return the new greeting once it's changed", async function () {
    expect(await this.grantMatchPayouts.greet()).to.equal('');

    await this.grantMatchPayouts.setGreeting('Hola, mundo!');
    expect(await this.grantMatchPayouts.connect(this.signers.deployer).greet()).to.equal(
      'Hola, mundo!'
    );
  });
}
