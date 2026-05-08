import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getComplianceSummary = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const activeWorkflows = workflows.filter((w) => w.status === "active");
    const completedWorkflows = workflows.filter((w) => w.status === "completed");

    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const openRecommendations = recommendations.filter(
      (r) => r.status === "new" || r.status === "viewed"
    );
    const criticalItems = recommendations.filter(
      (r) => r.priority === "critical" && r.status !== "acted"
    );

    return {
      readinessScore: workspace.readinessScore,
      totalWorkflows: workflows.length,
      activeWorkflows: activeWorkflows.length,
      completedWorkflows: completedWorkflows.length,
      completionRate: workflows.length > 0
        ? Math.round((completedWorkflows.length / workflows.length) * 100)
        : 0,
      openRecommendations: openRecommendations.length,
      criticalItems: criticalItems.length,
    };
  },
});

export const getWorkflowCompletion = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const workflowsWithSteps = await Promise.all(
      workflows.map(async (workflow) => {
        const steps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_workflow", (q) => q.eq("workflowId", workflow._id))
          .collect();

        const completedSteps = steps.filter((s) => s.status === "completed").length;

        return {
          ...workflow,
          totalSteps: steps.length,
          completedSteps,
          progress: steps.length > 0
            ? Math.round((completedSteps / steps.length) * 100)
            : 0,
        };
      })
    );

    return workflowsWithSteps;
  },
});

export const getTeamActivity = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberActivity = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();

        const activities = await ctx.db
          .query("activityLog")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .collect();

        const recentActivities = activities
          .filter((a) => a.workspaceId === args.workspaceId)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);

        const completedSteps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_assignee", (q) => q.eq("assignedTo", member.userId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        return {
          memberId: member._id,
          userId: member.userId,
          name: profile?.name || "Unknown",
          role: member.role,
          activityCount: recentActivities.length,
          completedTasks: completedSteps.length,
          recentActivities,
        };
      })
    );

    return memberActivity;
  },
});

export const getMissingDocumentation = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();

    const missingDocs = [];

    for (const workflow of workflows) {
      const steps = await ctx.db
        .query("workflowSteps")
        .withIndex("by_workflow", (q) => q.eq("workflowId", workflow._id))
        .collect();

      for (const step of steps) {
        if (step.requiresDocumentation && !step.documentationId) {
          missingDocs.push({
            workflowId: workflow._id,
            workflowName: workflow.name,
            stepId: step._id,
            stepTitle: step.title,
            stepStatus: step.status,
            dueDate: step.dueDate,
          });
        }
      }
    }

    return missingDocs;
  },
});

export const getAuditReadiness = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const completedWorkflows = workflows.filter((w) => w.status === "completed");

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const criticalOpen = recommendations.filter(
      (r) => r.priority === "critical" && r.status !== "acted"
    );

    const checklistItems = [
      {
        item: "Complete initial compliance assessment",
        completed: assessments.length > 0,
        priority: "high",
      },
      {
        item: "No critical recommendations pending",
        completed: criticalOpen.length === 0,
        priority: "critical",
      },
      {
        item: "At least one workflow completed",
        completed: completedWorkflows.length > 0,
        priority: "medium",
      },
      {
        item: "Documentation uploaded",
        completed: documents.length > 0,
        priority: "medium",
      },
      {
        item: "Readiness score above 60%",
        completed: workspace.readinessScore >= 60,
        priority: "high",
      },
    ];

    const completedChecks = checklistItems.filter((i) => i.completed).length;
    const auditScore = Math.round((completedChecks / checklistItems.length) * 100);

    return {
      score: auditScore,
      readinessScore: workspace.readinessScore,
      checklistItems,
      totalDocuments: documents.length,
      completedWorkflows: completedWorkflows.length,
      criticalItemsCount: criticalOpen.length,
    };
  },
});

export const getComplianceBreakdown = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const [workflows, workflowSteps, documents, members, assessments] = await Promise.all([
      ctx.db
        .query("workflows")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
      ctx.db.query("workflowSteps").collect(),
      ctx.db
        .query("documents")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
      ctx.db
        .query("workspaceMembers")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect(),
      ctx.db
        .query("assessments")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
    ]);

    const workflowIds = new Set(workflows.map((w) => w._id));
    const relevantSteps = workflowSteps.filter((s) => workflowIds.has(s.workflowId));

    const stepsRequiringDocs = relevantSteps.filter((s) => s.requiresDocumentation);
    const stepsWithDocs = stepsRequiringDocs.filter((s) => s.documentationId);
    const documentationScore = stepsRequiringDocs.length > 0
      ? Math.round((stepsWithDocs.length / stepsRequiringDocs.length) * 100)
      : documents.length > 0 ? 100 : 0;

    const memberIds = members.map((m) => m.userId);
    const memberAssessments = assessments.filter((a) => memberIds.includes(a.completedBy));
    const trainingScore = members.length > 0
      ? Math.round((memberAssessments.length / members.length) * 100)
      : 0;

    const activeWorkflows = workflows.filter((w) => w.status === "active" || w.status === "completed");
    const progressingWorkflows = activeWorkflows.filter((w) => w.progress >= 50);
    const processesScore = activeWorkflows.length > 0
      ? Math.round((progressingWorkflows.length / activeWorkflows.length) * 100)
      : 0;

    return {
      documentation: Math.min(documentationScore, 100),
      training: Math.min(trainingScore, 100),
      processes: Math.min(processesScore, 100),
    };
  },
});

export const getTeamMembersCount = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return members.length;
  },
});

export const getComplianceTrend = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const history = await ctx.db
      .query("complianceHistory")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(14);

    if (history.length < 2) {
      return { trend: 0, direction: "neutral" as const, lastWeekScore: null };
    }

    const currentScore = history[0]?.score || 0;
    const weekAgoIndex = Math.min(7, history.length - 1);
    const weekAgoScore = history[weekAgoIndex]?.score || currentScore;
    const trend = currentScore - weekAgoScore;

    return {
      trend,
      direction: trend > 0 ? "up" as const : trend < 0 ? "down" as const : "neutral" as const,
      lastWeekScore: weekAgoScore,
      history: history.reverse().map((h) => ({
        date: h.recordedAt,
        score: h.score,
      })),
    };
  },
});

export const recordComplianceSnapshot = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const existingSnapshot = await ctx.db
      .query("complianceHistory")
      .withIndex("by_workspace_date", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("recordedAt", startOfDay)
      )
      .first();

    if (existingSnapshot) {
      await ctx.db.patch(existingSnapshot._id, { score: workspace.readinessScore });
    } else {
      await ctx.db.insert("complianceHistory", {
        workspaceId: args.workspaceId,
        score: workspace.readinessScore,
        recordedAt: startOfDay,
      });
    }
  },
});
