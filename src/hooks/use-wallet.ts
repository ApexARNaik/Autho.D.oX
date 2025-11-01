import { useState, useEffect } from "react";
import { ethers } from "ethers";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [manuallyDisconnected, setManuallyDisconnected] = useState(false);

  // File: src/hooks/use-wallet.ts

const connectWallet = async () => {
  if (typeof window.ethereum === "undefined") {
    throw new Error("Please install MetaMask or another Web3 wallet");
  }

  setIsLoading(true);
  try {
    // --- MODIFIED FLOW START ---
    // 1. Explicitly request the accounts/permission via the raw Metamask API.
    //    This is the most direct call to Metamask to trigger the pop-up.
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // 2. Set up Ethers objects using the now-connected provider.
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    setWallet({
      address: accounts[0],
      isConnected: true,
      chainId: Number(network.chainId),
      provider,
      signer,
    });
    // --- MODIFIED FLOW END ---

    // Clear manual disconnection flag to allow page-load reconnects in the future
    setManuallyDisconnected(false);
    localStorage.removeItem("walletManuallyDisconnected"); 
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  const disconnectWallet = () => {
    setWallet({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
    });
    setManuallyDisconnected(true);
    localStorage.setItem("walletManuallyDisconnected", "true");
  };

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // Don't auto-reconnect if user manually disconnected
      const wasManuallyDisconnected = localStorage.getItem("walletManuallyDisconnected") === "true";
      if (wasManuallyDisconnected) {
        setManuallyDisconnected(true);
        return;
      }

      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            
            setWallet({
              address: accounts[0],
              isConnected: true,
              chainId: Number(network.chainId),
              provider,
              signer,
            });
          }
        } catch (error) {
          console.error("Failed to check existing connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0 || manuallyDisconnected) {
          disconnectWallet();
        } else if (!manuallyDisconnected) {
          setWallet((prev) => ({ ...prev, address: accounts[0] }));
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [manuallyDisconnected]);

  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    isLoading,
  };
}