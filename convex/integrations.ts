import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const availableIntegrations = [
  {
    provider: "epic",
    name: "Epic EHR",
    description: "Connect to Epic for patient data and compliance tracking",
    icon: "hospital",
  },
  {
    provider: "cerner",
    name: "Cerner",
    description: "Sync patient records and compliance documentation",
    icon: "file-medical",
  },
  {
    provider: "slack",
    name: "Slack",
    description: "Get notifications and updates in your Slack channels",
    icon: "message-square",
  },
  {
    provider: "google_workspace",
    name: "Google Workspace",
    description: "Sync documents and calendar events",
    icon: "mail",
  },
  {
    provider: "microsoft_365",
    name: "Microsoft 365",
    description: "Connect Teams, Outlook, and SharePoint",
    icon: "grid",
  },
  {
    provider: "docusign",
    name: "DocuSign",
    description: "Automate document signing workflows",
    icon: "pen-tool",
  },
  {
    provider: "zoom",
    name: "Zoom",
    description: "Track compliance training sessions",
    icon: "video",
  },
  {
    provider: "jira",
    name: "Jira",
    description: "Sync compliance tasks with your project management",
    icon: "trello",
  },
];

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const connected = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const connectedProviders = new Set(connected.map((i) => i.provider));

    return availableIntegrations.map((integration) => {
      const connectedIntegration = connected.find(
        (c) => c.provider === integration.provider
      );
      return {
        ...integration,
        _id: connectedIntegration?._id,
        status: connectedIntegration?.status || "disconnected",
        lastSyncAt: connectedIntegration?.lastSyncAt,
        isConnected: connectedProviders.has(integration.provider),
      };
    });
  },
});

export const get = query({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const integration = await ctx.db.get(args.id);
    if (!integration) return null;

    const baseInfo = availableIntegrations.find(
      (i) => i.provider === integration.provider
    );

    return { ...integration, ...baseInfo };
  },
});

export const connect = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseInfo = availableIntegrations.find(
      (i) => i.provider === args.provider
    );
    if (!baseInfo) throw new Error("Unknown provider");

    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "connected",
        config: args.config,
        connectedBy: userId,
        connectedAt: Date.now(),
        lastSyncAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("integrations", {
      workspaceId: args.workspaceId,
      provider: args.provider,
      name: baseInfo.name,
      description: baseInfo.description,
      icon: baseInfo.icon,
      status: "connected",
      config: args.config,
      connectedBy: userId,
      connectedAt: Date.now(),
      lastSyncAt: Date.now(),
    });
  },
});

export const disconnect = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { status: "disconnected" });
    return true;
  },
});

export const sync = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { lastSyncAt: Date.now() });
    return true;
  },
});
