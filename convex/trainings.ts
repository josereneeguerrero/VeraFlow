import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const trainingCategories = [
  "HIPAA Privacy",
  "HIPAA Security",
  "Compliance Basics",
  "Data Handling",
  "Incident Response",
  "Security Awareness",
  "Phishing Prevention",
  "Password Security",
  "Physical Security",
  "Other",
];

export const getCategories = query({
  args: {},
  handler: async () => {
    return trainingCategories;
  },
});

export const listCourses = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const courses = await ctx.db
      .query("trainingCourses")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const assignments = await ctx.db
          .query("trainingAssignments")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect();

        const completed = assignments.filter((a) => a.status === "completed").length;
        const inProgress = assignments.filter((a) => a.status === "in_progress" || a.status === "assigned").length;

        return {
          ...course,
          totalAssigned: assignments.length,
          completed,
          inProgress,
          completionRate: assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 0,
        };
      })
    );

    return coursesWithStats;
  },
});

export const getCourse = query({
  args: { id: v.id("trainingCourses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const course = await ctx.db.get(args.id);
    if (!course) return null;

    const creator = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", course.createdBy))
      .first();

    return {
      ...course,
      creatorName: creator?.name || "Unknown",
    };
  },
});

export const createCourse = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    duration: v.string(),
    content: v.optional(v.string()),
    passingScore: v.number(),
    isRequired: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("trainingCourses", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      category: args.category,
      duration: args.duration,
      content: args.content,
      passingScore: args.passingScore,
      isRequired: args.isRequired,
      status: "active",
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCourse = mutation({
  args: {
    id: v.id("trainingCourses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    duration: v.optional(v.string()),
    content: v.optional(v.string()),
    passingScore: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const archiveCourse = mutation({
  args: { id: v.id("trainingCourses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { status: "archived", updatedAt: Date.now() });
    return true;
  },
});

export const listAssignments = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const assignments = await ctx.db
      .query("trainingAssignments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await ctx.db.get(assignment.courseId);
        const user = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", assignment.userId))
          .first();

        return {
          ...assignment,
          courseName: course?.name || "Unknown Course",
          courseCategory: course?.category,
          userName: user?.name || "Unknown User",
          userEmail: user?.email,
        };
      })
    );

    return assignmentsWithDetails;
  },
});

export const getMyAssignments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const assignments = await ctx.db
      .query("trainingAssignments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const assignmentsWithCourses = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await ctx.db.get(assignment.courseId);
        return {
          ...assignment,
          course,
        };
      })
    );

    return assignmentsWithCourses.filter((a) => a.course);
  },
});

export const assignTraining = mutation({
  args: {
    courseId: v.id("trainingCourses"),
    userIds: v.array(v.id("users")),
    workspaceId: v.id("workspaces"),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const assignmentIds = [];

    for (const targetUserId of args.userIds) {
      const existing = await ctx.db
        .query("trainingAssignments")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .filter((q) => q.eq(q.field("userId"), targetUserId))
        .first();

      if (existing && existing.status !== "completed") {
        continue;
      }

      const id = await ctx.db.insert("trainingAssignments", {
        courseId: args.courseId,
        userId: targetUserId,
        workspaceId: args.workspaceId,
        assignedBy: userId,
        assignedAt: now,
        dueDate: args.dueDate,
        status: "assigned",
        attempts: 0,
      });
      assignmentIds.push(id);
    }

    return assignmentIds;
  },
});

export const startTraining = mutation({
  args: { assignmentId: v.id("trainingAssignments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.userId !== userId) throw new Error("Not your assignment");

    await ctx.db.patch(args.assignmentId, {
      status: "in_progress",
      startedAt: assignment.startedAt || Date.now(),
      attempts: assignment.attempts + 1,
    });

    return args.assignmentId;
  },
});

export const completeTraining = mutation({
  args: {
    assignmentId: v.id("trainingAssignments"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.userId !== userId) throw new Error("Not your assignment");

    const course = await ctx.db.get(assignment.courseId);
    if (!course) throw new Error("Course not found");

    const passed = args.score >= course.passingScore;

    await ctx.db.patch(args.assignmentId, {
      status: passed ? "completed" : "failed",
      completedAt: Date.now(),
      score: args.score,
      certificateId: passed ? `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
    });

    return {
      passed,
      score: args.score,
      passingScore: course.passingScore,
    };
  },
});

export const getStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const courses = await ctx.db
      .query("trainingCourses")
      .withIndex("by_status", (q) => q.eq("workspaceId", args.workspaceId).eq("status", "active"))
      .collect();

    const assignments = await ctx.db
      .query("trainingAssignments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const now = Date.now();

    return {
      totalCourses: courses.length,
      requiredCourses: courses.filter((c) => c.isRequired).length,
      totalAssignments: assignments.length,
      completed: assignments.filter((a) => a.status === "completed").length,
      inProgress: assignments.filter((a) => a.status === "in_progress" || a.status === "assigned").length,
      overdue: assignments.filter(
        (a) =>
          a.dueDate &&
          a.dueDate < now &&
          a.status !== "completed"
      ).length,
      averageScore: Math.round(
        assignments
          .filter((a) => a.score !== undefined)
          .reduce((acc, a) => acc + (a.score || 0), 0) /
          Math.max(1, assignments.filter((a) => a.score !== undefined).length)
      ),
    };
  },
});

export const getUserTrainingStatus = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const assignments = await ctx.db
      .query("trainingAssignments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workspaceAssignments = assignments.filter(
      (a) => a.workspaceId === args.workspaceId
    );

    const completed = workspaceAssignments.filter((a) => a.status === "completed").length;
    const pending = workspaceAssignments.filter(
      (a) => a.status === "assigned" || a.status === "in_progress"
    ).length;
    const overdue = workspaceAssignments.filter(
      (a) =>
        a.dueDate &&
        a.dueDate < Date.now() &&
        a.status !== "completed"
    ).length;

    return {
      total: workspaceAssignments.length,
      completed,
      pending,
      overdue,
      completionRate: workspaceAssignments.length > 0
        ? Math.round((completed / workspaceAssignments.length) * 100)
        : 100,
    };
  },
});
