import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const assessmentQuestions = [
  {
    id: "q1",
    question: "How often do you review compliance documentation?",
    options: [
      { value: "weekly", label: "Weekly", score: 100 },
      { value: "monthly", label: "Monthly", score: 75 },
      { value: "quarterly", label: "Quarterly", score: 50 },
      { value: "annually", label: "Annually", score: 25 },
      { value: "never", label: "Never/Not sure", score: 0 },
    ],
  },
  {
    id: "q2",
    question: "Does your team have documented compliance procedures?",
    options: [
      { value: "comprehensive", label: "Yes, comprehensive and up-to-date", score: 100 },
      { value: "partial", label: "Partially documented", score: 60 },
      { value: "outdated", label: "Yes, but outdated", score: 30 },
      { value: "none", label: "No documentation", score: 0 },
    ],
  },
  {
    id: "q3",
    question: "How do you currently track compliance training?",
    options: [
      { value: "automated", label: "Automated system with reminders", score: 100 },
      { value: "manual_regular", label: "Manual tracking, regularly updated", score: 70 },
      { value: "manual_irregular", label: "Manual tracking, irregularly updated", score: 40 },
      { value: "none", label: "Not tracked", score: 0 },
    ],
  },
  {
    id: "q4",
    question: "How prepared is your team for a compliance audit?",
    options: [
      { value: "very", label: "Very prepared - could pass tomorrow", score: 100 },
      { value: "somewhat", label: "Somewhat prepared - need a week notice", score: 70 },
      { value: "unprepared", label: "Not very prepared - need significant work", score: 30 },
      { value: "unsure", label: "Not sure", score: 15 },
    ],
  },
  {
    id: "q5",
    question: "Do you have a designated compliance officer or team?",
    options: [
      { value: "dedicated", label: "Yes, dedicated compliance team", score: 100 },
      { value: "officer", label: "Yes, a compliance officer", score: 80 },
      { value: "shared", label: "Shared responsibility", score: 50 },
      { value: "none", label: "No designated person", score: 20 },
    ],
  },
];

export const getQuestions = query({
  args: {},
  handler: async () => {
    return assessmentQuestions;
  },
});

export const submit = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    responses: v.array(
      v.object({
        questionId: v.string(),
        answer: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let totalScore = 0;
    let maxScore = 0;

    for (const response of args.responses) {
      const question = assessmentQuestions.find((q) => q.id === response.questionId);
      if (question) {
        const option = question.options.find((o) => o.value === response.answer);
        if (option) {
          totalScore += option.score;
        }
        maxScore += 100;
      }
    }

    const score = Math.round((totalScore / maxScore) * 100);

    const assessmentId = await ctx.db.insert("assessments", {
      workspaceId: args.workspaceId,
      type: "initial",
      responses: args.responses,
      score,
      completedBy: userId,
      completedAt: Date.now(),
    });

    await ctx.db.patch(args.workspaceId, { readinessScore: score });

    return { assessmentId, score };
  },
});

export const getLatest = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (assessments.length === 0) return null;

    return assessments.sort((a, b) => b.completedAt - a.completedAt)[0];
  },
});

export const getHistory = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return assessments.sort((a, b) => b.completedAt - a.completedAt);
  },
});
