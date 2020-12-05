# Gitcoin Matching Contracts

Non-custodial match payouts for Gitcoin Grants.

## About

This contract facilitates non-custodial match payouts after a Gitcoin Grants round. It works as follows:

1. Contract is deployed with empty state
2. When a round is complete, Gitcoin computes the final match amounts based on contribution data
3. Gitcoin calls `setPayouts()` which sets the amount of DAI that each grant earned in matching this round
4. Once all payouts are set, the `readyForPayout` flag is set to `true` and the match payouts are finalized
5. Funders should review the configured payout mapping and make sure they agree with it
6. If so, they transfer their DAI to the contract. This can be done with an ordinary transfer to the contract's address, or with the `addFunds()` method.
   1. **WARNING: Do not send anything except for DAI to this contract or it will be lost**
7. Once funders have sent their DAI to the contract, grant owners can call `withdraw()` to have their match payout sent to their address. Anyone can call this method on behalf of a grant owner, which is useful if your Gitcoin grants address cannot call contract methods.
8. When the next round is about to begin, the `reset()` method is called so the new payout mapping can be set

This contract is deployed on mainnet and Rinkeby at **\_\_\_**

## Development

### Setup

Install dependencies:

```sh
$ yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn build
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

## Acknowledgements

This project was built with Paul Berg's [solidity-template](https://github.com/paulrberg/solidity-template).
