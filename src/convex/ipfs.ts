"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
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
        const file = new File([args.text], "content.txt", { type: "text/plain" });
        const upload = await (pinata.upload as any).file(file);
        return upload.IpfsHash;
      }
      
      // Case 2: Only file
      if (!args.text && args.fileData && args.fileName) {
        const buffer = Buffer.from(args.fileData, "base64");
        const file = new File([buffer], args.fileName);
        const upload = await (pinata.upload as any).file(file);
        return upload.IpfsHash;
      }
      
      // Case 3: Both text and file
      if (args.text && args.fileData && args.fileName) {
        // Upload file first
        const buffer = Buffer.from(args.fileData, "base64");
        const file = new File([buffer], args.fileName);
        const fileUpload = await (pinata.upload as any).file(file);
        
        // Create JSON with text and file CID
        const jsonData = {
          text: args.text,
          fileCID: fileUpload.IpfsHash,
          fileName: args.fileName,
          timestamp: new Date().toISOString(),
        };
        
        const jsonUpload = await (pinata.upload as any).json(jsonData);
        return jsonUpload.IpfsHash;
      }
      
      throw new Error("Invalid input");
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw error;
    }
  },
});
