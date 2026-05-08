import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.string(),
    storageId: v.string(),
    workflowStepId: v.optional(v.id("workflowSteps")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const documentId = await ctx.db.insert("documents", {
      workspaceId: args.workspaceId,
      workflowStepId: args.workflowStepId,
      name: args.name,
      type: args.type,
      storageId: args.storageId,
      uploadedBy: userId,
      uploadedAt: Date.now(),
    });

    if (args.workflowStepId) {
      await ctx.db.patch(args.workflowStepId, {
        documentationId: documentId,
      });
    }

    return documentId;
  },
});

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploader = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", doc.uploadedBy))
          .first();

        return {
          ...doc,
          url,
          uploaderName: uploader?.name || "Unknown",
        };
      })
    );

    return documentsWithUrls;
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const document = await ctx.db.get(args.id);
    if (!document) return null;

    const url = await ctx.storage.getUrl(document.storageId);
    const uploader = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", document.uploadedBy))
      .first();

    let workflowStep = null;
    let workflow = null;
    if (document.workflowStepId) {
      workflowStep = await ctx.db.get(document.workflowStepId);
      if (workflowStep) {
        workflow = await ctx.db.get(workflowStep.workflowId);
      }
    }

    return {
      ...document,
      url,
      uploaderName: uploader?.name || "Unknown",
      workflowStep,
      workflow,
    };
  },
});

export const getByWorkflowStep = query({
  args: { workflowStepId: v.id("workflowSteps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const document = await ctx.db
      .query("documents")
      .withIndex("by_step", (q) => q.eq("workflowStepId", args.workflowStepId))
      .first();

    if (!document) return null;

    const url = await ctx.storage.getUrl(document.storageId);
    return {
      ...document,
      url,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const document = await ctx.db.get(args.id);
    if (!document) throw new Error("Document not found");

    if (document.workflowStepId) {
      const step = await ctx.db.get(document.workflowStepId);
      if (step && step.documentationId === args.id) {
        await ctx.db.patch(document.workflowStepId, {
          documentationId: undefined,
        });
      }
    }

    await ctx.storage.delete(document.storageId);
    await ctx.db.delete(args.id);

    return true;
  },
});

export const rename = mutation({
  args: {
    id: v.id("documents"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, { name: args.name });
    return true;
  },
});

export const getRecentDocuments = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit || 5;
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit);

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      })
    );

    return documentsWithUrls;
  },
});

export const getDocumentStats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const typeCount: Record<string, number> = {};
    documents.forEach((doc) => {
      const type = doc.type.split("/")[0] || "other";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const thisWeekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentUploads = documents.filter((d) => d.uploadedAt >= thisWeekStart).length;

    return {
      total: documents.length,
      recentUploads,
      byType: typeCount,
    };
  },
});
