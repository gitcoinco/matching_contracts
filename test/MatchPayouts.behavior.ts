import { expect } from 'chai';

export function shouldBehaveLikeMatchPayouts(): void {
  it('deploys and initializes properly', async function () {
    expect(await this.matchPayouts.owner()).to.equal(this.accounts.owner);
  });
}
