import { Accounts, Signers } from './';
import { MatchPayouts } from '../typechain/MatchPayouts';

declare module 'mocha' {
  export interface Context {
    accounts: Accounts;
    matchPayouts: MatchPayouts;
    signers: Signers;
  }
}
