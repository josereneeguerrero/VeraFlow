import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { id: v.id("workflowSteps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(args.id);
  },
});

export const listByWorkflow = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    return steps.sort((a, b) => a.order - b.order);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("workflowSteps"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("awaiting_approval"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const step = await ctx.db.get(args.id);
    if (!step) throw new Error("Step not found");

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);

    if (args.status === "completed") {
      const allSteps = await ctx.db
        .query("workflowSteps")
        .withIndex("by_workflow", (q) => q.eq("workflowId", step.workflowId))
        .collect();

      const nextStep = allSteps
        .sort((a, b) => a.order - b.order)
        .find((s) => s.order > step.order && s.status === "pending");

      if (nextStep) {
        await ctx.db.patch(nextStep._id, { status: "in_progress" });
      }
    }

    return true;
  },
});

export const assign = mutation({
  args: {
    id: v.id("workflowSteps"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { assignedTo: args.userId });
    return true;
  },
});

export const addNotes = mutation({
  args: {
    id: v.id("workflowSteps"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { notes: args.notes });
    return true;
  },
});

export const requestApproval = mutation({
  args: {
    id: v.id("workflowSteps"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { status: "awaiting_approval" });
    return true;
  },
});

export const approve = mutation({
  args: {
    id: v.id("workflowSteps"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "completed",
      approvedBy: userId,
      completedAt: Date.now(),
    });

    return true;
  },
});

export const getPendingApprovals = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_approval"))
      .collect();

    const stepsWithWorkflows = await Promise.all(
      steps.map(async (step) => {
        const workflow = await ctx.db.get(step.workflowId);
        if (workflow?.workspaceId !== args.workspaceId) return null;
        return { ...step, workflow };
      })
    );

    return stepsWithWorkflows.filter(Boolean);
  },
});
