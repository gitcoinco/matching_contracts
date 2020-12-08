# Gitcoin Matching Contracts

Non-custodial match payouts for Gitcoin Grants.

## About

<img width="900" src="https://p200.p0.n0.cdn.getcloudapp.com/items/12uKrDq5/Screen%20Shot%202020-12-08%20at%208.41.45%20AM.png?source=viewer&v=ecde302feb2463818307271ae4e22026" alt="Architecture">

This contract allows for non-custodial Gitcoin Grants match payouts. It works as follows:

1. During a matching round, deploy a new instance of this contract
2. Once the round is complete, Gitcoin computes the final match amounts earned by each grant
3. Over the course of multiple transactions, the contract owner will set the payout mapping
   stored in the `payouts` variable. This maps each grant receiving address to the match amount
   owed, in DAI
4. Once this mapping has been set for each grant, the contract owner calls `finalize()`. This
   sets `finalized` to `true`, and at this point the payout mapping can no longer be updated.
5. Funders review the payout mapping, and if they approve they transfer their funds to this
   contract. This can be done with an ordinary transfer to this contract address. **WARNING: Do not send anything except for DAI to this contract or it will be lost**
6. Once all funds have been transferred, the contract owner calls `enablePayouts` which lets
   grant owners withdraw their match payments
7. Grant owners can now call `withdraw()` to have their match payout sent to their address.
   Anyone can call this method on behalf of a grant owner, which is useful if your Gitcoin
   grants address cannot call contract methods.

This contract is deployed on mainnet at TBD

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
