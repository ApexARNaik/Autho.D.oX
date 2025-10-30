import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Store proof submissions locally for backup/caching
export const storeProof = internalMutation({
  args: {
    promptCid: v.string(),
    contentCid: v.string(),
    metadataUri: v.string(),
    optionalChatLink: v.string(),
    author: v.string(),
    timestamp: v.number(),
    tokenId: v.number(),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this tokenId already exists
    const existing = await ctx.db
      .query("proofs")
      .withIndex("by_tokenId", (q) => q.eq("tokenId", args.tokenId))
      .first();
    
    if (existing) {
      // Update existing proof
      await ctx.db.patch(existing._id, {
        promptCid: args.promptCid,
        contentCid: args.contentCid,
        metadataUri: args.metadataUri,
        optionalChatLink: args.optionalChatLink,
        author: args.author,
        timestamp: args.timestamp,
        txHash: args.txHash,
      });
    } else {
      // Insert new proof
      await ctx.db.insert("proofs", {
        promptCid: args.promptCid,
        contentCid: args.contentCid,
        metadataUri: args.metadataUri,
        optionalChatLink: args.optionalChatLink,
        author: args.author,
        timestamp: args.timestamp,
        tokenId: args.tokenId,
        txHash: args.txHash,
      });
    }
  },
});

// Public mutation to store proof (called from frontend)
export const cacheProof = mutation({
  args: {
    promptCid: v.string(),
    contentCid: v.string(),
    metadataUri: v.string(),
    optionalChatLink: v.string(),
    author: v.string(),
    timestamp: v.number(),
    tokenId: v.number(),
    txHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("proofs", {
      promptCid: args.promptCid,
      contentCid: args.contentCid,
      metadataUri: args.metadataUri,
      optionalChatLink: args.optionalChatLink,
      author: args.author,
      timestamp: args.timestamp,
      tokenId: args.tokenId,
      txHash: args.txHash,
    });
  },
});

export const getAllProofs = query({
  args: {},
  handler: async (ctx) => {
    const proofs = await ctx.db.query("proofs").order("desc").collect();
    return proofs;
  },
});

export const getProofsByAuthor = query({
  args: { author: v.string() },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_author", (q) => q.eq("author", args.author))
      .order("desc")
      .collect();
    return proofs;
  },
});