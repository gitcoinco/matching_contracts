import { BigNumberish, BigNumber } from 'ethers';
import { defaultAbiCoder, hexStripZeros, hexZeroPad, keccak256 } from 'ethers/lib/utils';
import { network } from 'hardhat';

// --- Constants ---
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Mapping from lowercase token symbol to properties about that token
export const tokens = {
  eth: { address: ETH_ADDRESS, name: 'Ether', symbol: 'ETH', decimals: 18, mappingSlot: null },
  weth: { address: WETH_ADDRESS, name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, mappingSlot: '0x3' },
  dai: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    mappingSlot: '0x2',
  },
  gtc: {
    address: '0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F',
    name: 'Gitcoin',
    symbol: 'GTC',
    decimals: 18,
    mappingSlot: '0x5',
  },
  usdc: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    mappingSlot: '0x9',
  },
  uni: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    mappingSlot: '0x4',
  },
};

export type SupportedToken = keyof typeof tokens;

// Arbitrarily set token balance of an account to a given amount
export async function setBalance(tokenSymbol: SupportedToken, to: string, amount: BigNumberish): Promise<void> {
  // If ETH, set the balance directly
  if (tokenSymbol === 'eth') {
    await network.provider.send('hardhat_setBalance', [to, BigNumber.from(amount).toHexString()]);
    return;
  }

  // Otherwise, compute the storage slot containing this users balance and use it to set the balance
  const tokenMapping = tokens;
  const slot = getBalanceOfSlotSolidity(tokenMapping[tokenSymbol].mappingSlot, to);
  await network.provider.send('hardhat_setStorageAt', [
    tokenMapping[tokenSymbol as keyof typeof tokenMapping].address,
    slot,
    to32ByteHex(amount),
  ]);
}

// --- Private (not exported) helpers ---
// Determine the storage slot used to store an account's balance. Notes:
//   - This only works for Solidity tokens since Vyper has different storage layout rules
//   - Read about Solidity storage layout rules at https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html#mappings-and-dynamic-arrays
//   - `defaultAbiCoder.encode` is equivalent to Solidity's `abi.encode()`, and we strip leading zeros from the hashed
//     value to conform to the JSON-RPC spec: https://ethereum.org/en/developers/docs/apis/json-rpc/#hex-value-encoding
function getBalanceOfSlotSolidity(mappingSlot: string, address: string) {
  return hexStripZeros(keccak256(defaultAbiCoder.encode(['address', 'uint256'], [address, mappingSlot])));
}

// Converts a number to a 32 byte hex string
function to32ByteHex(x: BigNumberish) {
  return hexZeroPad(BigNumber.from(x).toHexString(), 32);
}
