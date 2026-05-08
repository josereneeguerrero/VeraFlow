import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AIRecommendation {
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  actionItems: string[];
}

export const getWorkspaceContext = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    const [workflows, recommendations, documents, members, assessments] = await Promise.all([
      ctx.db
        .query("workflows")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
      ctx.db
        .query("recommendations")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect(),
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

    const workflowSteps = await Promise.all(
      workflows.map(async (w) => {
        const steps = await ctx.db
          .query("workflowSteps")
          .withIndex("by_workflow", (q) => q.eq("workflowId", w._id))
          .collect();
        return { workflow: w, steps };
      })
    );

    const activeWorkflows = workflows.filter((w) => w.status === "active");
    const stalledWorkflows = activeWorkflows.filter((w) => {
      const ageInDays = (Date.now() - w.createdAt) / (1000 * 60 * 60 * 24);
      return w.progress < 50 && ageInDays > 14;
    });

    const stepsRequiringDocs = workflowSteps.flatMap((ws) =>
      ws.steps.filter((s) => s.requiresDocumentation && !s.documentationId && s.status !== "completed")
    );

    const openRecommendations = recommendations.filter(
      (r) => r.status === "new" || r.status === "viewed"
    );
    const criticalUnaddressed = openRecommendations.filter((r) => r.priority === "critical");

    return {
      workspace: {
        name: workspace.name,
        industry: workspace.industry,
        teamSize: workspace.teamSize,
        readinessScore: workspace.readinessScore,
      },
      stats: {
        totalWorkflows: workflows.length,
        activeWorkflows: activeWorkflows.length,
        completedWorkflows: workflows.filter((w) => w.status === "completed").length,
        stalledWorkflows: stalledWorkflows.length,
        totalDocuments: documents.length,
        teamMembersCount: members.length,
        assessmentsCompleted: assessments.length,
        openRecommendations: openRecommendations.length,
        criticalUnaddressed: criticalUnaddressed.length,
        missingDocumentation: stepsRequiringDocs.length,
      },
      issues: {
        stalledWorkflowNames: stalledWorkflows.map((w) => w.name),
        documentationGaps: stepsRequiringDocs.slice(0, 5).map((s) => s.title),
        hasNoAssessments: assessments.length === 0,
        lowReadinessScore: workspace.readinessScore < 60,
      },
    };
  },
});

export const createAIRecommendation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    impact: v.string(),
    actionItems: v.array(v.string()),
    aiGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recommendations", {
      workspaceId: args.workspaceId,
      title: args.title,
      description: args.description,
      category: args.category,
      priority: args.priority,
      impact: args.impact,
      actionItems: args.actionItems,
      status: "new",
      aiGenerated: args.aiGenerated,
      generatedAt: Date.now(),
    });
  },
});

export const generateRecommendations = action({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!OPENAI_API_KEY) {
      const context = await ctx.runQuery(internal.ai.getWorkspaceContext, {
        workspaceId: args.workspaceId,
      });

      if (!context) return { success: false, count: 0, error: "Workspace not found" };

      const recommendations = generateFallbackRecommendations(context);
      
      for (const rec of recommendations) {
        await ctx.runMutation(internal.ai.createAIRecommendation, {
          workspaceId: args.workspaceId,
          ...rec,
          aiGenerated: true,
        });
      }

      return { success: true, count: recommendations.length };
    }

    try {
      const context = await ctx.runQuery(internal.ai.getWorkspaceContext, {
        workspaceId: args.workspaceId,
      });

      if (!context) return { success: false, count: 0, error: "Workspace not found" };

      const prompt = buildPrompt(context);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a healthcare compliance expert AI assistant. Your role is to analyze compliance data and generate actionable recommendations. Focus on HIPAA, healthcare regulations, and industry best practices. Always provide specific, actionable advice prioritized by impact and urgency.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content in AI response");
      }

      const parsed = JSON.parse(content);
      const recommendations: AIRecommendation[] = parsed.recommendations || [];

      for (const rec of recommendations.slice(0, 5)) {
        await ctx.runMutation(internal.ai.createAIRecommendation, {
          workspaceId: args.workspaceId,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          priority: rec.priority,
          impact: rec.impact,
          actionItems: rec.actionItems,
          aiGenerated: true,
        });
      }

      return { success: true, count: Math.min(recommendations.length, 5) };
    } catch (error: any) {
      console.error("AI recommendation generation failed:", error);
      
      const context = await ctx.runQuery(internal.ai.getWorkspaceContext, {
        workspaceId: args.workspaceId,
      });

      if (context) {
        const fallback = generateFallbackRecommendations(context);
        for (const rec of fallback) {
          await ctx.runMutation(internal.ai.createAIRecommendation, {
            workspaceId: args.workspaceId,
            ...rec,
            aiGenerated: true,
          });
        }
        return { success: true, count: fallback.length };
      }

      return { success: false, count: 0, error: error.message };
    }
  },
});

