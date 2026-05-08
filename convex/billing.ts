import { v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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

export const assertCheckoutAllowed = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!profile) return false;

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("workspaceId"), args.workspaceId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    return member !== null;
  },
});

export const createPaddleCheckout = action({
  args: {
    workspaceId: v.id("workspaces"),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    { success: true; checkoutUrl: string } | { success: false; error: string }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;
    if (!email) {
      return { success: false, error: "Not authenticated" };
    }

    const allowed = await ctx.runQuery(internal.billing.assertCheckoutAllowed, {
      workspaceId: args.workspaceId,
      email,
    });
    if (!allowed) {
      return { success: false, error: "No access to this workspace" };
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Billing not configured" };
    }

    let priceId: string | undefined;
    switch (args.plan) {
      case "starter":
        priceId = process.env.PADDLE_PRICE_STARTER;
        break;
      case "professional":
        priceId = process.env.PADDLE_PRICE_PROFESSIONAL;
        break;
      case "enterprise":
        priceId = process.env.PADDLE_PRICE_ENTERPRISE;
        break;
    }
    if (!priceId?.trim()) {
      return { success: false, error: "Price ID not configured for this plan" };
    }

    const country =
      process.env.PADDLE_CHECKOUT_DEFAULT_COUNTRY_CODE?.trim() || "HN";

    const listRes = await fetch(
      `https://api.paddle.com/customers?email=${encodeURIComponent(email)}&per_page=1`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const listJson = (await listRes.json()) as {
      data?: { id: string }[];
      error?: { detail?: string };
    };

    let customerId: string | undefined;

    if (!listRes.ok) {
      return {
        success: false,
        error:
          listJson.error?.detail ??
          `Failed to look up customer (${listRes.status})`,
      };
    }

    if (listJson.data?.length) {
      customerId = listJson.data[0].id;
    } else {
      const createRes = await fetch("https://api.paddle.com/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: identity.name ?? undefined,
        }),
      });
      const createJson = (await createRes.json()) as {
        data?: { id: string };
        error?: { detail?: string };
      };
      if (!createRes.ok || !createJson.data?.id) {
        return {
          success: false,
          error:
            createJson.error?.detail ??
            `Failed to create Paddle customer (${createRes.status})`,
        };
      }
      customerId = createJson.data.id;
    }

    const addrRes = await fetch(
      `https://api.paddle.com/customers/${customerId}/addresses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country_code: country,
          description: "Billing",
        }),
      }
    );
    const addrJson = (await addrRes.json()) as {
      data?: { id: string };
      error?: { detail?: string };
    };
    if (!addrRes.ok || !addrJson.data?.id) {
      return {
        success: false,
        error:
          addrJson.error?.detail ??
          `Failed to create billing address (${addrRes.status})`,
      };
    }

    const txRes = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId.trim(), quantity: 1 }],
        customer_id: customerId,
        address_id: addrJson.data.id,
        collection_mode: "automatic",
        custom_data: {
          workspaceId: args.workspaceId,
          plan: args.plan,
        },
      }),
    });
    const txJson = (await txRes.json()) as {
      data?: { id: string; checkout?: { url?: string | null } };
      error?: { detail?: string };
    };

    if (!txRes.ok || !txJson.data?.id) {
      return {
        success: false,
        error:
          txJson.error?.detail ??
          `Failed to create checkout transaction (${txRes.status})`,
      };
    }

    let checkoutUrl = txJson.data.checkout?.url ?? null;
    if (!checkoutUrl) {
      const getRes = await fetch(
        `https://api.paddle.com/transactions/${txJson.data.id}?include=checkout`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const getJson = (await getRes.json()) as {
        data?: { checkout?: { url?: string | null } };
      };
      checkoutUrl = getJson.data?.checkout?.url ?? null;
    }

    if (!checkoutUrl) {
      return {
        success: false,
        error: "Paddle did not return a checkout URL",
      };
    }

    return { success: true, checkoutUrl };
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

export const getSubscriptionByPaddleId = query({
  args: { paddleSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_paddleSubscriptionId", (q) =>
        q.eq("paddleSubscriptionId", args.paddleSubscriptionId)
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

export const upsertSubscriptionFromPaddle = internalMutation({
  args: {
    paddleSubscriptionId: v.string(),
    paddleCustomerId: v.string(),
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
    workspaceIdHint: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_paddleSubscriptionId", (q) =>
        q.eq("paddleSubscriptionId", args.paddleSubscriptionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        paddleCustomerId: args.paddleCustomerId,
        paddleSubscriptionId: args.paddleSubscriptionId,
        status: args.status,
        plan: args.plan,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        customerEmail: args.customerEmail,
      });
      return existing._id;
    }

    if (args.workspaceIdHint) {
      try {
        const workspace = await ctx.db.get(args.workspaceIdHint as Id<"workspaces">);
        if (workspace) {
          const existingWorkspaceSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
            .first();

          if (existingWorkspaceSub) {
            await ctx.db.patch(existingWorkspaceSub._id, {
              paddleSubscriptionId: args.paddleSubscriptionId,
              paddleCustomerId: args.paddleCustomerId,
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
            workspaceId: workspace._id,
            paddleSubscriptionId: args.paddleSubscriptionId,
            paddleCustomerId: args.paddleCustomerId,
            customerEmail: args.customerEmail,
            status: args.status,
            plan: args.plan,
            currentPeriodStart: args.currentPeriodStart,
            currentPeriodEnd: args.currentPeriodEnd,
            cancelAtPeriodEnd: args.cancelAtPeriodEnd,
          });
        }
      } catch (e) {
        console.error("workspaceIdHint lookup failed:", e);
      }
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
          paddleSubscriptionId: args.paddleSubscriptionId,
          paddleCustomerId: args.paddleCustomerId,
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
        paddleSubscriptionId: args.paddleSubscriptionId,
        paddleCustomerId: args.paddleCustomerId,
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
      paddleSubscriptionId: args.paddleSubscriptionId,
      paddleCustomerId: args.paddleCustomerId,
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
