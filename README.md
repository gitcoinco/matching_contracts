# Gitcoin Matching Contracts

Non-custodial match payouts for Gitcoin Grants.

- [Gitcoin Matching Contracts](#gitcoin-matching-contracts)
  - [About](#about)
  - [Contract Design and Security](#contract-design-and-security)
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
   owed, in the ERC20 token
4. Once this mapping has been set for each grant, the contract owner calls `finalize()`. This
   sets `finalized` to `true`, and at this point the payout mapping can no longer be updated.
5. Funders review the payout mapping, and if they approve they transfer their funds to this
   contract. This can be done with an ordinary transfer to this contract address.
6. Once all funds have been transferred, the contract owner calls `enablePayouts` which lets
   grant owners withdraw their match payments
7. Grant owners can now call `claimMatchPayout()` to have their match payout sent to their address.
   Anyone can call this method on behalf of a grant owner, which is useful if your Gitcoin
   grants address cannot call contract methods.

### Contract Deployments

- round 8

  - rinkeby : [0xf2354570bE2fB420832Fb7Ff6ff0AE0dF80CF2c6](https://rinkeby.etherscan.io/tx/0xf2354570bE2fB420832Fb7Ff6ff0AE0dF80CF2c6)
  - mainnet : [0xf2354570bE2fB420832Fb7Ff6ff0AE0dF80CF2c6](https://etherscan.io/address/0xf2354570bE2fB420832Fb7Ff6ff0AE0dF80CF2c6)

- round 9

  - mainnet : [0x3342e3737732d879743f2682a3953a730ae4f47c](https://etherscan.io/address/0x3342e3737732d879743f2682a3953a730ae4f47c)

- round 10

  - rinkeby : [0x8B7E04872f4e3F12e6CEb7F25BF8C74813ad3e38](https://rinkeby.etherscan.io/address/0x8B7E04872f4e3F12e6CEb7F25BF8C74813ad3e38)
  - mainnet : [0x3ebAFfe01513164e638480404c651E885cCA0AA4](https://etherscan.io/address/0x3ebAFfe01513164e638480404c651E885cCA0AA4)

- round 11
  - rinkeby : [0x77278BB93694827f3c60Cdf0275C9C58AED0BEbE](https://rinkeby.etherscan.io/address/0x77278BB93694827f3c60Cdf0275C9C58AED0BEbE)
  - mainnet : [0x0EbD2E2130b73107d0C45fF2E16c93E7e2e10e3a](https://etherscan.io/address/0x0EbD2E2130b73107d0C45fF2E16c93E7e2e10e3a)
  - 
- round 12
  - mainnet : [0xAB8d71d59827dcc90fEDc5DDb97f87eFfB1B1A5B](https://etherscan.io/address/0xAB8d71d59827dcc90fEDc5DDb97f87eFfB1B1A5B)

- round 13
  - mainnet : [0xF63FD0739cB68651eFbD06BCcb23F1A1623D5520](https://etherscan.io/address/0xF63FD0739cB68651eFbD06BCcb23F1A1623D5520)
  - UNI Round : [0x0019863771b57FBA997cF6602CB2dD572A43e977](https://etherscan.io/address/0x0019863771b57FBA997cF6602CB2dD572A43e977)
  - OHM Round : [0x868CBca73915f842A70cD9584D80a57DB5E690C1](https://etherscan.io/address/0x868CBca73915f842A70cD9584D80a57DB5E690C1)

## Contract Design and Security

When designing and developing this contract, security was the number one goal. This led to keeping
things as simple as possible in many places, and as a result some aspects of the design may seem
inefficient or suboptimal. This section will explain those design decisions. To start, let's
review the contract flow over its lifecycle as shown below:

![image](https://user-images.githubusercontent.com/17163988/102834965-42d9bf80-43aa-11eb-9072-1d318de8ef66.png)

Now lets review a few of the specific design decisions in this context.

The payout mapping: Match amounts are saved in a mapping called `payouts`, and because there are about 1000 grants that receive match payouts, it takes multiple transactions and a lot of gas to set this mapping. Using a Merkle distributor may feel like the cleaner way to do it, but we intentionally decided against that here. One reason is because it's more complex, and since this contract was not formally audited we wanted to keep it simple. Another reason is because if we set the payout mapping wrong, we can easily override it with additional calls to `setPayouts` without having to generate a new merkle root.

Funding: All funds to be paid out are expected to come from the [Gitcoin Grants multisig](https://etherscan.io/address/0xde21f729137c5af1b01d73af1dc21effa2b8a0d6). We take advantage of the fact that we trust this funder to keep things simple. The contract is funded with an ordinary transfer of an ERC20 token to the `MatchPayouts` contract. If the funder makes a mistake during this transfer, they have the ability to withdraw funds using the `withdrawFunding` method, which lets only the funder withdraw any tokens from the contract. Notice how there are no restrictions on when or what token the funder can withdraw—they can withdraw any amount of any token at any time! In an adversarial environment, this would be a problem. But because we trust the funder, we enable this functionality as a safeguard so funds can be withdrawn at any time in case something goes wrong.

Claiming Funds: Some grants use contract wallets and it may not be easy for them to call a method allowing them to claim funds. As a result, the `claimMatchPayout` method allows anyone to withdraw on behalf of a grant, and transfers the funds to that grant's receiving address. Additionally, because there is no `msg.sender` usage, and because all match payouts are in a single ERC20 token, there is no reentrancy risk to worry about here.

## Development

Create a copy of `.env.example` and fill in the environment variables, the proceed to the following sections.
If you don't plan on deploying the contracts, you should be able to leave these with the defaults.

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
yarn deploy:local
```

Wait a few seconds for that to complete.

Now we want to set a payout mapping and verify the results before finalizing it. We can do this with
the below command, which will set the payout mapping and save the mapping to `outputs/payouts.json`
so we can verify it later

```sh
yarn sim:set-payouts
```

Let's compare the total value of the payouts mapping from the events to what we'd expect from
`payouts.json`, and let's compare that to the ERC20 balance of the contract.

```sh
# Run the python script
yarn sim:verify-payouts
```

As expected, the contract does not have enough ERC20 token to cover all match payouts.

Run `yarn sim:fund` to simulate the funder adding ERC20 token to the contract. Now run `yarn sim:verify-payouts`
again and it will show the contract has sufficient funds! At this point, the owner can call
`enablePayouts` to let grant owners withdraw their match amounts.



## Deploy Steps
- update inputs-rinkeby.js and input-mainnet.js with needed params
- update deploy.ts with the right config for mainnet and rinkeby 
- deploy the contract
- verify the contract using hardhat and verify on etherscan


### Verify Source Code after Deployment

The `hardhat-etherscan` plugin is installed and can be used to verify contract source code after it has been deployed. Documentation can be found here: <https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html>

## Acknowledgements

This project was built with Paul Berg's [solidity-template](https://github.com/paulrberg/solidity-template).
