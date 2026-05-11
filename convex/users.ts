import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(20);
    return users.map((user) => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
  },
});

export const register = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("farmer"), v.literal("buyer"), v.literal("admin")),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.trim();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (existingUser) {
      throw new Error("A user with this phone number already exists.");
    }

    const normalizedPassword = args.password.trim();
    if (normalizedPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const passwordHash = await hashPassword(normalizedPassword);
    return await ctx.db.insert("users", {
      name: args.name,
      phone: normalizedPhone,
      email: args.email,
      role: args.role,
      passwordHash,
      createdAt: Date.now(),
    });
  },
});

export const login = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedPhone = args.phone.trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (!user) {
      throw new Error("Invalid phone or password.");
    }

    const incomingHash = await hashPassword(args.password.trim());
    if (incomingHash !== user.passwordHash) {
      throw new Error("Invalid phone or password.");
    }

    return {
      userId: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
  },
});

export const byId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});
