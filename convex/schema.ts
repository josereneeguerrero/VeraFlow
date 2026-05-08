import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("manager"),
      v.literal("member")
    ),
    avatar: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    currentWorkspaceId: v.optional(v.id("workspaces")),
  }).index("by_userId", ["userId"]),

  workspaces: defineTable({
    name: v.string(),
    industry: v.string(),
    teamSize: v.string(),
    teamType: v.string(),
    goals: v.array(v.string()),
    ownerId: v.id("users"),
    readinessScore: v.number(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.string(),
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("active")),
    email: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  workflowTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    steps: v.array(
      v.object({
        order: v.number(),
        title: v.string(),
        description: v.string(),
        requiresApproval: v.boolean(),
        requiresDocumentation: v.boolean(),
      })
    ),
    estimatedDuration: v.string(),
    priority: v.string(),
    isDefault: v.boolean(),
  }),

  workflows: defineTable({
    workspaceId: v.id("workspaces"),
    templateId: v.optional(v.id("workflowTemplates")),
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    progress: v.number(),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"])
    .index("by_assignee", ["assignedTo"]),

  workflowSteps: defineTable({
    workflowId: v.id("workflows"),
    order: v.number(),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("awaiting_approval"),
      v.literal("completed")
    ),
    assignedTo: v.optional(v.id("users")),
    requiresApproval: v.boolean(),
    approvedBy: v.optional(v.id("users")),
    requiresDocumentation: v.boolean(),
    documentationId: v.optional(v.id("documents")),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_assignee", ["assignedTo"])
    .index("by_status", ["status"]),

  documents: defineTable({
    workspaceId: v.id("workspaces"),
    workflowStepId: v.optional(v.id("workflowSteps")),
    name: v.string(),
    type: v.string(),
    storageId: v.string(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_step", ["workflowStepId"]),

  recommendations: defineTable({
    workspaceId: v.id("workspaces"),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    category: v.string(),
    suggestedAction: v.string(),
    relatedWorkflowId: v.optional(v.id("workflows")),
    status: v.union(
      v.literal("new"),
      v.literal("viewed"),
      v.literal("acted"),
      v.literal("dismissed")
    ),
    createdAt: v.number(),
    actedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["workspaceId", "status"])
    .index("by_priority", ["workspaceId", "priority"]),

  integrations: defineTable({
    workspaceId: v.id("workspaces"),
    provider: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error")
    ),
    config: v.optional(v.any()),
    lastSyncAt: v.optional(v.number()),
    connectedBy: v.optional(v.id("users")),
    connectedAt: v.optional(v.number()),
  }).index("by_workspace", ["workspaceId"]),

  assessments: defineTable({
    workspaceId: v.id("workspaces"),
    type: v.string(),
    responses: v.array(
      v.object({
        questionId: v.string(),
        answer: v.any(),
      })
    ),
    score: v.number(),
    completedBy: v.id("users"),
    completedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_type", ["workspaceId", "type"]),

  activityLog: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_recent", ["workspaceId", "createdAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_unread", ["userId", "read"])
    .index("by_workspace", ["workspaceId"]),

  subscriptions: defineTable({
    workspaceId: v.id("workspaces"),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_polarSubscriptionId", ["polarSubscriptionId"])
    .index("by_customerEmail", ["customerEmail"]),
});
