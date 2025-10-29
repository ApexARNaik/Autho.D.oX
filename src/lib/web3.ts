import { ethers } from "ethers";

// Contract ABI - will be used to interact with the smart contract
export const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_nftContractAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "contentCid",
				"type": "string"
			}
		],
		"name": "ContentAlreadyRegistered",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "OnlyOwner",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "NftContractOwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "tokenId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "promptCid",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "contentCid",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "metadataUri",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "optionalChatLink",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ProofRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "contentCidRegistered",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "nftContract",
		"outputs": [
			{
				"internalType": "contract AuthoDoxNFT",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "proofData",
		"outputs": [
			{
				"internalType": "string",
				"name": "promptCid",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "contentCid",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "metadataUri",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "optionalChatLink",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_promptCid",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_contentCid",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_metadataUri",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_optionalChatLink",
				"type": "string"
			}
		],
		"name": "registerProof",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newOwner",
				"type": "address"
			}
		],
		"name": "transferNftContractOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// Contract address - replace with your deployed contract address
export const CONTRACT_ADDRESS = "0x92Cd43088f0d6Fa88BaB355b224d973bd486019D"; // TODO: Replace with actual contract address

export interface Proof {
  prompt: string;
  submitter: string;
  timestamp: number;
  proofHash: string;
}

export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const getExplorerUrl = (txHash: string, chainId: number = 1): string => {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
  };
  return `${explorers[chainId] || explorers[1]}/tx/${txHash}`;
};
