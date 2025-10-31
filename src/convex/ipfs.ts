//forcing change
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";

// Initialize the Pinata SDK
const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT!,
});

export const uploadToCID = action({
  args: {
    text: v.string(),
    fileData: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Case 1: Only text
      if (args.text && !args.fileData) {
        const textStream = Readable.from(args.text);
        const options = { pinataMetadata: { name: "content.txt" } };
        const upload = await pinata.pinFileToIPFS(textStream, options);
        return upload.IpfsHash;
      }
      
      // Case 2: Only file
      if (!args.text && args.fileData && args.fileName) {
        const buffer = Buffer.from(args.fileData, "base64");
        const fileStream = Readable.from(buffer);
        const options = { pinataMetadata: { name: args.fileName } };
        const upload = await pinata.pinFileToIPFS(fileStream, options);
        return upload.IpfsHash;
      }
      
      // Case 3: Both text and file
      if (args.text && args.fileData && args.fileName) {
        // Upload file first
        const buffer = Buffer.from(args.fileData, "base64");
        const fileStream = Readable.from(buffer);
        const fileOptions = { pinataMetadata: { name: args.fileName } };
        const fileUpload = await pinata.pinFileToIPFS(fileStream, fileOptions);
        
        // Create JSON with text and file CID
        const jsonData = {
          text: args.text,
          fileCID: fileUpload.IpfsHash,
          fileName: args.fileName,
          timestamp: new Date().toISOString(),
        };
        
        const jsonOptions = { pinataMetadata: { name: `${args.fileName}_meta.json` } };
        const jsonUpload = await pinata.pinJSONToIPFS(jsonData, jsonOptions);
        return jsonUpload.IpfsHash;
      }
      
      throw new Error("Invalid input: No text or file data provided.");
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw new Error(`IPFS Upload Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});