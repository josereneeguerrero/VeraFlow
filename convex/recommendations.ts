import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getActive = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return recommendations
      .filter((r) => r.status === "new" || r.status === "viewed")
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  },
});

export const get = query({
  args: { id: v.id("recommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(args.id);
  },
});

export const getHistory = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return recommendations
      .filter((r) => r.status === "acted" || r.status === "dismissed")
      .sort((a, b) => (b.actedAt || 0) - (a.actedAt || 0));
  },
});

export const markViewed = mutation({
  args: { id: v.id("recommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rec = await ctx.db.get(args.id);
    if (rec?.status === "new") {
      await ctx.db.patch(args.id, { status: "viewed" });
    }
    return true;
  },
});

export const markActed = mutation({
  args: { id: v.id("recommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "acted",
      actedAt: Date.now(),
    });
    return true;
  },
});

export const dismiss = mutation({
  args: { id: v.id("recommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "dismissed",
      actedAt: Date.now(),
    });
    return true;
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    category: v.string(),
    suggestedAction: v.string(),
    relatedWorkflowId: v.optional(v.id("workflows")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("recommendations", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const generateInitialRecommendations = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const recommendations = [
      {
        type: "compliance",
        title: "Complete HIPAA Training Documentation",
        description: "Ensure all team members have completed required HIPAA training and documentation is up to date.",
        priority: "high" as const,
        category: "Training",
        suggestedAction: "Start HIPAA Training Workflow",
      },
      {
        type: "documentation",
        title: "Review Privacy Policy",
        description: "Your privacy policy should be reviewed quarterly. Last review was over 90 days ago.",
        priority: "medium" as const,
        category: "Documentation",
        suggestedAction: "Schedule Policy Review",
      },
      {
        type: "integration",
        title: "Connect Your EHR System",
        description: "Connecting your EHR system enables automated compliance tracking and reduces manual data entry.",
        priority: "medium" as const,
        category: "Integrations",
        suggestedAction: "Set Up Integration",
      },
      {
        type: "team",
        title: "Invite Team Members",
        description: "Add your team to collaborate on compliance workflows and share responsibilities.",
        priority: "low" as const,
        category: "Team",
        suggestedAction: "Invite Team Members",
      },
    ];

    for (const rec of recommendations) {
      await ctx.db.insert("recommendations", {
        workspaceId: args.workspaceId,
        ...rec,
        status: "new",
        createdAt: Date.now(),
      });
    }

    return true;
  },
});
