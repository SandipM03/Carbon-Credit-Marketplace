import { mutation, query } from "./_generated/server";

export type TreeRecord = {
  name: string;
  suitableSoils: string[];
  waterRequirement: string;
  growthRate: number;
  carbonFactor: number;
  maintenanceLevel: number;
  suitableLandTypes: string[];
  incomePotential: number;
};

const BASE_TREES: TreeRecord[] = [
  {
    name: "Neem",
    suitableSoils: ["Sandy", "Loamy", "Red Soil"],
    waterRequirement: "Low",
    growthRate: 2,
    carbonFactor: 2,
    maintenanceLevel: 1,
    suitableLandTypes: ["Agricultural", "Dry Land", "Barren"],
    incomePotential: 2,
  },
  {
    name: "Bamboo",
    suitableSoils: ["Loamy", "Clay", "Red Soil"],
    waterRequirement: "High",
    growthRate: 3,
    carbonFactor: 3,
    maintenanceLevel: 2,
    suitableLandTypes: ["Wet Land", "Mixed", "Agricultural"],
    incomePotential: 3,
  },
  {
    name: "Mango",
    suitableSoils: ["Loamy", "Black Soil"],
    waterRequirement: "Medium",
    growthRate: 2,
    carbonFactor: 2,
    maintenanceLevel: 2,
    suitableLandTypes: ["Agricultural", "Mixed"],
    incomePotential: 3,
  },
  {
    name: "Teak",
    suitableSoils: ["Loamy", "Red Soil"],
    waterRequirement: "Medium",
    growthRate: 2,
    carbonFactor: 3,
    maintenanceLevel: 2,
    suitableLandTypes: ["Dry Land", "Mixed", "Agricultural"],
    incomePotential: 3,
  },
  {
    name: "Eucalyptus",
    suitableSoils: ["Sandy", "Red Soil"],
    waterRequirement: "Low",
    growthRate: 3,
    carbonFactor: 2,
    maintenanceLevel: 1,
    suitableLandTypes: ["Barren", "Dry Land"],
    incomePotential: 2,
  },
  {
    name: "Acacia",
    suitableSoils: ["Sandy", "Clay"],
    waterRequirement: "Low",
    growthRate: 2,
    carbonFactor: 2,
    maintenanceLevel: 1,
    suitableLandTypes: ["Barren", "Dry Land", "Mixed"],
    incomePotential: 1,
  },
  {
    name: "Pongamia",
    suitableSoils: ["Loamy", "Black Soil", "Clay"],
    waterRequirement: "Medium",
    growthRate: 2,
    carbonFactor: 2,
    maintenanceLevel: 1,
    suitableLandTypes: ["Agricultural", "Mixed"],
    incomePotential: 2,
  },
  {
    name: "Casuarina",
    suitableSoils: ["Sandy", "Red Soil"],
    waterRequirement: "Medium",
    growthRate: 3,
    carbonFactor: 2,
    maintenanceLevel: 2,
    suitableLandTypes: ["Dry Land", "Agricultural"],
    incomePotential: 2,
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trees").collect();
  },
});

export const seedBaseTrees = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("trees").take(1);
    if (existing.length > 0) {
      return { seeded: false };
    }

    for (const tree of BASE_TREES) {
      await ctx.db.insert("trees", tree);
    }

    return { seeded: true };
  },
});
