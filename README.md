# Gitcoin Matching Contracts

Non-custodial match payouts for Gitcoin Grants.

- [Gitcoin Matching Contracts](#gitcoin-matching-contracts)
  - [About](#about)
  - [Development](#development)
    - [Contract Setup](#contract-setup)
    - [Python Setup](#python-setup)
    - [Test Workflow](#test-workflow)
  - [Acknowledgements](#acknowledgements)

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

Create a copy of `.env.example` and fill in the environment variables, the proceed to the following sections.

### Contract Setup

```sh
# Install dependencies
$ yarn install

# Compile the smart contracts with Hardhat
$ yarn compile

# Generate TypeChain artifacts
$ yarn typechain

# Lint the Solidity code
$ yarn lint:sol

# Lint the TypeScript code
$ yarn lint:ts

# Run tests
$ yarn test

# Generate the code coverage report
$ yarn coverage

# Delete the smart contract artifacts, the coverage reports and the Hardhat cache
$ yarn clean
```

### Python Setup

For the following section you'll need python. To get setup, follow the commands below:

```sh
# Create a new virtual environment in this directory
python3 -m venv venv

# Activate the virtual environment
source ./venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Test Workflow

This section explains how to deploy a local instance of the contract and run Python scripts to
check the contract state. The final versions of this script live in the
[gitcoin/web](https://github.com/gitcoinco/web/) repo, but were developed here.

First let's deploy the contracts locally.

```sh
$ yarn deploy:local
```

Wait a few seconds for that to complete.

Now we want to set a payout mapping and verify the results before finalizing it. We can do this with
the below command, which will set the payout mapping and save the mapping to `outputs/payouts.json`
so we can verify it later

```sh
$ yarn sim:set-payouts
```

Let's compare the total value of the payouts mapping from the events to what we'd expect from
`payouts.json`, and let's compare that to the DAI balance of the contract.

```sh
# Run the python script
yarn sim:verify-payouts
```

As expected, the contract does not have enough DAI to cover all match payouts.

Run `yarn sim:fund` to simulate the funder adding DAI to the contract. Now run `yarn sim:verify-payouts`
again and it will show the contract has sufficient funds! At this point, the owner can call
`enablePayouts` to let grant owners withdraw their match amounts.

## Acknowledgements

This project was built with Paul Berg's [solidity-template](https://github.com/paulrberg/solidity-template).
