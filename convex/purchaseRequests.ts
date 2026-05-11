import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

async function ensureRole(
  ctx: { db: { get: (id: Id<"users">) => Promise<{ role: string } | null> } },
  userId: Id<"users">,
  role: "buyer" | "admin",
  message: string,
) {
  const user = await ctx.db.get(userId);
  if (!user || user.role !== role) {
    throw new Error(message);
  }
}

async function attachRequestDetails(
  ctx: {
    db: {
      get: (
        id: Id<"listings"> | Id<"lands">,
      ) => Promise<Doc<"listings"> | Doc<"lands"> | null>;
    };
    storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> };
  },
  requests: Array<{ listingId: Id<"listings"> }>,
) {
  return await Promise.all(
    requests.map(async (request) => {
      const listing = await ctx.db.get(request.listingId);
      if (!listing) {
        return null;
      }

      const land = await ctx.db.get(listing.landId);
      if (!land) {
        return null;
      }

      const imageUrls = land.images?.length
        ? (
            await Promise.all(
              land.images.map((storageId: Id<"_storage">) =>
                ctx.storage.getUrl(storageId),
              ),
            )
          ).filter((url): url is string => Boolean(url))
        : [];

      return {
        ...request,
        listing,
        land,
        imageUrls,
      };
    }),
  );
}

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("purchaseRequests")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .order("desc")
      .take(50);

    const results = await attachRequestDetails(ctx, requests);
    return results.filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
});

export const create = mutation({
  args: {
    buyerId: v.id("users"),
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    await ensureRole(ctx, args.buyerId, "buyer", "Only buyers can request a purchase.");

    const listing = await ctx.db.get(args.listingId);
    if (!listing || !listing.active) {
      throw new Error("Listing is not active.");
    }

    const existing = await ctx.db
      .query("purchaseRequests")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) => q.eq(q.field("listingId"), args.listingId))
      .collect();

    const hasOpenRequest = existing.some((request) =>
      ["submitted", "approved"].includes(request.status),
    );
    if (hasOpenRequest) {
      throw new Error("A purchase request already exists for this listing.");
    }

    return await ctx.db.insert("purchaseRequests", {
      buyerId: args.buyerId,
      listingId: args.listingId,
      status: "submitted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const withdraw = mutation({
  args: {
    buyerId: v.id("users"),
    requestId: v.id("purchaseRequests"),
  },
  handler: async (ctx, args) => {
    await ensureRole(ctx, args.buyerId, "buyer", "Only buyers can withdraw requests.");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.buyerId !== args.buyerId) {
      throw new Error("Purchase request not found.");
    }

    if (request.status !== "submitted") {
      throw new Error("Only submitted requests can be withdrawn.");
    }

    await ctx.db.patch(args.requestId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });
  },
});

export const setStatus = mutation({
  args: {
    adminId: v.id("users"),
    requestId: v.id("purchaseRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await ensureRole(ctx, args.adminId, "admin", "Only admins can update requests.");

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Purchase request not found.");
    }

    if (request.status !== "submitted") {
      throw new Error("Only submitted requests can be updated.");
    }

    await ctx.db.patch(args.requestId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
