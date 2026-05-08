import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    industry: v.string(),
    teamSize: v.string(),
    teamType: v.string(),
    goals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      industry: args.industry,
      teamSize: args.teamSize,
      teamType: args.teamType,
      goals: args.goals,
      ownerId: userId,
      readinessScore: 0,
      createdAt: Date.now(),
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      invitedAt: Date.now(),
      joinedAt: Date.now(),
      status: "active",
    });

    await ctx.db.insert("subscriptions", {
      workspaceId,
      plan: "starter",
      status: "trialing",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 14 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
    });

    return workspaceId;
  },
});

export const get = query({
  args: { id: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workspace = await ctx.db.get(args.id);
    if (!workspace) return null;

    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (!membership) return null;

    return workspace;
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.currentWorkspaceId) return null;

    return await ctx.db.get(profile.currentWorkspaceId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const workspaces = await Promise.all(
      memberships.map((m) => ctx.db.get(m.workspaceId))
    );

    return workspaces.filter(Boolean);
  },
});

export const updateReadinessScore = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.workspaceId, {
      readinessScore: args.score,
    });

    return true;
  },
});

export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const membersWithProfiles = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();
        return {
          ...member,
          profile,
        };
      })
    );

    return membersWithProfiles;
  },
});

export const inviteMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inviteId = await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: userId,
      role: args.role,
      email: args.email,
      invitedAt: Date.now(),
      status: "pending",
    });

    return inviteId;
  },
});
