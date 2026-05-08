import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getSlackConfig = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), "slack"))
      .first();

    if (!integration) return null;

    return {
      _id: integration._id,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      webhookConfigured: !!(integration.config as any)?.webhookUrl,
      channel: (integration.config as any)?.channel || "#general",
      notifyOn: (integration.config as any)?.notifyOn || {
        workflowCreated: true,
        stepCompleted: true,
        approvalRequired: true,
        recommendationCritical: true,
        documentUploaded: false,
      },
    };
  },
});

export const configureSlack = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    webhookUrl: v.string(),
    channel: v.optional(v.string()),
    notifyOn: v.optional(v.object({
      workflowCreated: v.boolean(),
      stepCompleted: v.boolean(),
      approvalRequired: v.boolean(),
      recommendationCritical: v.boolean(),
      documentUploaded: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!args.webhookUrl.startsWith("https://hooks.slack.com/")) {
      throw new Error("Invalid Slack webhook URL");
    }

    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), "slack"))
      .first();

    const config = {
      webhookUrl: args.webhookUrl,
      channel: args.channel || "#general",
      notifyOn: args.notifyOn || {
        workflowCreated: true,
        stepCompleted: true,
        approvalRequired: true,
        recommendationCritical: true,
        documentUploaded: false,
      },
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "connected",
        config,
        connectedBy: userId,
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("integrations", {
      workspaceId: args.workspaceId,
      provider: "slack",
      name: "Slack",
      description: "Get notifications and updates in your Slack channels",
      icon: "message-square",
      status: "connected",
      config,
      connectedBy: userId,
      connectedAt: Date.now(),
      lastSyncAt: Date.now(),
    });
  },
});

export const testSlackWebhook = action({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const integration = await ctx.runQuery(internal.slack.getSlackConfigInternal, {
      workspaceId: args.workspaceId,
    });

    if (!integration?.config?.webhookUrl) {
      return { success: false, error: "Slack webhook not configured" };
    }

    try {
      const response = await fetch(integration.config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "✅ *VeraFlow Connected!*\nYour Slack integration is working. You'll receive compliance notifications here.",
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Test sent at ${new Date().toLocaleString()}`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}`);
      }

      await ctx.runMutation(internal.slack.updateLastSync, {
        workspaceId: args.workspaceId,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const getSlackConfigInternal = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), "slack"))
      .first();

    if (!integration) return null;

    return {
      _id: integration._id,
      status: integration.status,
      config: integration.config as {
        webhookUrl: string;
        channel: string;
        notifyOn: {
          workflowCreated: boolean;
          stepCompleted: boolean;
          approvalRequired: boolean;
          recommendationCritical: boolean;
          documentUploaded: boolean;
        };
      },
    };
  },
});

export const updateLastSync = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), "slack"))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, { lastSyncAt: Date.now() });
    }
  },
});

export const sendSlackNotification = action({
  args: {
    workspaceId: v.id("workspaces"),
    type: v.union(
      v.literal("workflow_created"),
      v.literal("step_completed"),
      v.literal("approval_required"),
      v.literal("recommendation_critical"),
      v.literal("document_uploaded")
    ),
    title: v.string(),
    message: v.string(),
    url: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const integration = await ctx.runQuery(internal.slack.getSlackConfigInternal, {
      workspaceId: args.workspaceId,
    });

    if (!integration?.config?.webhookUrl || integration.status !== "connected") {
      return { success: false, error: "Slack not configured" };
    }

    const notifyOn = integration.config.notifyOn;
    const typeMap: Record<string, keyof typeof notifyOn> = {
      workflow_created: "workflowCreated",
      step_completed: "stepCompleted",
      approval_required: "approvalRequired",
      recommendation_critical: "recommendationCritical",
      document_uploaded: "documentUploaded",
    };

    const notifyKey = typeMap[args.type];
    if (notifyKey && !notifyOn[notifyKey]) {
      return { success: false, error: "Notification type disabled" };
    }

    const emoji = getNotificationEmoji(args.type, args.priority);
    const color = getNotificationColor(args.priority);

    try {
      const blocks: any[] = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *${args.title}*\n${args.message}`,
          },
        },
      ];

      if (args.url) {
        blocks.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in VeraFlow",
                emoji: true,
              },
              url: args.url,
            },
          ],
        });
      }

      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `VeraFlow • ${new Date().toLocaleString()}`,
          },
        ],
      });

      const payload: any = {
        blocks,
      };

      if (color) {
        payload.attachments = [{ color, blocks: [] }];
      }

      const response = await fetch(integration.config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}`);
      }

      await ctx.runMutation(internal.slack.updateLastSync, {
        workspaceId: args.workspaceId,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Slack notification failed:", error);
      return { success: false, error: error.message };
    }
  },
});

function getNotificationEmoji(type: string, priority?: string): string {
  if (priority === "critical") return "🚨";
  if (priority === "high") return "⚠️";
  
  switch (type) {
    case "workflow_created": return "📋";
    case "step_completed": return "✅";
    case "approval_required": return "⏳";
    case "recommendation_critical": return "🔴";
    case "document_uploaded": return "📄";
    default: return "📢";
  }
}

function getNotificationColor(priority?: string): string | undefined {
  switch (priority) {
    case "critical": return "#DC2626";
    case "high": return "#F59E0B";
    case "medium": return "#3B82F6";
    case "low": return "#10B981";
    default: return undefined;
  }
}

export const disconnectSlack = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), "slack"))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        status: "disconnected",
        config: undefined,
      });
    }

    return true;
  },
});
