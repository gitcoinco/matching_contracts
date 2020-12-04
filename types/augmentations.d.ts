import { Accounts, Signers } from './';
import { GrantMatchPayouts } from '../typechain/GrantMatchPayouts';

declare module 'mocha' {
  export interface Context {
    accounts: Accounts;
    grantMatchPayouts: GrantMatchPayouts;
    signers: Signers;
  }
}
