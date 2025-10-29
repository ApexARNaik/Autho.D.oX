import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { motion } from "framer-motion";
import { Shield, Wallet, Zap, Lock, Database, FileCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Landing() {
  const { isConnected, connectWallet, isLoading } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate("/home");
    }
  }, [isConnected, navigate]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen">
      <CyberpunkBackground />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block mb-6 sm:mb-8 mt-12 sm:mt-16 lg:mt-20"
          >
            <Shield
              className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-cyan-400 mx-auto"
              style={{
                filter: "drop-shadow(0 0 30px rgba(0, 255, 255, 0.8))",
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 tracking-tight"
            style={{
              fontFamily: "'Courier New', monospace",
              textShadow: "0 0 20px rgba(0, 255, 255, 0.8), 4px 4px 0 rgba(255, 0, 128, 0.5)",
              background: "linear-gradient(to right, #00ffff, #ff0080)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AUTHO.D.OX
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl lg:text-2xl text-cyan-400 font-mono mb-8 sm:mb-10 lg:mb-12 px-4"
          >
            Proof-of-Prompt on the Blockchain
          </motion.p>

          {/* Connect Wallet Button or Get Started */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-10 sm:mb-12 lg:mb-16"
          >
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                size="lg"
                className="h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl font-bold font-mono bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black border-2 border-cyan-400"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)",
                }}
              >
                <Wallet className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                {isLoading ? "CONNECTING..." : "CONNECT WALLET"}
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/home")}
                size="lg"
                className="h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl font-bold font-mono bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black border-2 border-cyan-400"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)",
                }}
              >
                <Shield className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                GET STARTED
              </Button>
            )}
          </motion.div>

          {/* Project Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="relative"
          >
            <div
              className="border-2 border-cyan-500/50 rounded-lg p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-sm"
              style={{
                boxShadow: "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)",
              }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-pink-400 mb-4 sm:mb-6 font-mono">
                WHAT IS PROOF-OF-PROMPT?
              </h2>
              
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8 font-mono">
                <strong className="text-cyan-400">Proof-of-Prompt</strong> creates a permanent, verifiable record linking a specific user prompt to its corresponding AI-generated output. By storing unique identifiers (like IPFS CIDs) for both the prompt and the content, along with the creator's wallet address and a timestamp, on the blockchain, it establishes an immutable proof of creation.
              </p>

              <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed font-mono">
                This allows creators to demonstrate the origin of their AI-generated work, providing evidence for authorship claims or tracking the provenance of digital content in a decentralized way.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 lg:mt-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="border border-cyan-500/30 rounded-lg p-4 sm:p-6 bg-black/30"
                >
                  <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-cyan-400 font-mono font-bold mb-2 text-sm sm:text-base">IMMUTABLE</h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-mono">
                    Records stored permanently on blockchain
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="border border-pink-500/30 rounded-lg p-4 sm:p-6 bg-black/30"
                >
                  <Database className="h-8 w-8 sm:h-10 sm:w-10 text-pink-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-pink-400 font-mono font-bold mb-2 text-sm sm:text-base">DECENTRALIZED</h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-mono">
                    IPFS storage for distributed content
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="border border-cyan-500/30 rounded-lg p-4 sm:p-6 bg-black/30 sm:col-span-2 md:col-span-1"
                >
                  <FileCheck className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-cyan-400 font-mono font-bold mb-2 text-sm sm:text-base">VERIFIABLE</h3>
                  <p className="text-gray-400 text-xs sm:text-sm font-mono">
                    Cryptographic proof of authorship
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Glitch corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-pink-500" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-pink-500" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}