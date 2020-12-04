import { expect } from 'chai';

export function shouldBehaveLikeGrantMatchPayouts(): void {
  it("should return the new greeting once it's changed", async function () {
    expect(await this.grantMatchPayouts.connect(this.signers.admin).greet()).to.equal('Hello, world!');

    await this.grantMatchPayouts.setGreeting('Hola, mundo!');
    expect(await this.grantMatchPayouts.connect(this.signers.admin).greet()).to.equal('Hola, mundo!');
  });
}
