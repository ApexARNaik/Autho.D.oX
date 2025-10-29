import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Store proof submissions locally for backup/caching
export const storeProof = internalMutation({
  args: {
    prompt: v.string(),
    submitter: v.string(),
    txHash: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("proofs", {
      prompt: args.prompt,
      submitter: args.submitter,
      txHash: args.txHash,
      timestamp: args.timestamp,
    });
  },
});

export const getLocalProofs = query({
  args: {},
  handler: async (ctx) => {
    const proofs = await ctx.db.query("proofs").order("desc").collect();
    return proofs;
  },
});
