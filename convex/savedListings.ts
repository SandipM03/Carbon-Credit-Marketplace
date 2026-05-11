import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

async function ensureBuyer(
  ctx: { db: { get: (id: Id<"users">) => Promise<{ role: string } | null> } },
  buyerId: Id<"users">,
) {
  const buyer = await ctx.db.get(buyerId);
  if (!buyer || buyer.role !== "buyer") {
    throw new Error("Only buyers can save listings.");
  }
}

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedListings")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .order("desc")
      .take(100);

    return saved.map((entry) => ({
      _id: entry._id,
      listingId: entry.listingId,
      createdAt: entry.createdAt,
    }));
  },
});

export const toggle = mutation({
  args: {
    buyerId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    await ensureBuyer(ctx, args.buyerId);

    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found.");
    }

    const existing = await ctx.db
      .query("savedListings")
      .withIndex("by_buyer_listing", (q) =>
        q.eq("buyerId", args.buyerId).eq("listingId", args.listingId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }

    await ctx.db.insert("savedListings", {
      buyerId: args.buyerId,
      listingId: args.listingId,
      createdAt: Date.now(),
    });

    return { saved: true };
  },
});
