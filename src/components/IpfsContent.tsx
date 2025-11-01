import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Use the same Pinata gateway as your gallery
const IPFS_GATEWAY = "https://dweb.link/ipfs/";

export function IpfsContent({ cid }: { cid: string }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJson, setIsJson] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!cid) {
      setIsLoading(false);
      setContent("No CID provided.");
      return;
    }

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${IPFS_GATEWAY}${cid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch from IPFS");
        }
        
        // Try to parse as JSON first
        const textData = await response.text();
        try {
          const jsonData = JSON.parse(textData);
          // If it's JSON, it's from a mixed text/file upload
          if (jsonData.text) {
            setContent(jsonData.text);
          }
          if (jsonData.fileCID) {
            setIsJson(true);
            setFileUrl(`${IPFS_GATEWAY}${jsonData.fileCID}`);
          }
        } catch (e) {
          // It's not JSON, so it must be plain text
          setContent(textData);
          setIsJson(false);
        }

      } catch (error) {
        console.error("Failed to fetch IPFS content:", error);
        setContent("Error loading content.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [cid]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-white font-mono text-sm leading-relaxed"
      style={{ textShadow: "0 0 5px rgba(0, 255, 255, 0.3)" }}
    >
      {/* Display the text */}
      <p className="line-clamp-3">"{content}"</p>
      
      {/* If it was a JSON file, also link to the associated file */}
      {isJson && fileUrl && (
         <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 text-xs hover:underline"
        >
          View Associated File
        </a>
      )}
    </motion.div>
  );
}