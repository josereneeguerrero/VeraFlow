import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return workflows;
  },
});

export const get = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workflow = await ctx.db.get(args.id);
    if (!workflow) return null;

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.id))
      .collect();

    return {
      ...workflow,
      steps: steps.sort((a, b) => a.order - b.order),
    };
  },
});

export const getByStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("workflows")
      .withIndex("by_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", args.status)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.string(),
    templateId: v.optional(v.id("workflowTemplates")),
    dueDate: v.optional(v.number()),
    steps: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        requiresApproval: v.boolean(),
        requiresDocumentation: v.boolean(),
        dueDate: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workflowId = await ctx.db.insert("workflows", {
      workspaceId: args.workspaceId,
      templateId: args.templateId,
      name: args.name,
      description: args.description,
      status: "active",
      progress: 0,
      dueDate: args.dueDate,
      createdBy: userId,
      createdAt: Date.now(),
    });

    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i];
      await ctx.db.insert("workflowSteps", {
        workflowId,
        order: i + 1,
        title: step.title,
        description: step.description,
        status: i === 0 ? "in_progress" : "pending",
        requiresApproval: step.requiresApproval,
        requiresDocumentation: step.requiresDocumentation,
        dueDate: step.dueDate,
      });
    }

    await ctx.db.insert("activityLog", {
      workspaceId: args.workspaceId,
      userId,
      action: "workflow_created",
      entityType: "workflow",
      entityId: workflowId,
      metadata: { name: args.name },
      createdAt: Date.now(),
    });

    return workflowId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("workflows"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
      updates.progress = 100;
    }

    await ctx.db.patch(args.id, updates);
    return true;
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.id))
      .collect();

    const completed = steps.filter((s) => s.status === "completed").length;
    const progress = Math.round((completed / steps.length) * 100);

    await ctx.db.patch(args.id, { progress });

    if (progress === 100) {
      await ctx.db.patch(args.id, { status: "completed", completedAt: Date.now() });
    }

    return progress;
  },
});

export const getTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db.query("workflowTemplates").collect();
  },
});

export const getAssignedToMe = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const steps = await ctx.db
      .query("workflowSteps")
      .withIndex("by_assignee", (q) => q.eq("assignedTo", userId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();

    const workflowIds = [...new Set(steps.map((s) => s.workflowId))];
    const workflows = await Promise.all(workflowIds.map((id) => ctx.db.get(id)));

    return workflows
      .filter((w) => w && w.workspaceId === args.workspaceId)
      .map((w) => ({
        ...w,
        mySteps: steps.filter((s) => s.workflowId === w!._id),
      }));
  },
});
