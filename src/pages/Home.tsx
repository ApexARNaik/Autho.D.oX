import { CyberpunkBackground } from "@/components/CyberpunkBackground";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/hooks/use-wallet";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/web3";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { Lock, Loader2, Shield, Paperclip, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const [promptText, setPromptText] = useState("");
  const [promptFiles, setPromptFiles] = useState<File[]>([]);
  const [aiResponseText, setAiResponseText] = useState("");
  const [aiResponseFiles, setAiResponseFiles] = useState<File[]>([]);
  const [chatLink, setChatLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const promptFileInputRef = useRef<HTMLInputElement>(null);
  const aiResponseFileInputRef = useRef<HTMLInputElement>(null);
  
  const { isConnected, signer } = useWallet();
  const navigate = useNavigate();
  const uploadToIPFS = useAction(api.ipfs.uploadToCID);
  const cacheProof = useMutation(api.web3.cacheProof);

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handlePromptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPromptFiles(Array.from(e.target.files));
    }
  };

  const handleAiResponseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAiResponseFiles(Array.from(e.target.files));
    }
  };

  const removePromptFile = (index: number) => {
    setPromptFiles(promptFiles.filter((_, i) => i !== index));
  };

  const removeAiResponseFile = (index: number) => {
    setAiResponseFiles(aiResponseFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!promptText.trim()) {
      toast.error("Please enter your prompt text");
      return;
    }

    if (!aiResponseText.trim()) {
      toast.error("Please enter the AI response text");
      return;
    }

    if (!isConnected || !signer) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify network connection first
      const provider = signer.provider;
      if (!provider) {
        throw new Error("No provider available");
      }

      toast.info("Verifying network connection...");
      
      // Define the correct network (Polygon Amoy Testnet)
      const correctChainId = 80002; 
      let network;
      
      try {
        network = await provider.getNetwork();
        console.log("Connected to network:", network.chainId);

        // --- THIS IS THE FIX ---
        // Check if the network ID is correct
        if (network.chainId !== correctChainId) {
          toast.error("Wrong Network", {
            description: `Please switch to Polygon Amoy Testnet (Chain ID: ${correctChainId}) in your wallet.`
          });
          setIsSubmitting(false); // Stop the loading spinner
          return; // Stop the function from continuing
        }
        // --- END OF FIX ---

      } catch (networkError) {
        console.error("Network verification failed:", networkError);
        toast.error("Network Error", {
          description: "Unable to connect to blockchain network. Please check your wallet and try again."
        });
        setIsSubmitting(false); // Stop the loading spinner
        return; // Stop the function
      }

      // --- 1. PREPARE DATA ---
      toast.info("Preparing data for upload...");
      
      const promptFile = promptFiles[0];
      const promptFileData = promptFile ? await fileToBase64(promptFile) : undefined;
      
      const responseFile = aiResponseFiles[0];
      const responseFileData = responseFile ? await fileToBase64(responseFile) : undefined;

      // --- 2. UPLOAD PROMPT & CONTENT VIA CONVEX ---
      toast.info("Uploading prompt & content to IPFS...");
      
      const promptCid = await uploadToIPFS({
        text: promptText,
        fileData: promptFileData,
        fileName: promptFile?.name
      });

      const contentCid = await uploadToIPFS({
        text: aiResponseText,
        fileData: responseFileData,
        fileName: responseFile?.name
      });

      // --- 3. GENERATE & UPLOAD METADATA ---
      toast.info("Generating NFT metadata...");
      
      const metadataJson = {
        name: `Autho.D.oX Proof #${Date.now()}`,
        description: `Proof of authorship for: ${promptText.substring(0, 50)}...`,
        image: (responseFile && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(responseFile.name)) 
          ? `ipfs://${contentCid}` 
          : undefined,
        attributes: [
          { trait_type: "Prompt CID", value: promptCid },
          { trait_type: "Content CID", value: contentCid },
          { trait_type: "Author", value: await signer.getAddress() },
          { trait_type: "Timestamp", value: Math.floor(Date.now() / 1000) },
          { trait_type: "Chat Link", value: chatLink || "N/A" }
        ]
      };

      const metadataCid = await uploadToIPFS({
        text: JSON.stringify(metadataJson)
      });

      // --- 4. CALL SMART CONTRACT ---
      toast.info("Sending transaction to blockchain... Please confirm in wallet.");
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.registerProof(
        promptCid,
        contentCid,
        metadataCid,
        chatLink || ""
      );
      
      toast.info("Waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Extract tokenId from the ProofRegistered event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "ProofRegistered");
      
      const tokenId = event ? Number(event.args.tokenId) : 0;
      
      // --- 5. CACHE TO CONVEX DB ---
      toast.info("Caching proof data...");
      await cacheProof({
        promptCid,
        contentCid,
        metadataUri: metadataCid,
        optionalChatLink: chatLink || "",
        author: await signer.getAddress(),
        timestamp: Math.floor(Date.now() / 1000),
        tokenId,
        txHash: receipt.hash,
      });
      
      toast.success("Asset Registered!", {
        description: "Your Autho.D.oX Security Badge has been minted",
      });
      
      setTimeout(() => {
        navigate("/gallery");
      }, 1500);
    } catch (error) {
      console.error("Transaction failed:", error);
      
      let errorMessage = "Please try again";
      
      if (error instanceof Error) {
        if (error.message.includes("circuit breaker")) {
          errorMessage = "MetaMask connection issue. Please refresh the page and ensure you're on the correct network.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network connection failed. Please check your wallet is connected to the correct blockchain network.";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was cancelled";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error("Transaction Failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <CyberpunkBackground />
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-6"
            >
              <Shield
                className="h-20 w-20 text-cyan-400 mx-auto"
                style={{
                  filter: "drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))",
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
              style={{
                fontFamily: "'Courier New', monospace",
                textShadow: "0 0 20px rgba(0, 255, 255, 0.8), 4px 4px 0 rgba(255, 0, 128, 0.5)",
                background: "linear-gradient(to right, #00ffff, #ff0080)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              REGISTER YOUR
              <br />
              AI INTERACTION
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-400 font-mono max-w-2xl mx-auto"
            >
              Mint Your 'Autho.D.oX' Security Badge On-Chain.
            </motion.p>
          </div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            <div
              className="border-2 border-cyan-500/50 rounded-lg p-8 bg-black/50 backdrop-blur-sm space-y-6"
              style={{
                boxShadow: "0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.1)",
              }}
            >
              {/* Prompt Input */}
              <div>
                <label
                  htmlFor="promptText"
                  className="block text-sm font-mono text-cyan-400 mb-3 tracking-wide"
                >
                  YOUR PROMPT:
                </label>
                <div className="relative">
                  <Textarea
                    id="promptText"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your prompt text..."
                    className="min-h-[120px] bg-black/70 border-2 border-pink-500/30 focus:border-cyan-400 text-white font-mono text-lg resize-none pr-12"
                    style={{
                      boxShadow: "inset 0 0 20px rgba(255, 0, 128, 0.2)",
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute bottom-2 right-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    onClick={() => promptFileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <input
                    ref={promptFileInputRef}
                    type="file"
                    multiple
                    onChange={handlePromptFileChange}
                    className="hidden"
                  />
                </div>
                {promptFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {promptFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded px-3 py-1 text-sm font-mono text-cyan-400"
                      >
                        <span>{file.name}</span>
                        <button
                          onClick={() => removePromptFile(index)}
                          className="hover:text-pink-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Response Input */}
              <div>
                <label
                  htmlFor="aiResponseText"
                  className="block text-sm font-mono text-cyan-400 mb-3 tracking-wide"
                >
                  AI RESPONSE:
                </label>
                <div className="relative">
                  <Textarea
                    id="aiResponseText"
                    value={aiResponseText}
                    onChange={(e) => setAiResponseText(e.target.value)}
                    placeholder="Enter the AI response text..."
                    className="min-h-[120px] bg-black/70 border-2 border-pink-500/30 focus:border-cyan-400 text-white font-mono text-lg resize-none pr-12"
                    style={{
                      boxShadow: "inset 0 0 20px rgba(255, 0, 128, 0.2)",
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute bottom-2 right-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    onClick={() => aiResponseFileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <input
                    ref={aiResponseFileInputRef}
                    type="file"
                    multiple
                    onChange={handleAiResponseFileChange}
                    className="hidden"
                  />
                </div>
                {aiResponseFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {aiResponseFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded px-3 py-1 text-sm font-mono text-cyan-400"
                      >
                        <span>{file.name}</span>
                        <button
                          onClick={() => removeAiResponseFile(index)}
                          className="hover:text-pink-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Chat Link */}
              <div>
                <label
                  htmlFor="chatLink"
                  className="block text-sm font-mono text-cyan-400 mb-3 tracking-wide"
                >
                  CHAT LINK (OPTIONAL):
                </label>
                <Input
                  id="chatLink"
                  value={chatLink}
                  onChange={(e) => setChatLink(e.target.value)}
                  placeholder="https://chat.example.com/conversation/123"
                  className="bg-black/70 border-2 border-pink-500/30 focus:border-cyan-400 text-white font-mono text-lg"
                  style={{
                    boxShadow: "inset 0 0 20px rgba(255, 0, 128, 0.2)",
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <motion.div
                className="mt-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isConnected}
                  className="w-full h-14 text-lg font-bold font-mono bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black border-2 border-cyan-400 disabled:opacity-50"
                  style={{
                    boxShadow: "0 0 25px rgba(0, 255, 255, 0.6)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      MINT SECURITY BADGE
                    </>
                  )}
                </Button>
              </motion.div>

              {!isConnected && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-pink-400 font-mono text-sm mt-4"
                >
                  ⚠ Connect your wallet to mint security badges
                </motion.p>
              )}
            </div>

            {/* Glitch effect corners */}
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