import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  categoryId?: string;
  priority?: 'default' | 'normal' | 'high';
}

export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const profile = await ctx.runQuery(internal.pushNotifications.getUserPushToken, {
      userId: args.userId,
    });

    if (!profile?.pushToken) {
      return { success: false, error: "User has no push token" };
    }

    if (!profile.notificationsEnabled) {
      return { success: false, error: "User has disabled notifications" };
    }

    const message: ExpoPushMessage = {
      to: profile.pushToken,
      title: args.title,
      body: args.body,
      sound: 'default',
      priority: 'high',
      data: {
        ...args.data,
        type: args.type,
      },
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'error') {
        return { success: false, error: result.data.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  },
});

export const sendBulkPushNotifications = action({
  args: {
    userIds: v.array(v.id("users")),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ sent: number; failed: number }> => {
    const profiles = await ctx.runQuery(internal.pushNotifications.getUsersPushTokens, {
      userIds: args.userIds,
    });

    const messages: ExpoPushMessage[] = profiles
      .filter(p => p.pushToken && p.notificationsEnabled)
      .map(p => ({
        to: p.pushToken!,
        title: args.title,
        body: args.body,
        sound: 'default',
        priority: 'high',
        data: {
          ...args.data,
          type: args.type,
        },
      }));

    if (messages.length === 0) {
      return { sent: 0, failed: args.userIds.length };
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();

      let sent = 0;
      let failed = 0;

      if (Array.isArray(result.data)) {
        result.data.forEach((r: any) => {
          if (r.status === 'ok') sent++;
          else failed++;
        });
      }

      return { sent, failed: args.userIds.length - sent };
    } catch (error: any) {
      console.error('Bulk push notification error:', error);
      return { sent: 0, failed: args.userIds.length };
    }
  },
});

export const getUserPushToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return profile ? {
      pushToken: profile.pushToken,
      notificationsEnabled: profile.notificationsEnabled ?? true,
    } : null;
  },
});

export const getUsersPushTokens = internalQuery({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const profiles = await Promise.all(
      args.userIds.map(async (userId) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        return profile ? {
          userId,
          pushToken: profile.pushToken,
          notificationsEnabled: profile.notificationsEnabled ?? true,
        } : null;
      })
    );
    return profiles.filter(Boolean) as Array<{
      userId: any;
      pushToken: string | undefined;
      notificationsEnabled: boolean;
    }>;
  },
});

export const notifyApprovalRequired = action({
  args: {
    workspaceId: v.id("workspaces"),
    workflowId: v.id("workflows"),
    stepId: v.id("workflowSteps"),
    stepTitle: v.string(),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.runQuery(internal.pushNotifications.getWorkspaceAdmins, {
      workspaceId: args.workspaceId,
    });

    const userIds = admins.map(a => a.userId);

    if (userIds.length === 0) return { sent: 0, failed: 0 };

    return await ctx.runAction(internal.pushNotifications.sendBulkPushNotifications, {
      userIds,
      title: "🔔 Approval Required",
      body: `${args.requestedBy} is requesting approval for "${args.stepTitle}"`,
      data: {
        workflowId: args.workflowId,
        stepId: args.stepId,
        actionUrl: `/(tabs)/workflows/${args.workflowId}`,
      },
      type: "approval_required",
    });
  },
});

export const notifyDeadlineApproaching = action({
  args: {
    userId: v.id("users"),
    workflowId: v.id("workflows"),
    workflowName: v.string(),
    dueDate: v.number(),
    daysRemaining: v.number(),
  },
  handler: async (ctx, args) => {
    const daysText = args.daysRemaining === 0 
      ? "due today" 
      : args.daysRemaining === 1 
        ? "due tomorrow"
        : `due in ${args.daysRemaining} days`;

    return await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      userId: args.userId,
      title: "⏰ Deadline Approaching",
      body: `"${args.workflowName}" is ${daysText}`,
      data: {
        workflowId: args.workflowId,
        actionUrl: `/(tabs)/workflows/${args.workflowId}`,
      },
      type: "deadline_reminder",
    });
  },
});

export const notifyStepCompleted = action({
  args: {
    workspaceId: v.id("workspaces"),
    workflowId: v.id("workflows"),
    stepTitle: v.string(),
    completedBy: v.string(),
    assignedToUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.assignedToUserId) return { success: true };

    return await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      userId: args.assignedToUserId,
      title: "✅ Step Completed",
      body: `${args.completedBy} completed "${args.stepTitle}"`,
      data: {
        workflowId: args.workflowId,
        actionUrl: `/(tabs)/workflows/${args.workflowId}`,
      },
      type: "step_completed",
    });
  },
});

export const notifyPolicyAcknowledgmentRequired = action({
  args: {
    userId: v.id("users"),
    policyId: v.id("policies"),
    policyName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      userId: args.userId,
      title: "📋 Policy Review Required",
      body: `Please review and acknowledge "${args.policyName}"`,
      data: {
        policyId: args.policyId,
        actionUrl: `/(tabs)/policies/${args.policyId}`,
      },
      type: "policy_acknowledgment",
    });
  },
});

export const getWorkspaceAdmins = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => 
        q.or(
          q.eq(q.field("role"), "owner"),
          q.eq(q.field("role"), "admin")
        )
      )
      .collect();

    return members.filter(m => m.status === "active");
  },
});

export const checkDeadlinesAndNotify = action({
  args: {},
  handler: async (ctx) => {
    const upcomingDeadlines = await ctx.runQuery(
      internal.pushNotifications.getUpcomingDeadlines
    );

    let notified = 0;

    for (const workflow of upcomingDeadlines) {
      if (workflow.assignedTo) {
        await ctx.runAction(internal.pushNotifications.notifyDeadlineApproaching, {
          userId: workflow.assignedTo,
          workflowId: workflow._id,
          workflowName: workflow.name,
          dueDate: workflow.dueDate!,
          daysRemaining: workflow.daysRemaining,
        });
        notified++;
      }
    }

    return { notified };
  },
});

export const getUpcomingDeadlines = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;

    const workflows = await ctx.db
      .query("workflows")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.neq(q.field("dueDate"), undefined)
        )
      )
      .collect();

    return workflows
      .filter(w => w.dueDate && w.dueDate > now && w.dueDate <= threeDaysFromNow)
      .map(w => ({
        ...w,
        daysRemaining: Math.ceil((w.dueDate! - now) / (24 * 60 * 60 * 1000)),
      }));
  },
});
