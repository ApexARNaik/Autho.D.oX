import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { formatAddress, formatTimestamp, getExplorerUrl } from "@/lib/web3";
import { motion } from "framer-motion";
import { Database, ExternalLink, Loader2, User, Clock, Shield, Link as LinkIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IpfsContent } from "@/components/IpfsContent";

interface RegisteredAsset {
  promptCid: string;
  contentCid: string;
  metadataUri: string;
  optionalChatLink: string;
  author: string;
  timestamp: number;
  tokenId: number;
}

export default function Gallery() {
  const { chainId, isConnected } = useWallet();
  
  // Load proofs from Convex database (much faster than blockchain)
  const cachedProofs = useQuery(api.web3.getAllProofs);
  
  const isLoading = cachedProofs === undefined;
  const assets: RegisteredAsset[] = cachedProofs || [];

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
              <p className="text-xl font-mono text-gray-400">No assets registered yet.</p>
              <p className="text-sm font-mono text-gray-500 mt-2">Be the first to register an asset!</p>
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
                        >
                          <a
                            href={getExplorerUrl(`${asset.tokenId}`, chainId || 1)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            VERIFY ON EXPLORER
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