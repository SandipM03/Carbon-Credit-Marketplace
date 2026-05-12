import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { createNotification } from "./notifications";

const LAND_STATUS = v.union(
  v.literal("pending"),
  v.literal("under_review"),
  v.literal("request_info"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("listed"),
);

type LandStatus =
  | "pending"
  | "under_review"
  | "request_info"
  | "approved"
  | "rejected"
  | "listed";

type TreeDatasetItem = {
  name: string;
  suitableSoils: string[];
  waterRequirement: string;
  growthRate: number;
  carbonFactor: number;
  maintenanceLevel: number;
  suitableLandTypes: string[];
  incomePotential: number;
};

type TreeRecommendation = {
  trees: {
    name: string;
    benefits: string[];
    maintenance: string;
    carbonPotential: string;
  }[];
  summaryBenefits: string[];
  summaryMaintenance: string;
  summaryCarbonPotential: string;
  explanation: string;
  source: "rule" | "ai" | "admin";
  note?: string;
  generatedAt: number;
};

async function notifyLandStatus(
  ctx: { db: { get: (id: Id<"lands">) => Promise<{ farmerId: Id<"users">; landName: string } | null> } },
  landId: Id<"lands">,
  status: LandStatus,
) {
  if (status !== "approved" && status !== "rejected") {
    return;
  }

  const land = await ctx.db.get(landId);
  if (!land) {
    return;
  }

  const statusLabel = status === "approved" ? "approved" : "rejected";
  await createNotification(ctx, {
    userId: land.farmerId,
    title: `Land ${statusLabel}`,
    message: `${land.landName} was ${statusLabel} by the admin team.`,
    category: "status",
    link: "/farmer",
  });
}

const VALID_STATUS_TRANSITIONS: Record<LandStatus, readonly LandStatus[]> = {
  pending: ["under_review", "request_info", "approved", "rejected"],
  under_review: ["request_info", "approved", "rejected"],
  request_info: ["under_review", "approved", "rejected"],
  approved: ["listed", "under_review", "rejected"],
  rejected: ["under_review"],
  listed: [],
};

function assertValidStatusTransition(currentStatus: LandStatus, nextStatus: LandStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!VALID_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}.`);
  }
}

const WATER_LEVEL_ORDER: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

function levelLabel(level: number) {
  if (level <= 1) {
    return "Low";
  }
  if (level === 2) {
    return "Medium";
  }
  return "High";
}

function calculateTreeScore(land: {
  soilType: string;
  waterAvailability: string;
  landType: string;
  plantationGoal: string;
  tenure: number;
}, tree: TreeDatasetItem) {
  let score = 0;
  if (tree.suitableSoils.includes(land.soilType)) {
    score += 2;
  }
  if (tree.suitableLandTypes.includes(land.landType)) {
    score += 2;
  }

  const waterDiff = Math.abs(
    (WATER_LEVEL_ORDER[tree.waterRequirement] ?? 2) -
      (WATER_LEVEL_ORDER[land.waterAvailability] ?? 2),
  );
  if (waterDiff === 0) {
    score += 2;
  } else if (waterDiff === 1) {
    score += 1;
  } else {
    score -= 1;
  }

  switch (land.plantationGoal) {
    case "Maximum Carbon Credits":
      score += tree.carbonFactor * 2 + tree.growthRate;
      break;
    case "Fruit Income":
      score += tree.incomePotential * 2;
      break;
    case "Timber Value":
      score += tree.incomePotential + tree.growthRate;
      break;
    case "Fast Growth":
      score += tree.growthRate * 2;
      break;
    case "Low Maintenance":
      score += (4 - tree.maintenanceLevel) * 2;
      break;
    default:
      break;
  }

  if (land.tenure <= 5) {
    score += tree.growthRate;
  }
  if (land.tenure >= 15) {
    score += tree.carbonFactor;
  }

  return score;
}

function buildTreeBenefits(tree: TreeDatasetItem) {
  const benefits: string[] = [];
  if (tree.carbonFactor >= 2) {
    benefits.push("Strong carbon capture");
  }
  if (tree.growthRate >= 2) {
    benefits.push("Fast growth");
  }
  if (tree.incomePotential >= 2) {
    benefits.push("Income potential");
  }
  if (tree.maintenanceLevel <= 1) {
    benefits.push("Low maintenance");
  }
  if (tree.waterRequirement === "Low") {
    benefits.push("Drought tolerant");
  }
  return benefits.slice(0, 4);
}

function summarizeRecommendation(trees: TreeDatasetItem[]) {
  const averageMaintenance =
    trees.reduce((sum, tree) => sum + tree.maintenanceLevel, 0) / trees.length;
  const averageCarbon =
    trees.reduce((sum, tree) => sum + tree.carbonFactor, 0) / trees.length;
  const benefitSet = new Set<string>();
  for (const tree of trees) {
    for (const benefit of buildTreeBenefits(tree)) {
      benefitSet.add(benefit);
    }
  }

  return {
    summaryBenefits: Array.from(benefitSet).slice(0, 4),
    summaryMaintenance: levelLabel(Math.round(averageMaintenance)),
    summaryCarbonPotential: levelLabel(Math.round(averageCarbon)),
  };
}

function buildRecommendationPayload(options: {
  trees: TreeDatasetItem[];
  explanation: string;
  source: "rule" | "ai" | "admin";
  note?: string;
}) {
  const summary = summarizeRecommendation(options.trees);
  return {
    trees: options.trees.map((tree) => ({
      name: tree.name,
      benefits: buildTreeBenefits(tree),
      maintenance: levelLabel(tree.maintenanceLevel),
      carbonPotential: levelLabel(tree.carbonFactor),
    })),
    summaryBenefits: summary.summaryBenefits,
    summaryMaintenance: summary.summaryMaintenance,
    summaryCarbonPotential: summary.summaryCarbonPotential,
    explanation: options.explanation,
    source: options.source,
    note: options.note,
    generatedAt: Date.now(),
  } satisfies TreeRecommendation;
}

function fallbackExplanation(land: {
  soilType: string;
  waterAvailability: string;
  landType: string;
  plantationGoal: string;
}, trees: TreeDatasetItem[]) {
  const names = trees.map((tree) => tree.name).join(", ");
  return `Selected ${names} based on ${land.soilType} soil, ${land.waterAvailability} water, and ${land.landType} land type to match the goal of ${land.plantationGoal}.`;
}

async function fetchGeminiExplanation(options: {
  land: {
    soilType: string;
    waterAvailability: string;
    landType: string;
    plantationGoal: string;
    totalArea: number;
    areaUnit: string;
    tenure: number;
    vegetation: string;
    latitude: number;
    longitude: number;
  };
  trees: TreeDatasetItem[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt = [
    "You are an agronomy assistant.",
    "Explain why the suggested trees fit the land. Keep it concise (3-5 bullet points).",
    `Land: ${options.land.landType}, ${options.land.soilType} soil, ${options.land.waterAvailability} water, ${options.land.vegetation} vegetation.`,
    `Area: ${options.land.totalArea} ${options.land.areaUnit}, tenure ${options.land.tenure} years.`,
    `Location: ${options.land.latitude}, ${options.land.longitude}.`,
    `Goal: ${options.land.plantationGoal}.`,
    `Suggested trees: ${options.trees.map((tree) => tree.name).join(", ")}.`,
    "Include maintenance and carbon potential in your explanation.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function ensureAdmin(
  ctx: {
    db: {
      get: (id: Id<"users">) => Promise<{ role: string } | null>;
    };
  },
  adminId: Id<"users">,
) {
  const admin = await ctx.db.get(adminId);
  if (!admin || admin.role !== "admin") {
    throw new Error("Only admin accounts can update land status.");
  }
}

async function attachImageUrls<T extends { images?: Id<"_storage">[] }>(
  ctx: {
    storage: {
      getUrl: (storageId: Id<"_storage">) => Promise<string | null>;
    };
  },
  lands: T[],
) {
  return await Promise.all(
    lands.map(async (land) => {
      const imageUrls = land.images?.length
        ? (
            await Promise.all(
              land.images.map((storageId) => ctx.storage.getUrl(storageId)),
            )
          ).filter((url): url is string => Boolean(url))
        : [];

      return {
        ...land,
        imageUrls,
      };
    }),
  );
}

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const lands = await ctx.db.query("lands").order("desc").take(20);
    return await attachImageUrls(ctx, lands);
  },
});

export const listByFarmer = query({
  args: {
    farmerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lands = await ctx.db
      .query("lands")
      .withIndex("by_farmerId", (q) => q.eq("farmerId", args.farmerId))
      .order("desc")
      .take(20);
    return await attachImageUrls(ctx, lands);
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const lands = await ctx.db
      .query("lands")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(20);
    return await attachImageUrls(ctx, lands);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    farmerId: v.id("users"),
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
  },
  handler: async (ctx, args) => {
    const farmer = await ctx.db.get(args.farmerId);
    if (!farmer || farmer.role !== "farmer") {
      throw new Error("Only farmer accounts can register land.");
    }

    if (args.images && args.images.length > 5) {
      throw new Error("You can upload up to 5 images per land submission.");
    }

    return await ctx.db.insert("lands", {
      farmerId: args.farmerId,
      farmerName: farmer.name,
      farmerPhone: farmer.phone,
      landName: args.landName,
      totalArea: args.totalArea,
      areaUnit: args.areaUnit,
      latitude: args.latitude,
      longitude: args.longitude,
      polygonCoordinates: args.polygonCoordinates,
      landType: args.landType,
      soilType: args.soilType,
      waterAvailability: args.waterAvailability,
      vegetation: args.vegetation,
      plantationGoal: args.plantationGoal,
      tenure: args.tenure,
      images: args.images,
      notes: args.notes,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("lands") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const setRecommendation = mutation({
  args: {
    id: v.id("lands"),
    recommendation: v.object({
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
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { recommendation: args.recommendation });
    const land = await ctx.db.get(args.id);
    if (land) {
      await createNotification(ctx, {
        userId: land.farmerId,
        title: "Recommendation updated",
        message: `New tree recommendations are ready for ${land.landName}.`,
        category: "recommendation",
        link: "/farmer",
      });
    }
  },
});

export const setRecommendationOverride = mutation({
  args: {
    adminId: v.id("users"),
    id: v.id("lands"),
    trees: v.array(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);
    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    if (args.trees.length === 0) {
      throw new Error("Provide at least one tree name for override.");
    }

    const treeRecords = await ctx.db.query("trees").collect();
    const resolvedTrees = args.trees.map((name) => {
      const match = treeRecords.find(
        (tree) => tree.name.toLowerCase() === name.trim().toLowerCase(),
      );
      if (match) {
        return match;
      }

      return {
        name: name.trim(),
        suitableSoils: [land.soilType],
        waterRequirement: land.waterAvailability,
        growthRate: 2,
        carbonFactor: 2,
        maintenanceLevel: 2,
        suitableLandTypes: [land.landType],
        incomePotential: 2,
      } satisfies TreeDatasetItem;
    });

    const explanation = args.note?.trim()
      ? args.note.trim()
      : fallbackExplanation(land, resolvedTrees);
    const recommendation = buildRecommendationPayload({
      trees: resolvedTrees,
      explanation,
      source: "admin",
      note: args.note?.trim() || undefined,
    });

    await ctx.db.patch(args.id, { recommendation });
    await createNotification(ctx, {
      userId: land.farmerId,
      title: "Recommendation updated",
      message: `Admin updated recommendations for ${land.landName}.`,
      category: "recommendation",
      link: "/farmer",
    });
  },
});

export const setStatus = mutation({
  args: {
    adminId: v.id("users"),
    id: v.id("lands"),
    status: LAND_STATUS,
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    assertValidStatusTransition(land.status, args.status);
    await ctx.db.patch(args.id, { status: args.status });
    await notifyLandStatus(ctx, args.id, args.status);
  },
});

export const approve = mutation({
  args: { adminId: v.id("users"), id: v.id("lands") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    assertValidStatusTransition(land.status, "approved");
    await ctx.db.patch(args.id, { status: "approved" });
    await notifyLandStatus(ctx, args.id, "approved");
  },
});

export const reject = mutation({
  args: { adminId: v.id("users"), id: v.id("lands") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    assertValidStatusTransition(land.status, "rejected");
    await ctx.db.patch(args.id, { status: "rejected" });
    await notifyLandStatus(ctx, args.id, "rejected");
  },
});

export const requestInfo = mutation({
  args: { adminId: v.id("users"), id: v.id("lands") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    assertValidStatusTransition(land.status, "request_info");
    await ctx.db.patch(args.id, { status: "request_info" });
  },
});

export const setAdminNotes = mutation({
  args: {
    adminId: v.id("users"),
    id: v.id("lands"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);
    await ctx.db.patch(args.id, { adminNotes: args.adminNotes });
  },
});

export const setCarbonEstimate = mutation({
  args: {
    adminId: v.id("users"),
    id: v.id("lands"),
    carbonFactor: v.number(),
    timeYears: v.number(),
    estimatedCredits: v.number(),
    listingPrice: v.number(),
    recommendedActions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx, args.adminId);

    const land = await ctx.db.get(args.id);
    if (!land) {
      throw new Error("Land submission not found.");
    }

    if (args.carbonFactor <= 0) {
      throw new Error("Carbon factor must be greater than 0.");
    }
    if (args.timeYears <= 0) {
      throw new Error("Time horizon must be greater than 0.");
    }
    if (args.estimatedCredits < 0) {
      throw new Error("Estimated credits must be 0 or higher.");
    }
    if (args.listingPrice < 0) {
      throw new Error("Listing price must be 0 or higher.");
    }

    const estimatedScore =
      Math.round(land.totalArea * args.carbonFactor * args.timeYears * 100) / 100;

    await ctx.db.patch(args.id, {
      carbonEstimate: {
        carbonFactor: args.carbonFactor,
        timeYears: args.timeYears,
        estimatedScore,
        estimatedCredits: args.estimatedCredits,
        listingPrice: args.listingPrice,
        recommendedActions: args.recommendedActions,
        updatedAt: Date.now(),
        updatedBy: args.adminId,
      },
    });
  },
});

export const generateRecommendation = action({
  args: { id: v.id("lands") },
  handler: async (ctx, args) => {
    const land = await ctx.runQuery(api.lands.getById, { id: args.id });
    if (!land) {
      throw new Error("Land submission not found.");
    }

    let trees = await ctx.runQuery(api.trees.list, {});
    if (trees.length === 0) {
      await ctx.runMutation(api.trees.seedBaseTrees, {});
      trees = await ctx.runQuery(api.trees.list, {});
    }

    const scored = trees
      .map((tree) => ({
        tree,
        score: calculateTreeScore(land, tree),
      }))
      .sort((a, b) => b.score - a.score);
    const shortlisted = scored.slice(0, 3).map((item) => item.tree);

    if (shortlisted.length === 0) {
      throw new Error("No trees available for recommendations.");
    }

    const aiExplanation = await fetchGeminiExplanation({
      land,
      trees: shortlisted,
    });
    const explanation =
      aiExplanation ?? fallbackExplanation(land, shortlisted);
    const recommendation = buildRecommendationPayload({
      trees: shortlisted,
      explanation,
      source: aiExplanation ? "ai" : "rule",
    });

    await ctx.runMutation(api.lands.setRecommendation, {
      id: land._id,
      recommendation,
    });

    return recommendation;
  },
});
