import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { CONTRACT_ABI, CONTRACT_ADDRESS, formatAddress, formatTimestamp, getExplorerUrl } from "@/lib/web3";
import { motion } from "framer-motion";
import { Database, ExternalLink, Loader2, User, Clock, Shield, Link as LinkIcon, AlertTriangle, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { IpfsContent } from "@/components/IpfsContent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

// This interface now includes txHash (which can be empty for old proofs)
interface RegisteredAsset {
  promptCid: string;
  contentCid: string;
  metadataUri: string;
  optionalChatLink: string;
  author: string;
  timestamp: number;
  tokenId: number;
  txHash: string; // Will be blank for old proofs
}

export default function Gallery() {
  const { chainId, provider } = useWallet();
  
  // --- NEW STATE ---
  // This state will hold the address we want to filter by.
  // If it's `null`, we show all proofs.
  const [filterAddress, setFilterAddress] = useState<string | null>(null);
  // This state is just for the text inside the dialog's input box
  const [searchAddress, setSearchAddress] = useState("");
  // --- END NEW STATE ---

  // 1. Get NEW proofs from our fast Convex cache
  // We now fetch conditionally.
  const allCachedProofs = useQuery(
    api.web3.getAllProofs,
    filterAddress ? "skip" : undefined // If filtering, skip this query
  );
  const filteredCachedProofs = useQuery(
    api.web3.getProofsByAuthor,
    filterAddress ? { author: filterAddress } : "skip" // If not filtering, skip this query
  );
  
  // Use whichever list is active
  const cachedProofs = filterAddress ? filteredCachedProofs : allCachedProofs;

  // 2. Create state to hold OLD proofs we find on the blockchain
  const [oldProofs, setOldProofs] = useState<RegisteredAsset[]>([]);
  const [isBlockchainLoading, setIsBlockchainLoading] = useState(true);

  // 3. This effect runs when the wallet connects OR when the filterAddress changes
  useEffect(() => {
    
    // Function to read all old proofs directly from the smart contract
    const fetchOldProofs = async (addressToFilter: string | null) => {
      if (!provider) {
        setIsBlockchainLoading(false);
        return;
      }
      
      console.log(addressToFilter ? `Fetching proofs for ${addressToFilter}...` : "Fetching all old proofs...");
      setIsBlockchainLoading(true);
      setOldProofs([]); // Clear old proofs before fetching new ones

      try {
        const registryContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        // We need the NFT contract to find out the total supply
        const nftContractAddress = await registryContract.nftContract();
        const nftContractABI = [
          {
            "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
            "name": "ownerOf",
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
          }
        ];
        const nftContract = new ethers.Contract(nftContractAddress, nftContractABI, provider);

        // Loop to find the total count
        let totalSupply = 0;
        while (true) {
          try {
            await nftContract.ownerOf(totalSupply);
            totalSupply++;
          } catch (e) {
            break; // Stop when ownerOf fails (we found the end)
          }
        }
        
        console.log(`Found ${totalSupply} total NFTs on-chain.`);

        const foundProofs: RegisteredAsset[] = [];
        for (let i = 0; i < totalSupply; i++) {
          const proof = await registryContract.proofData(i);
          
          // --- NEW FILTER LOGIC ---
          // If we have a filter and the author doesn't match, skip this proof.
          if (addressToFilter && proof.author.toLowerCase() !== addressToFilter.toLowerCase()) {
            continue; 
          }
          // --- END NEW FILTER LOGIC ---
          
          // Format the on-chain data to match our 'RegisteredAsset' type
          foundProofs.push({
            tokenId: i,
            promptCid: proof.promptCid,
            contentCid: proof.contentCid,
            metadataUri: proof.metadataUri,
            optionalChatLink: proof.optionalChatLink || "",
            author: proof.author,
            timestamp: Number(proof.timestamp),
            txHash: "", // Set txHash to empty, as we don't have it
          });
        }
        
        setOldProofs(foundProofs);
        console.log(`Finished fetching ${foundProofs.length} proofs.`);

      } catch (error) {
        console.error("Error fetching old proofs:", error);
      } finally {
        setIsBlockchainLoading(false);
      }
    };

    fetchOldProofs(filterAddress);
  }, [provider, filterAddress]); // This effect now re-runs when filterAddress changes

  // 4. Combine and de-duplicate the lists
  const getCombinedAssets = () => {
    const newProofs = cachedProofs || [];
    
    // Create a Set of token IDs we already have from the cache
    const newTokenIds = new Set(newProofs.map(p => p.tokenId));
    
    // Filter the old proofs to only include ones we *don't* already have
    const uniqueOldProofs = oldProofs.filter(p => !newTokenIds.has(p.tokenId));
    
    // Combine the lists and sort by tokenId (newest first)
    return [...newProofs, ...uniqueOldProofs].sort((a, b) => b.tokenId - a.tokenId);
  };

  const assets: RegisteredAsset[] = getCombinedAssets();
  // Update loading state to check the correct query
  const isLoading = (filterAddress ? filteredCachedProofs === undefined : allCachedProofs === undefined) && isBlockchainLoading;

  return (
    <div className="min-h-screen">
      <CyberpunkBackground />
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <Database
                className="h-16 w-16 text-pink-500 mx-auto"
                style={{
                  filter: "drop-shadow(0 0 20px rgba(255, 0, 128, 0.8))",
                }}
              />
            </motion.div>

            <h1
              className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "0 0 20px rgba(255, 0, 128, 0.8), 4px 4px 0 rgba(0, 255, 255, 0.5)",
                background: "linear-gradient(to right, #ff0080, #00ffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              REGISTERED ASSET GALLERY
            </h1>
          </div>

          {/* --- NEW BUTTONS --- */}
          <motion.div 
            className="flex justify-center gap-4 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => setFilterAddress(null)} 
              variant={!filterAddress ? "default" : "outline"}
              className="font-mono bg-cyan-500/20 text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/30 data-[state=open]:bg-cyan-500/30"
            >
              <Database className="mr-2 h-4 w-4" />
              Show All Proofs
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={filterAddress ? "default" : "outline"}
                  className="font-mono bg-pink-500/20 text-pink-400 border-pink-400/50 hover:bg-pink-500/30 data-[state=open]:bg-pink-500/30"
                >
                  <Search className="mr-2 h-4 w-4" />
                  View by Address
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black/90 border-cyan-500/50 text-white font-mono">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-cyan-400">Search by Wallet Address</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Paste any wallet address (like yours!) to see all proofs registered by that user.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                  placeholder="0x..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="bg-black/70 border-pink-500/30 text-white font-mono"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline" className="font-mono text-gray-400" onClick={() => setSearchAddress("")}>Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button 
                      onClick={() => { 
                        if (ethers.isAddress(searchAddress)) {
                          setFilterAddress(searchAddress); 
                          setSearchAddress("");
                        } else {
                          alert("Invalid wallet address");
                        }
                      }} 
                      className="font-mono bg-cyan-500 text-black hover:bg-cyan-600"
                    >
                      Search
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
          {/* --- END NEW BUTTONS --- */}


          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <span className="ml-4 text-xl font-mono text-gray-400">LOADING ASSETS...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && assets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-xl font-mono text-gray-400">
                {filterAddress ? "No assets found for this address." : "No assets registered yet."}
              </p>
              {!filterAddress && (
                <p className="text-sm font-mono text-gray-500 mt-2">Be the first to register an asset!</p>
              )}
              {filterAddress && (
                <Button onClick={() => setFilterAddress(null)} variant="link" className="font-mono text-cyan-400">
                  Show All Proofs
                </Button>
              )}
            </motion.div>
          )}

          {/* Assets Grid */}
          {!isLoading && assets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset, index) => (
                <motion.div
                  key={`${asset.tokenId}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative group"
                >
                  <Card
                    className="bg-black/70 border-2 border-cyan-500/30 hover:border-pink-500/50 transition-all duration-300 overflow-hidden"
                    style={{
                      boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)",
                    }}
                  >
                    <CardHeader className="border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-pink-500/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-cyan-400 tracking-wider flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          BADGE #{asset.tokenId}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                      {/* NFT Badge Image */}
                      {asset.metadataUri && (
                        <div className="w-full h-48 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-lg flex items-center justify-center overflow-hidden border border-cyan-500/30">
                          <Shield className="h-24 w-24 text-cyan-400" style={{ filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))" }} />
                        </div>
                      )}

                      {/* Prompt Content */}
                      <div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <LinkIcon className="h-3 w-3 text-cyan-400" />
                          <span className="font-mono text-gray-400">Prompt:</span>
                        </div>
                        <IpfsContent cid={asset.promptCid} />
                      </div>

                      {/* AI Response Content */}
                      {asset.contentCid && (
                        <div>
                          <div className="flex items-center gap-2 text-xs mb-2">
                            <LinkIcon className="h-3 w-3 text-cyan-400" />
                            <span className="font-mono text-gray-400">Response:</span>
                          </div>
                          <IpfsContent cid={asset.contentCid} />
                        </div>
                      )}

                      {/* Owner */}
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3 w-3 text-cyan-400" />
                        <span className="font-mono text-gray-400">Owner:</span>
                        <span className="font-mono text-cyan-400">{formatAddress(asset.author)}</span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-pink-400" />
                        <span className="font-mono text-gray-400">Registered:</span>
                        <span className="font-mono text-pink-400">{formatTimestamp(asset.timestamp)}</span>
                      </div>

                      {/* Verify Button */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 border border-cyan-400/50 text-cyan-400 font-mono text-xs"
                          // Only enable the button if the txHash exists
                          disabled={!asset.txHash} 
                        >
                          <a
                            href={getExplorerUrl(asset.txHash, chainId || 80002)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {asset.txHash ? (
                              <ExternalLink className="mr-2 h-3 w-3" />
                            ) : (
                              <AlertTriangle className="mr-2 h-3 w-3" />
                            )}
                            {asset.txHash ? "VERIFY ON EXPLORER" : "NO TX HASH (OLD PROOF)"}
                          </a>
                        </Button>
                      </motion.div>
                    </CardContent>

                    {/* Glitch corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}