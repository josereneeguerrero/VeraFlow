import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const plans = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "1 workspace",
      "Up to 2 team members",
      "3 active workflows",
      "Basic compliance score",
      "Community support",
    ],
    limits: {
      teamMembers: 2,
      workflows: 3,
      integrations: 1,
    },
    highlight: false,
  },
  starter: {
    name: "Starter",
    price: 49,
    features: [
      "Up to 10 team members",
      "10 active workflows",
      "5 integrations",
      "AI recommendations",
      "Email support",
      "Basic reports",
    ],
    limits: {
      teamMembers: 10,
      workflows: 10,
      integrations: 5,
    },
    highlight: false,
  },
  professional: {
    name: "Professional",
    price: 149,
    features: [
      "Up to 50 team members",
      "Unlimited workflows",
      "All integrations",
      "Advanced AI insights",
      "Priority support",
      "Full reporting suite",
      "Audit readiness tools",
      "Custom workflow templates",
    ],
    limits: {
      teamMembers: 50,
      workflows: -1,
      integrations: -1,
    },
    highlight: true,
  },
  enterprise: {
    name: "Enterprise",
    price: 399,
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
      "BAA included",
    ],
    limits: {
      teamMembers: -1,
      workflows: -1,
      integrations: -1,
    },
    highlight: false,
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
        plan: "free",
        ...plans.free,
        status: "active",
        currentPeriodEnd: null,
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
      v.literal("free"),
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

export const getSubscriptionByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_customerEmail", (q) => q.eq("customerEmail", args.email))
      .first();

    if (!subscription) return null;

    const planDetails = plans[subscription.plan as keyof typeof plans];
    return {
      ...subscription,
      ...planDetails,
    };
  },
});

export const getSubscriptionByPolarId = query({
  args: { polarSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    if (!subscription) return null;

    const planDetails = plans[subscription.plan as keyof typeof plans];
    return {
      ...subscription,
      ...planDetails,
    };
  },
});

export const upsertSubscriptionFromPolar = internalMutation({
  args: {
    polarSubscriptionId: v.string(),
    polarCustomerId: v.string(),
    customerEmail: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        plan: args.plan,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        customerEmail: args.customerEmail,
      });
      return existing._id;
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.customerEmail))
      .first();

    if (!userProfile?.currentWorkspaceId) {
      console.error("No workspace found for user:", args.customerEmail);
      const existingByEmail = await ctx.db
        .query("subscriptions")
        .withIndex("by_customerEmail", (q) => q.eq("customerEmail", args.customerEmail))
        .first();

      if (existingByEmail) {
        await ctx.db.patch(existingByEmail._id, {
          polarSubscriptionId: args.polarSubscriptionId,
          polarCustomerId: args.polarCustomerId,
          status: args.status,
          plan: args.plan,
          currentPeriodStart: args.currentPeriodStart,
          currentPeriodEnd: args.currentPeriodEnd,
          cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        });
        return existingByEmail._id;
      }

      throw new Error("No workspace found for customer email: " + args.customerEmail);
    }

    const existingWorkspaceSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", userProfile.currentWorkspaceId!))
      .first();

    if (existingWorkspaceSub) {
      await ctx.db.patch(existingWorkspaceSub._id, {
        polarSubscriptionId: args.polarSubscriptionId,
        polarCustomerId: args.polarCustomerId,
        status: args.status,
        plan: args.plan,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        customerEmail: args.customerEmail,
      });
      return existingWorkspaceSub._id;
    }

    return await ctx.db.insert("subscriptions", {
      workspaceId: userProfile.currentWorkspaceId,
      polarSubscriptionId: args.polarSubscriptionId,
      polarCustomerId: args.polarCustomerId,
      customerEmail: args.customerEmail,
      status: args.status,
      plan: args.plan,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    });
  },
});

export const checkPlanLimits = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const planKey = subscription?.plan || "free";
    const planDetails = plans[planKey as keyof typeof plans];

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

    const limits = planDetails.limits;

    return {
      plan: planKey,
      planName: planDetails.name,
      teamMembers: {
        current: members.length,
        limit: limits.teamMembers,
        canAdd: limits.teamMembers === -1 || members.length < limits.teamMembers,
      },
      workflows: {
        current: workflows.length,
        limit: limits.workflows,
        canAdd: limits.workflows === -1 || workflows.length < limits.workflows,
      },
      integrations: {
        current: integrations.length,
        limit: limits.integrations,
        canAdd: limits.integrations === -1 || integrations.length < limits.integrations,
      },
    };
  },
});

export const updateSubscriptionStatus = internalMutation({
  args: {
    polarSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_polarSubscriptionId", (q) =>
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
  },
});