function buildPrompt(context: any): string {
  return `
Analyze the following healthcare compliance workspace and generate 3-5 specific, actionable recommendations.

## Workspace Context
- Organization: ${context.workspace.name}
- Industry: ${context.workspace.industry}
- Team Size: ${context.workspace.teamSize}
- Current Readiness Score: ${context.workspace.readinessScore}%

## Current Status
- Active Workflows: ${context.stats.activeWorkflows}
- Completed Workflows: ${context.stats.completedWorkflows}
- Stalled Workflows: ${context.stats.stalledWorkflows}
- Documents Uploaded: ${context.stats.totalDocuments}
- Team Members: ${context.stats.teamMembersCount}
- Assessments Completed: ${context.stats.assessmentsCompleted}
- Open Recommendations: ${context.stats.openRecommendations}
- Critical Items Pending: ${context.stats.criticalUnaddressed}
- Missing Documentation: ${context.stats.missingDocumentation} items

## Identified Issues
${context.issues.stalledWorkflowNames.length > 0 ? `- Stalled workflows: ${context.issues.stalledWorkflowNames.join(", ")}` : ""}
${context.issues.documentationGaps.length > 0 ? `- Documentation gaps in: ${context.issues.documentationGaps.join(", ")}` : ""}
${context.issues.hasNoAssessments ? "- No compliance assessments have been completed" : ""}
${context.issues.lowReadinessScore ? "- Readiness score is below 60% threshold" : ""}

## Output Format
Return a JSON object with the following structure:
{
  "recommendations": [
    {
      "title": "Short actionable title",
      "description": "2-3 sentence description of the recommendation",
      "category": "One of: Training, Documentation, Process, Security, Compliance",
      "priority": "One of: critical, high, medium, low",
      "impact": "One sentence describing the expected impact",
      "actionItems": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Focus on the most impactful improvements based on the current state. Prioritize critical gaps first.
`;
}

function generateFallbackRecommendations(context: any): Omit<AIRecommendation, never>[] {
  const recommendations: AIRecommendation[] = [];

  if (context.issues.lowReadinessScore) {
    recommendations.push({
      title: "Improve Overall Compliance Readiness",
      description: `Your compliance readiness score is ${context.workspace.readinessScore}%, which is below the recommended 60% threshold. Focus on completing active workflows and addressing documentation gaps.`,
      category: "Compliance",
      priority: "critical",
      impact: "Raising your score above 60% reduces compliance risk significantly.",
      actionItems: [
        "Review all active workflows and prioritize completion",
        "Complete any pending documentation requirements",
        "Schedule team training sessions",
      ],
    });
  }

  if (context.stats.stalledWorkflows > 0) {
    recommendations.push({
      title: "Resume Stalled Compliance Workflows",
      description: `You have ${context.stats.stalledWorkflows} workflow(s) that haven't progressed in over 2 weeks. These may be blocking your compliance progress.`,
      category: "Process",
      priority: "high",
      impact: "Completing stalled workflows will improve your readiness score.",
      actionItems: [
        "Review blockers for each stalled workflow",
        "Assign clear owners to each workflow",
        "Set target completion dates",
      ],
    });
  }

  if (context.stats.missingDocumentation > 0) {
    recommendations.push({
      title: "Complete Required Documentation",
      description: `${context.stats.missingDocumentation} workflow step(s) are missing required documentation. This may impact your audit readiness.`,
      category: "Documentation",
      priority: "high",
      impact: "Complete documentation ensures audit compliance.",
      actionItems: [
        "Identify all steps requiring documentation",
        "Gather necessary documents from team members",
        "Upload and link documents to relevant steps",
      ],
    });
  }

  if (context.issues.hasNoAssessments) {
    recommendations.push({
      title: "Complete Initial Compliance Assessment",
      description: "No compliance assessments have been completed. Assessments help identify gaps and track progress over time.",
      category: "Compliance",
      priority: "high",
      impact: "Assessments provide baseline measurements for improvement.",
      actionItems: [
        "Schedule initial compliance assessment",
        "Involve key stakeholders in the process",
        "Document findings and create action plan",
      ],
    });
  }

  if (context.stats.criticalUnaddressed > 0) {
    recommendations.push({
      title: "Address Critical Compliance Items",
      description: `You have ${context.stats.criticalUnaddressed} critical recommendation(s) that haven't been addressed. These require immediate attention.`,
      category: "Compliance",
      priority: "critical",
      impact: "Addressing critical items prevents compliance violations.",
      actionItems: [
        "Review all critical recommendations",
        "Create action plans for each item",
        "Assign responsible parties and deadlines",
      ],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain Current Compliance Standards",
      description: "Your compliance program is performing well. Continue regular reviews and stay updated on regulatory changes.",
      category: "Compliance",
      priority: "low",
      impact: "Ongoing maintenance prevents compliance drift.",
      actionItems: [
        "Schedule quarterly compliance reviews",
        "Monitor regulatory updates",
        "Continue team training programs",
      ],
    });
  }

  return recommendations.slice(0, 5);
}
