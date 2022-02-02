import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, './.env') });

import { HardhatUserConfig } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';
import './tasks/accounts';
import './tasks/clean';
import './tasks/set-payouts';
import './tasks/fund';

import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-etherscan';

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

// Ensure that we have all the environment variables we need.
if (!process.env.MNEMONIC) throw new Error('Please set your MNEMONIC in a .env file');
const mnemonic = process.env.MNEMONIC as string;

if (!process.env.INFURA_API_KEY) throw new Error('Please set your INFURA_API_KEY in a .env file');
const infuraApiKey = process.env.INFURA_API_KEY as string;

if (!process.env.ETHERSCAN_API_KEY) throw new Error('Please set your ETHERSCAN_API_KEY in a .env file');
const etherscanApiKey = process.env.ETHERSCAN_API_KEY as string;

if (!process.env.DEPLOYER_ADDRESS) throw new Error('Please set your DEPLOYER_ADDRESS in a .env file');

const accounts = {
  count: 10,
  initialIndex: 0,
  mnemonic,
  path: "m/44'/60'/0'/0",
};

// Define network configurations
function createNetworkConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = 'https://' + network + '.infura.io/v3/' + infuraApiKey;
  return {
    accounts,
    chainId: chainIds[network],
    url,
  };
}

const configurePolygonNetwork = (testnet: boolean) => ({
  accounts,
  url: testnet ? 'https://rpc-mumbai.maticvigil.com' : 'https://polygon-rpc.com/',
});

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: chainIds.hardhat,
    },
    goerli: createNetworkConfig('goerli'),
    kovan: createNetworkConfig('kovan'),
    rinkeby: createNetworkConfig('rinkeby'),
    ropsten: createNetworkConfig('ropsten'),
    mainnet: createNetworkConfig('mainnet'),
    polygon: configurePolygonNetwork(false),
    polygonMumbai: configurePolygonNetwork(true),
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: '0.7.5',
    settings: {
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  gasReporter: {
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      mainnet: etherscanApiKey,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },
};

export default config;
