import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("farmer"), v.literal("buyer"), v.literal("admin")),
    passwordHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),
  lands: defineTable({
    farmerId: v.id("users"),
    farmerName: v.string(),
    farmerPhone: v.string(),
    landName: v.string(),
    totalArea: v.number(),
    areaUnit: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    polygonCoordinates: v.optional(v.array(v.array(v.number()))),
    landType: v.string(),
    soilType: v.string(),
    waterAvailability: v.string(),
    vegetation: v.string(),
    plantationGoal: v.string(),
    tenure: v.number(),
    images: v.optional(v.array(v.id("_storage"))),
    notes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    carbonEstimate: v.optional(
      v.object({
        carbonFactor: v.number(),
        timeYears: v.number(),
        estimatedScore: v.number(),
        estimatedCredits: v.number(),
        listingPrice: v.number(),
        recommendedActions: v.array(v.string()),
        updatedAt: v.number(),
        updatedBy: v.id("users"),
      }),
    ),
    recommendation: v.optional(
      v.object({
        trees: v.array(
          v.object({
            name: v.string(),
            benefits: v.array(v.string()),
            maintenance: v.string(),
            carbonPotential: v.string(),
          }),
        ),
        summaryBenefits: v.array(v.string()),
        summaryMaintenance: v.string(),
        summaryCarbonPotential: v.string(),
        explanation: v.string(),
        source: v.union(v.literal("rule"), v.literal("ai"), v.literal("admin")),
        note: v.optional(v.string()),
        generatedAt: v.number(),
      }),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("request_info"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("listed"),
    ),
    createdAt: v.number(),
  }).index("by_farmerId", ["farmerId"]),
  trees: defineTable({
    name: v.string(),
    suitableSoils: v.array(v.string()),
    waterRequirement: v.string(),
    growthRate: v.number(),
    carbonFactor: v.number(),
    maintenanceLevel: v.number(),
    suitableLandTypes: v.array(v.string()),
    incomePotential: v.number(),
  }),
  listings: defineTable({
    landId: v.id("lands"),
    creditsAvailable: v.number(),
    price: v.number(),
    duration: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_landId", ["landId"])
    .index("by_active", ["active"]),
  purchaseRequests: defineTable({
    buyerId: v.id("users"),
    listingId: v.id("listings"),
    status: v.union(
      v.literal("submitted"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("withdrawn"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_listingId", ["listingId"])
    .index("by_status", ["status"]),
  savedListings: defineTable({
    buyerId: v.id("users"),
    listingId: v.id("listings"),
    createdAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_listingId", ["listingId"])
    .index("by_buyer_listing", ["buyerId", "listingId"]),
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    category: v.union(
      v.literal("status"),
      v.literal("purchase"),
      v.literal("recommendation"),
      v.literal("inquiry"),
    ),
    link: v.optional(v.string()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
  inquiries: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("farmer"), v.literal("buyer")),
    subject: v.string(),
    message: v.string(),
    listingId: v.optional(v.id("listings")),
    landId: v.optional(v.id("lands")),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
