// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { ConstructorArgs } from '../types';
import { Signer } from '@ethersproject/abstract-signer';

const { ethers } = hre;
const padding = 25; // spacing for console.log outputs

// Define constructor arguments by network
const constructorArgs: Record<string, ConstructorArgs> = {
  localhost: {
    // localhost values populated at runtime
    owner: '',
    token: '',
    funder: '',
  },
  mainnet: {
    owner: '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA', // TODO: UDPATE
    token: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // TODO: UPDATE
    funder: '0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6', // Gitcoin Grants multisig
  },
  rinkeby: {
    owner: '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA', // TODO: UDPATE
    token: '0x2e055eEe18284513B993dB7568A592679aB13188', // TODO: UDPATE
    funder: '0x5cdb35fADB8262A3f88863254c870c2e6A848CcA', // TODO: UDPATE
  },
};

async function main(): Promise<void> {
  const network = hre.network.name;

  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  await hre.run('compile');

  let deployer: Signer;
  if (network === 'localhost') {
    // If localhost, deploy mock ERC20 token and configure constructor arguments
    // Deploy Mock ERC20 token
    console.log('Deploying mock ERC20 on localhost...');
    const Token: ContractFactory = await ethers.getContractFactory('MockERC20');
    const token: Contract = await Token.deploy('Dai', 'DAI');
    await token.deployed();
    console.log('Mock Token deployed to'.padEnd(padding), token.address);

    // Set constructor arguments
    const signers: Signer[] = await ethers.getSigners();
    constructorArgs[network].owner = await signers[1].getAddress();
    constructorArgs[network].funder = await signers[2].getAddress();
    constructorArgs[network].token = token.address;

    // Set deployer
    deployer = signers[0];
  } else {
    // We want to deploy with the third account derived from the mnemonic, and we hardcode that
    // address here to enforce that
    const signers: Signer[] = await ethers.getSigners();

    // NOTE: UPDATE THIS WITH YOUR ADDRESS POSITION IN signers
    deployer = signers[0];

    const deployerAddress = await deployer.getAddress();
    if (deployerAddress !== process.env.DEPLOYER_ADDRESS) {
      throw new Error('Wrong deployer address!');
    }
  }

  // Deploy MatchPayouts contract
  const { owner, funder, token } = constructorArgs[network];
  const MatchPayouts: ContractFactory = await ethers.getContractFactory('MatchPayouts');
  const matchPayouts: Contract = await MatchPayouts.connect(deployer).deploy(owner, funder, token);
  await matchPayouts.deployed();
  console.log('MatchPayouts deployed to'.padEnd(padding), matchPayouts.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
