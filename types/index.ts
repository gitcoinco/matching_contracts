import { Signer } from '@ethersproject/abstract-signer';

export interface Accounts {
  deployer: string; // user that will deploy the contract
  owner: string; // user that will own the contract
}

export interface Signers {
  deployer: Signer;
}
