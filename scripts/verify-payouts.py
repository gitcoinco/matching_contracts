"""
A modified version script will be used in gitcoinco/web repository to facilitate match payouts
using the production data
"""

import json
from decimal import Decimal
from web3 import Web3

# ========================================= CONFIGURATION ==========================================

# Read our expected data
with open('outputs/payouts.json') as f:
  expected_payouts = json.load(f)

# Provider URL
PROVIDER = 'ws://127.0.0.1:8545/'

# Contract addresses
match_payouts_address = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' # deterministic on localhost
dai_address = '0x5FbDB2315678afecb367f032d93F642f64180aa3' # deterministic on localhost

# Filters for finding events
from_block = 0 # block contract was deployed at

# =========================================== CONSTANTS ============================================

SCALE = Decimal(1e18)
match_payouts_abi = '[ { "inputs": [ { "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_funder", "type": "address" }, { "internalType": "contract IERC20", "name": "_dai", "type": "address" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [], "name": "Finalized", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Funded", "type": "event" }, { "anonymous": false, "inputs": [], "name": "FundingWithdrawn", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "recipient", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "PayoutAdded", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "address", "name": "recipient", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "PayoutClaimed", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "_recipient", "type": "address" } ], "name": "claimMatchPayout", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "dai", "outputs": [ { "internalType": "contract IERC20", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "enablePayouts", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "finalize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "funder", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "payouts", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "components": [ { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "internalType": "struct MatchPayouts.PayoutFields[]", "name": "_payouts", "type": "tuple[]" } ], "name": "setPayouts", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "state", "outputs": [ { "internalType": "enum MatchPayouts.State", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "withdrawFunding", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]'
erc20_abi = '[{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'

# ========================================= MAIN EXECUTION =========================================

# Get expected total match amount
expected_total_dai_amount = Decimal(0)
for payout in expected_payouts:
  expected_total_dai_amount += Decimal(payout['amount'])
expected_total_dai_amount = expected_total_dai_amount / SCALE

# Get contract instances
w3 = Web3(Web3.WebsocketProvider(PROVIDER))
match_payouts = w3.eth.contract(address=match_payouts_address, abi=match_payouts_abi)
dai = w3.eth.contract(address=dai_address, abi=erc20_abi)

# Get PayoutAdded events
payout_added_filter = match_payouts.events.PayoutAdded.createFilter(fromBlock=from_block)
payout_added_logs = payout_added_filter.get_all_entries() # print these if you need to inspect them

# Get total required DAI balance based on PayoutAdded events
total_dai_required = Decimal(0)
for log in payout_added_logs:
  total_dai_required += Decimal(log['args']['amount'])
total_dai_required = total_dai_required / SCALE # convert to human units

# Verify that total DAI required (from event logs) equals the expected amount
if expected_total_dai_amount != total_dai_required:
  print('\n* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
  print('Total DAI payout amount in the contract does not equal the expected value!')
  print('  Total expected amount:  ', expected_total_dai_amount)
  print('  Total amount from logs: ', total_dai_required)
  print('* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\n')
  raise Exception('Total payout amount in the contract does not equal the expected value!')
print('Total payout amount in the contracts is the expected value')

# Get contract DAI balance
dai_balance = Decimal(dai.functions.balanceOf(match_payouts_address).call()) / SCALE

# Verify that contract has sufficient DAI balance to cover all payouts
print('\n* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *')
if dai_balance == total_dai_required:
  print(f'Contract balance of {dai_balance} DAI is exactly equal to the required amount')

elif dai_balance < total_dai_required:
  shortage = total_dai_required - dai_balance
  print('Contract DAI balance is insufficient')
  print('  Required balance: ', total_dai_required)
  print('  Current balance:  ', dai_balance)
  print('  Extra DAI needed: ', shortage)
  print(f'\n Contract needs another {shortage} DAI')

elif dai_balance > total_dai_required:
  excess = dai_balance - total_dai_required
  print('Contract has excess DAI balance')
  print('  Required balance:  ', total_dai_required)
  print('  Current balance:   ', dai_balance)
  print('  Excess DAI amount: ', excess)
  print(f'\n Contract has an excess of {excess} DAI')
print('* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *\n')
