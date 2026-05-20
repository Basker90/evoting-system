"""
deploy.py — compiles and deploys Voting.sol to Ganache.
Run once before starting the Flask backend.

Requirements:
  pip install py-solc-x web3

Usage:
  python deploy.py
"""

import json
from solcx import compile_standard, install_solc
from web3 import Web3

install_solc("0.8.0")

with open("../smart_contract/Voting.sol") as f:
    source = f.read()

compiled = compile_standard(
    {
        "language": "Solidity",
        "sources": {"Voting.sol": {"content": source}},
        "settings": {
            "outputSelection": {
                "*": {"*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]}
            }
        },
    },
    solc_version="0.8.0",
)

abi = compiled["contracts"]["Voting.sol"]["Voting"]["abi"]
bytecode = compiled["contracts"]["Voting.sol"]["Voting"]["evm"]["bytecode"]["object"]

with open("contract_abi.json", "w") as f:
    json.dump(abi, f, indent=2)

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))
account = w3.eth.accounts[0]

Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
tx_hash = Contract.constructor().transact({"from": account, "gas": 3000000})
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

print("=" * 50)
print(f"Contract deployed at: {receipt.contractAddress}")
print(f"Block number:         {receipt.blockNumber}")
print("=" * 50)
print("\nAdd this to your .env or export it:")
print(f"  CONTRACT_ADDRESS={receipt.contractAddress}")
