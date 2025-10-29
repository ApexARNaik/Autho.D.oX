"use node";

import { PinataSDK } from "pinata";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

/**
 * Upload text content to IPFS and return CID
 */
export async function uploadTextToIPFS(text: string, filename: string = "content.txt"): Promise<string> {
  const file = new File([text], filename, { type: "text/plain" });
  const upload = await (pinata.upload as any).file(file);
  return upload.IpfsHash;
}

/**
 * Upload file to IPFS and return CID
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const upload = await (pinata.upload as any).file(file);
  return upload.IpfsHash;
}

/**
 * Upload JSON data to IPFS and return CID
 */
export async function uploadJSONToIPFS(data: any): Promise<string> {
  const upload = await (pinata.upload as any).json(data);
  return upload.IpfsHash;
}

/**
 * Process user input (text and/or files) and return a single CID
 * - If only text: upload text as .txt file
 * - If only file: upload file directly
 * - If both: upload file first, then create JSON with text and file CID
 */
export async function processInputToCID(text: string, files: File[]): Promise<string> {
  // Case 1: Only text provided
  if (text.trim() && files.length === 0) {
    return await uploadTextToIPFS(text);
  }
  
  // Case 2: Only file(s) provided
  if (!text.trim() && files.length === 1) {
    return await uploadFileToIPFS(files[0]);
  }
  
  // Case 3: Both text and file(s) provided
  if (text.trim() && files.length > 0) {
    // Upload file first to get its CID
    const fileCID = await uploadFileToIPFS(files[0]);
    
    // Create JSON with text and file CID
    const jsonData = {
      text: text,
      fileCID: fileCID,
      fileName: files[0].name,
      timestamp: new Date().toISOString(),
    };
    
    return await uploadJSONToIPFS(jsonData);
  }
  
  // Case 4: Multiple files
  if (files.length > 1) {
    const fileCIDs = await Promise.all(files.map(f => uploadFileToIPFS(f)));
    const jsonData = {
      text: text || "",
      fileCIDs: fileCIDs,
      fileNames: files.map(f => f.name),
      timestamp: new Date().toISOString(),
    };
    
    return await uploadJSONToIPFS(jsonData);
  }
  
  throw new Error("No content provided");
}
