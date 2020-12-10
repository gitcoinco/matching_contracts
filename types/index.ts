import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';

export interface Accounts {
  deployer: string; // user that will deploy the contract
  owner: string; // user that will own the contract
  newOwner: string; // in tests, owner transfers ownership to this user
  evilUser: string; // address of user who tries to bypass contract restrictions
  funder: string; // user who funds the grants round
  grantOwners: string[]; // grant owners who receive match payouts
}

export interface Signers {
  deployer: Signer;
  owner: Signer;
  newOwner: Signer;
  evilUser: Signer;
  funder: Signer;
  grantOwners: Signer[];
}

// Match payout constructor arguments
export interface ConstructorArgs {
  owner: string; // Contract owner
  funder: string; // Gitcoin Grants multisig
  dai: string; // Dai address
}

// Used for setting payout mapping
export interface PayoutFields {
  recipient: string;
  amount: BigNumber;
}
