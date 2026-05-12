import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

type NotificationCategory = "status" | "purchase" | "recommendation" | "inquiry";

type NotificationInput = {
  userId: Id<"users">;
  title: string;
  message: string;
  category: NotificationCategory;
  link?: string;
};

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 50);
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export async function createNotification(ctx: any, input: NotificationInput) {
  return await ctx.db.insert("notifications", {
    userId: input.userId,
    title: input.title,
    message: input.message,
    category: input.category,
    link: input.link,
    createdAt: Date.now(),
  });
}

export async function notifyAdmins(ctx: any, input: Omit<NotificationInput, "userId">) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_role", (q: any) => q.eq("role", "admin"))
    .collect();

  if (admins.length === 0) {
    return;
  }

  await Promise.all(
    admins.map((admin: any) =>
      createNotification(ctx, {
        ...input,
        userId: admin._id,
      }),
    ),
  );
}
