import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || 20;

    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_recent", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit);

    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", activity.userId))
          .first();
        return {
          ...activity,
          userName: profile?.name || "Unknown",
        };
      })
    );

    return activitiesWithUsers;
  },
});

export const log = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("activityLog", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    workflow_created: "created a workflow",
    workflow_completed: "completed a workflow",
    step_completed: "completed a step",
    step_approved: "approved a step",
    document_uploaded: "uploaded a document",
    member_invited: "invited a team member",
    member_joined: "joined the workspace",
    integration_connected: "connected an integration",
    assessment_completed: "completed an assessment",
    recommendation_acted: "acted on a recommendation",
  };
  return labels[action] || action;
};
