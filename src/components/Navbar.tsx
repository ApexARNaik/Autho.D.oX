import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/hooks/use-wallet";
import { formatAddress } from "@/lib/web3";
import { motion } from "framer-motion";
import { Wallet, Zap, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

export function Navbar() {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success("Wallet disconnected");
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-cyan-500/30 bg-black/90 backdrop-blur-md"
      style={{
        boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="h-6 w-6 text-cyan-400 group-hover:text-pink-500 transition-colors" />
              <span
                className="text-xl font-bold tracking-wider cyberpunk-text"
                style={{
                  fontFamily: "'Courier New', monospace",
                  textShadow: "0 0 10px rgba(0, 255, 255, 0.8), 2px 2px 0 rgba(255, 0, 128, 0.5)",
                }}
              >
                AUTHO.D.OX
              </span>
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-10">
            <Link to="/">
              <motion.span
                className={`text-sm font-mono tracking-wide cursor-pointer transition-colors ${
                  location.pathname === "/"
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                whileHover={{ scale: 1.1 }}
                style={{
                  textShadow: location.pathname === "/" ? "0 0 8px rgba(0, 255, 255, 0.8)" : "none",
                }}
              >
                HOME
              </motion.span>
            </Link>
            <Link to="/gallery">
              <motion.span
                className={`text-sm font-mono tracking-wide cursor-pointer transition-colors ${
                  location.pathname === "/gallery"
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                whileHover={{ scale: 1.1 }}
                style={{
                  textShadow: location.pathname === "/gallery" ? "0 0 8px rgba(0, 255, 255, 0.8)" : "none",
                }}
              >
                PROOF GALLERY
              </motion.span>
            </Link>

            {/* Wallet Connection */}
            {!isConnected ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-black font-mono font-bold border-2 border-cyan-400"
                  style={{
                    boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
                  }}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isLoading ? "CONNECTING..." : "CONNECT"}
                </Button>
              </motion.div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 rounded font-mono text-sm text-cyan-400 cursor-pointer"
                    style={{
                      boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
                    }}
                  >
                    {formatAddress(address!)}
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/95 border-cyan-500/50 backdrop-blur-sm"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={handleDisconnect}
                    className="font-mono text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 cursor-pointer focus:bg-pink-500/10 focus:text-pink-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Scan line effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.nav>
  );
}