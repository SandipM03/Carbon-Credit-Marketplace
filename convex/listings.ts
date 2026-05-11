import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

async function ensureAdmin(
  ctx: { db: { get: (id: Id<"users">) => Promise<{ role: string } | null> } },
  adminId: Id<"users">,
) {
  const admin = await ctx.db.get(adminId);
  if (!admin || admin.role !== "admin") {
    throw new Error("Only admin accounts can manage listings.");
  }
}

async function attachLandDetails(
  ctx: {
    db: { get: (id: Id<"lands">) => Promise<Doc<"lands"> | null> };
    storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> };
  },
  listings: Array<{ landId: Id<"lands"> }>,
) {
  return await Promise.all(
    listings.map(async (listing) => {
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
        ...listing,
        land,
        imageUrls,
      };
    }),
  );
}

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .take(50);

    const results = await attachLandDetails(ctx, listings);
    return results.filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
});

export const listAll = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);
    return await ctx.db.query("listings").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      return null;
    }

    const [result] = await attachLandDetails(ctx, [listing]);
    return result ?? null;
  },
});

export const createFromLand = mutation({
  args: {
    adminId: v.id("users"),
    landId: v.id("lands"),
    creditsAvailable: v.number(),
    price: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.landId);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    if (land.status !== "approved" && land.status !== "listed") {
      throw new Error("Only approved lands can be listed.");
    }

    if (args.creditsAvailable <= 0) {
      throw new Error("Credits available must be greater than 0.");
    }
    if (args.price < 0) {
      throw new Error("Price must be 0 or higher.");
    }
    if (args.duration <= 0) {
      throw new Error("Duration must be greater than 0.");
    }

    const listingId = await ctx.db.insert("listings", {
      landId: args.landId,
      creditsAvailable: args.creditsAvailable,
      price: args.price,
      duration: args.duration,
      active: true,
      createdAt: Date.now(),
      createdBy: args.adminId,
    });

    if (land.status !== "listed") {
      await ctx.db.patch(args.landId, { status: "listed" });
    }

    return listingId;
  },
});

export const setActive = mutation({
  args: {
    adminId: v.id("users"),
    listingId: v.id("listings"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found.");
    }

    await ctx.db.patch(args.listingId, { active: args.active });
  },
});
