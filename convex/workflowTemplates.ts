import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const defaultTemplates = [
  {
    name: "HIPAA Training Compliance",
    description: "Ensure all team members complete required HIPAA training and maintain proper documentation.",
    category: "Training",
    steps: [
      {
        order: 1,
        title: "Assign HIPAA Training Course",
        description: "Assign the annual HIPAA training course to all healthcare team members",
        requiresApproval: false,
        requiresDocumentation: false,
      },
      {
        order: 2,
        title: "Complete HIPAA Training",
        description: "Team members complete the assigned HIPAA training modules",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Pass Certification Exam",
        description: "Successfully pass the HIPAA certification exam with a score of 80% or higher",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Sign Compliance Agreement",
        description: "Sign the annual HIPAA compliance agreement acknowledging understanding of policies",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Update Training Records",
        description: "Update employee training records with completion dates and certification numbers",
        requiresApproval: false,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "2 weeks",
    priority: "high",
    isDefault: true,
  },
  {
    name: "Privacy Policy Review",
    description: "Quarterly review and update of organizational privacy policies to ensure compliance with current regulations.",
    category: "Documentation",
    steps: [
      {
        order: 1,
        title: "Gather Current Policies",
        description: "Collect all current privacy policies and related documentation",
        requiresApproval: false,
        requiresDocumentation: false,
      },
      {
        order: 2,
        title: "Review Regulatory Changes",
        description: "Review recent regulatory updates and identify required policy changes",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Draft Policy Updates",
        description: "Draft necessary updates to privacy policies based on regulatory review",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Legal Review",
        description: "Submit draft policies for legal counsel review and approval",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Publish Updated Policies",
        description: "Publish approved policies and notify all stakeholders of changes",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "1 month",
    priority: "medium",
    isDefault: true,
  },
  {
    name: "New Employee Onboarding",
    description: "Comprehensive compliance onboarding for new healthcare team members.",
    category: "Onboarding",
    steps: [
      {
        order: 1,
        title: "Complete Background Check",
        description: "Verify successful completion of background check and credentialing",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Sign Employment Agreements",
        description: "Review and sign all employment and confidentiality agreements",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Complete HIPAA Training",
        description: "Complete initial HIPAA training and certification",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Set Up System Access",
        description: "Configure appropriate system access and security credentials",
        requiresApproval: true,
        requiresDocumentation: false,
      },
      {
        order: 5,
        title: "Review Emergency Procedures",
        description: "Complete training on emergency and incident response procedures",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Finalize Onboarding",
        description: "Complete onboarding checklist and confirm all requirements met",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "1 week",
    priority: "high",
    isDefault: true,
  },
  {
    name: "Quarterly Audit Preparation",
    description: "Prepare documentation and processes for quarterly compliance audits.",
    category: "Audit",
    steps: [
      {
        order: 1,
        title: "Compile Documentation",
        description: "Gather all required documentation for audit review",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Self-Assessment Review",
        description: "Conduct internal self-assessment using audit checklist",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Address Findings",
        description: "Remediate any issues identified during self-assessment",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Management Review",
        description: "Management review and approval of audit preparation materials",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Schedule Audit",
        description: "Coordinate with auditors and schedule audit sessions",
        requiresApproval: true,
        requiresDocumentation: false,
      },
    ],
    estimatedDuration: "3 weeks",
    priority: "high",
    isDefault: true,
  },
  {
    name: "Incident Response Protocol",
    description: "Standard workflow for responding to and documenting compliance incidents or breaches.",
    category: "Incident",
    steps: [
      {
        order: 1,
        title: "Document Incident",
        description: "Record initial incident details and immediate actions taken",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Assess Impact",
        description: "Evaluate the scope and potential impact of the incident",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Notify Stakeholders",
        description: "Notify required internal stakeholders and management",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Containment Actions",
        description: "Implement immediate containment and mitigation measures",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Root Cause Analysis",
        description: "Conduct thorough root cause analysis of the incident",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Corrective Action Plan",
        description: "Develop and implement corrective action plan",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 7,
        title: "Close Incident",
        description: "Document final resolution and lessons learned",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "Varies",
    priority: "critical",
    isDefault: true,
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db.query("workflowTemplates").collect();
  },
});

export const get = query({
  args: { id: v.id("workflowTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(args.id);
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const templates = await ctx.db.query("workflowTemplates").collect();
    return templates.filter((t) => t.category === args.category);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const templates = await ctx.db.query("workflowTemplates").collect();
    const categories = [...new Set(templates.map((t) => t.category))];
    return categories;
  },
});

export const seedDefaultTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("workflowTemplates").first();
    if (existing) return;

    for (const template of defaultTemplates) {
      await ctx.db.insert("workflowTemplates", template);
    }
  },
});

export const createFromTemplate = mutation({
  args: {
    templateId: v.id("workflowTemplates"),
    workspaceId: v.id("workspaces"),
    name: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const workflowId = await ctx.db.insert("workflows", {
      workspaceId: args.workspaceId,
      templateId: args.templateId,
      name: args.name || template.name,
      description: template.description,
      status: "draft",
      progress: 0,
      dueDate: args.dueDate,
      assignedTo: args.assignedTo,
      createdBy: userId,
      createdAt: Date.now(),
    });

    for (const step of template.steps) {
      await ctx.db.insert("workflowSteps", {
        workflowId,
        order: step.order,
        title: step.title,
        description: step.description,
        status: "pending",
        requiresApproval: step.requiresApproval,
        requiresDocumentation: step.requiresDocumentation,
      });
    }

    return workflowId;
  },
});
