import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { createNotification, notifyAdmins } from "./notifications";

type UserSummary = {
  _id: Id<"users">;
  name: string;
  phone: string;
  email?: string;
  role: "farmer" | "buyer" | "admin";
};

async function ensureContactUser(
  ctx: { db: { get: (id: Id<"users">) => Promise<UserSummary | null> } },
  userId: Id<"users">,
) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found.");
  }
  if (user.role === "admin") {
    throw new Error("Admin accounts should use the admin dashboard.");
  }
  return user;
}

async function attachInquiryDetails(
  ctx: {
    db: {
      get: (
        id: Id<"users"> | Id<"listings"> | Id<"lands">,
      ) => Promise<Doc<"users"> | Doc<"listings"> | Doc<"lands"> | null>;
    };
  },
  inquiries: Array<Doc<"inquiries">>,
) {
  return await Promise.all(
    inquiries.map(async (inquiry) => {
      const user = (await ctx.db.get(inquiry.userId)) as Doc<"users"> | null;
      if (!user) {
        return null;
      }

      const listing = inquiry.listingId
        ? ((await ctx.db.get(inquiry.listingId)) as Doc<"listings"> | null)
        : null;
      const land = inquiry.landId
        ? ((await ctx.db.get(inquiry.landId)) as Doc<"lands"> | null)
        : listing
          ? ((await ctx.db.get(listing.landId)) as Doc<"lands"> | null)
          : null;

      return {
        ...inquiry,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
        listing,
        land,
      };
    }),
  );
}

export const create = mutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    listingId: v.optional(v.id("listings")),
    landId: v.optional(v.id("lands")),
  },
  handler: async (ctx, args) => {
    const user = await ensureContactUser(ctx, args.userId);

    const subject = args.subject.trim();
    const message = args.message.trim();
    if (!subject) {
      throw new Error("Subject is required.");
    }
    if (!message) {
      throw new Error("Message is required.");
    }

    if (args.listingId) {
      const listing = await ctx.db.get(args.listingId);
      if (!listing) {
        throw new Error("Listing not found.");
      }
    }
    if (args.landId) {
      const land = await ctx.db.get(args.landId);
      if (!land) {
        throw new Error("Land not found.");
      }
    }

    const inquiryId = await ctx.db.insert("inquiries", {
      userId: args.userId,
      role: user.role as "farmer" | "buyer",
      subject,
      message,
      listingId: args.listingId,
      landId: args.landId,
      status: "open",
      createdAt: Date.now(),
    });

    await notifyAdmins(ctx, {
      title: "New inquiry",
      message: `${user.name} sent: ${subject}`,
      category: "inquiry",
      link: "/admin",
    });

    await createNotification(ctx, {
      userId: args.userId,
      title: "Inquiry sent",
      message: "Your message has been sent to the admin team.",
      category: "inquiry",
    });

    return inquiryId;
  },
});

export const listForAdmin = query({
  args: {
    adminId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admin accounts can view inquiries.");
    }

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    const inquiries = await ctx.db
      .query("inquiries")
      .order("desc")
      .take(limit);

    const results = await attachInquiryDetails(ctx, inquiries);
    return results.filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
});
