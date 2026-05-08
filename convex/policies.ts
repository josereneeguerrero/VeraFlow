import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const policyCategories = [
  "Privacy",
  "Security",
  "Breach Notification",
  "Access Control",
  "Training",
  "Risk Management",
  "Business Associate",
  "Incident Response",
  "Data Retention",
  "Physical Security",
  "Acceptable Use",
  "Other",
];

export const getCategories = query({
  args: {},
  handler: async () => {
    return policyCategories;
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const policies = await ctx.db
      .query("policies")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const policiesWithDetails = await Promise.all(
      policies.map(async (policy) => {
        const creator = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", policy.createdBy))
          .first();

        const acknowledgments = await ctx.db
          .query("policyAcknowledgments")
          .withIndex("by_policy", (q) => q.eq("policyId", policy._id))
          .collect();

        return {
          ...policy,
          creatorName: creator?.name || "Unknown",
          acknowledgmentCount: acknowledgments.length,
        };
      })
    );

    return policiesWithDetails;
  },
});

export const get = query({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const policy = await ctx.db.get(args.id);
    if (!policy) return null;

    const creator = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", policy.createdBy))
      .first();

    const approver = policy.approvedBy
      ? await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", policy.approvedBy))
          .first()
      : null;

    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_policy", (q) => q.eq("policyId", policy._id))
      .collect();

    const userAcknowledgment = acknowledgments.find(
      (a) => a.userId === userId
    );

    const versions = await ctx.db
      .query("policyVersions")
      .withIndex("by_policy", (q) => q.eq("policyId", policy._id))
      .collect();

    return {
      ...policy,
      creatorName: creator?.name || "Unknown",
      approverName: approver?.name,
      acknowledgmentCount: acknowledgments.length,
      hasUserAcknowledged: !!userAcknowledgment,
      userAcknowledgmentDate: userAcknowledgment?.acknowledgedAt,
      versionHistory: versions.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    content: v.optional(v.string()),
    effectiveDate: v.optional(v.number()),
    nextReviewDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const policyId = await ctx.db.insert("policies", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      category: args.category,
      version: "1.0",
      status: "draft",
      content: args.content,
      effectiveDate: args.effectiveDate,
      nextReviewDate: args.nextReviewDate,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("policyVersions", {
      policyId,
      version: "1.0",
      content: args.content,
      createdBy: userId,
      createdAt: now,
    });

    await ctx.db.insert("activityLog", {
      workspaceId: args.workspaceId,
      userId,
      action: "created",
      entityType: "policy",
      entityId: policyId,
      metadata: { policyName: args.name },
      createdAt: now,
    });

    return policyId;
  },
});

export const update = mutation({
  args: {
    id: v.id("policies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.optional(v.string()),
    effectiveDate: v.optional(v.number()),
    nextReviewDate: v.optional(v.number()),
    createNewVersion: v.optional(v.boolean()),
    changes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const policy = await ctx.db.get(args.id);
    if (!policy) throw new Error("Policy not found");

    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.content !== undefined) updates.content = args.content;
    if (args.effectiveDate !== undefined) updates.effectiveDate = args.effectiveDate;
    if (args.nextReviewDate !== undefined) updates.nextReviewDate = args.nextReviewDate;

    if (args.createNewVersion && args.content !== undefined) {
      const versionParts = policy.version.split(".");
      const newVersion = `${parseInt(versionParts[0]) + 1}.0`;
      updates.version = newVersion;

      await ctx.db.insert("policyVersions", {
        policyId: args.id,
        version: newVersion,
        content: args.content,
        changes: args.changes,
        createdBy: userId,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

export const submitForReview = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const policy = await ctx.db.get(args.id);
    if (!policy) throw new Error("Policy not found");

    await ctx.db.patch(args.id, {
      status: "pending_review",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const approve = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const policy = await ctx.db.get(args.id);
    if (!policy) throw new Error("Policy not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedBy: userId,
      approvedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLog", {
      workspaceId: policy.workspaceId,
      userId,
      action: "approved",
      entityType: "policy",
      entityId: args.id,
      metadata: { policyName: policy.name },
      createdAt: now,
    });

    return args.id;
  },
});

export const archive = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const acknowledge = mutation({
  args: { policyId: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found");

    const existing = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_policy_user", (q) =>
        q.eq("policyId", args.policyId).eq("userId", userId)
      )
      .first();

    if (existing && existing.version === policy.version) {
      return existing._id;
    }

    const ackId = await ctx.db.insert("policyAcknowledgments", {
      policyId: args.policyId,
      userId,
      acknowledgedAt: Date.now(),
      version: policy.version,
    });

    return ackId;
  },
});

export const getAcknowledgments = query({
  args: { policyId: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_policy", (q) => q.eq("policyId", args.policyId))
      .collect();

    const acksWithUsers = await Promise.all(
      acknowledgments.map(async (ack) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", ack.userId))
          .first();

        return {
          ...ack,
          userName: profile?.name || "Unknown User",
          userEmail: profile?.email,
        };
      })
    );

    return acksWithUsers;
  },
});

export const getPendingAcknowledgments = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const policies = await ctx.db
      .query("policies")
      .withIndex("by_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "approved")
      )
      .collect();

    const pending = [];

    for (const policy of policies) {
      const acknowledgment = await ctx.db
        .query("policyAcknowledgments")
        .withIndex("by_policy_user", (q) =>
          q.eq("policyId", policy._id).eq("userId", userId)
        )
        .first();

      if (!acknowledgment || acknowledgment.version !== policy.version) {
        pending.push(policy);
      }
    }

    return pending;
  },
});

export const getStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const policies = await ctx.db
      .query("policies")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const totalPolicies = policies.length;
    const approvedPolicies = policies.filter((p) => p.status === "approved").length;
    const draftPolicies = policies.filter((p) => p.status === "draft").length;
    const pendingReview = policies.filter((p) => p.status === "pending_review").length;
    const needsReview = policies.filter(
      (p) => p.nextReviewDate && p.nextReviewDate < thirtyDaysFromNow
    ).length;
    const expiringSoon = policies.filter(
      (p) => p.expirationDate && p.expirationDate < thirtyDaysFromNow && p.expirationDate > now
    ).length;

    return {
      totalPolicies,
      approvedPolicies,
      draftPolicies,
      pendingReview,
      needsReview,
      expiringSoon,
    };
  },
});

export const deletePermanently = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const policy = await ctx.db.get(args.id);
    if (!policy) throw new Error("Policy not found");

    const acknowledgments = await ctx.db
      .query("policyAcknowledgments")
      .withIndex("by_policy", (q) => q.eq("policyId", args.id))
      .collect();

    for (const ack of acknowledgments) {
      await ctx.db.delete(ack._id);
    }

    const versions = await ctx.db
      .query("policyVersions")
      .withIndex("by_policy", (q) => q.eq("policyId", args.id))
      .collect();

    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    await ctx.db.delete(args.id);

    return true;
  },
});
