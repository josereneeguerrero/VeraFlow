import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const globalSearch = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { workflows: [], recommendations: [], members: [] };

    const searchQuery = args.query.toLowerCase().trim();
    if (!searchQuery) {
      return { workflows: [], recommendations: [], members: [] };
    }

    const limit = args.limit || 5;

    const [allWorkflows, allRecommendations, allMembers] = await Promise.all([
      ctx.db
        .query("workflows")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
      ctx.db
        .query("recommendations")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
      ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect(),
    ]);

    const workflows = allWorkflows
      .filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery) ||
          w.description.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit)
      .map((w) => ({
        _id: w._id,
        name: w.name,
        description: w.description,
        status: w.status,
        progress: w.progress,
        type: "workflow" as const,
      }));

    const recommendations = allRecommendations
      .filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery) ||
          r.description.toLowerCase().includes(searchQuery) ||
          r.category.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit)
      .map((r) => ({
        _id: r._id,
        title: r.title,
        description: r.description,
        priority: r.priority,
        category: r.category,
        status: r.status,
        type: "recommendation" as const,
      }));

    const memberUserIds = allMembers.map((m) => m.userId);
    const userProfiles = await Promise.all(
      memberUserIds.map((id) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .first()
      )
    );

    const members = userProfiles
      .filter((profile): profile is NonNullable<typeof profile> => profile !== null)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.email.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit)
      .map((p) => ({
        _id: p._id,
        userId: p.userId,
        name: p.name,
        email: p.email,
        role: p.role,
        type: "member" as const,
      }));

    return { workflows, recommendations, members };
  },
});

export const searchWorkflows = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const searchQuery = args.query.toLowerCase().trim();

    let workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (args.status) {
      workflows = workflows.filter((w) => w.status === args.status);
    }

    if (searchQuery) {
      workflows = workflows.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery) ||
          w.description.toLowerCase().includes(searchQuery)
      );
    }

    return workflows;
  },
});

export const searchRecommendations = query({
  args: {
    workspaceId: v.id("workspaces"),
    query: v.string(),
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const searchQuery = args.query.toLowerCase().trim();

    let recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (args.priority) {
      recommendations = recommendations.filter((r) => r.priority === args.priority);
    }

    if (searchQuery) {
      recommendations = recommendations.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery) ||
          r.description.toLowerCase().includes(searchQuery) ||
          r.category.toLowerCase().includes(searchQuery)
      );
    }

    return recommendations
      .filter((r) => r.status === "new" || r.status === "viewed")
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  },
});
