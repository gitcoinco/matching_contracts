import { Signer } from '@ethersproject/abstract-signer';

export interface Accounts {
  deployer: string; // user that will deploy the contract
  owner: string; // user that will own the contract
  newOwner: string; // in tests, owner transfers ownership to this user
  evilUser: string; // address of user who tries to bypass contract restrictions
  funders: string[]; // users who fund the grants round
  grantOwners: string[]; // grant owners who receive match payouts
}

export interface Signers {
  deployer: Signer;
  owner: Signer;
  newOwner: Signer;
  evilUser: Signer;
  funders: Signer[];
  grantOwners: Signer[];
}
