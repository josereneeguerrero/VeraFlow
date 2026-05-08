import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const plans = {
  starter: {
    name: "Starter",
    price: 29,
    features: [
      "Up to 5 team members",
      "3 active workflows",
      "Basic integrations",
      "Email support",
      "Basic reports",
    ],
    limits: {
      teamMembers: 5,
      workflows: 3,
      integrations: 2,
    },
  },
  professional: {
    name: "Professional",
    price: 149,
    features: [
      "Up to 25 team members",
      "Unlimited workflows",
      "All integrations",
      "Priority support",
      "Advanced reports",
      "Custom workflows",
      "Approval chains",
    ],
    limits: {
      teamMembers: 25,
      workflows: -1,
      integrations: -1,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    features: [
      "Unlimited team members",
      "Unlimited workflows",
      "All integrations",
      "Dedicated support",
      "Custom reports",
      "Multi-workspace",
      "SSO & SAML",
      "Audit logs",
      "API access",
    ],
    limits: {
      teamMembers: -1,
      workflows: -1,
      integrations: -1,
    },
  },
};

export const getPlans = query({
  args: {},
  handler: async () => {
    return Object.entries(plans).map(([id, plan]) => ({
      id,
      ...plan,
    }));
  },
});

export const getCurrentPlan = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (!subscription) {
      return {
        plan: "starter",
        ...plans.starter,
        status: "trialing",
        currentPeriodEnd: Date.now() + 14 * 24 * 60 * 60 * 1000,
      };
    }

    const planDetails = plans[subscription.plan as keyof typeof plans];

    return {
      ...subscription,
      ...planDetails,
    };
  },
});

export const getUsage = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "connected"))
      .collect();

    return {
      teamMembers: members.length,
      activeWorkflows: workflows.length,
      connectedIntegrations: integrations.length,
    };
  },
});

export const upgrade = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000;

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        plan: args.plan,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
      return subscription._id;
    }

    return await ctx.db.insert("subscriptions", {
      workspaceId: args.workspaceId,
      plan: args.plan,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });
  },
});

export const cancel = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, { cancelAtPeriodEnd: true });
    }

    return true;
  },
});
