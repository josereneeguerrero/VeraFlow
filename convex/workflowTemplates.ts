import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const defaultTemplates = [
  {
    name: "HIPAA Security Risk Assessment",
    description: "Annual security risk assessment required by HIPAA Security Rule §164.308(a)(1)(ii)(A). Identifies vulnerabilities and threats to ePHI.",
    category: "HIPAA Security",
    steps: [
      {
        order: 1,
        title: "Identify ePHI Assets",
        description: "Document all systems, applications, and devices that create, receive, maintain, or transmit ePHI",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Identify Threats & Vulnerabilities",
        description: "Assess potential threats (natural, human, environmental) and system vulnerabilities that could impact ePHI",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Evaluate Current Controls",
        description: "Review existing administrative, physical, and technical safeguards in place",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Determine Risk Levels",
        description: "Calculate risk levels based on likelihood of threat occurrence and potential impact",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Develop Risk Management Plan",
        description: "Create prioritized action plan to address identified risks with timelines and responsibilities",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Leadership Sign-Off",
        description: "Obtain executive leadership approval on risk assessment findings and remediation plan",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "4 weeks",
    priority: "critical",
    isDefault: true,
  },
  {
    name: "Business Associate Agreement (BAA) Management",
    description: "Manage BAAs with vendors who handle PHI as required by HIPAA §164.502(e) and §164.504(e).",
    category: "HIPAA Privacy",
    steps: [
      {
        order: 1,
        title: "Identify Business Associates",
        description: "Inventory all vendors, contractors, and third parties who access, process, or store PHI on your behalf",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Review Existing BAAs",
        description: "Audit current BAAs for completeness, ensure they include required HIPAA provisions",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Draft/Update BAA",
        description: "Create or update BAA using HIPAA-compliant template with required breach notification clauses",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Legal Review",
        description: "Have legal counsel review BAA terms and required HIPAA provisions",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Execute BAA",
        description: "Obtain signatures from both parties and maintain signed copy in compliance records",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Update BA Tracking",
        description: "Log BAA in Business Associate tracking system with renewal dates and contact information",
        requiresApproval: false,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "2 weeks",
    priority: "high",
    isDefault: true,
  },
  {
    name: "HIPAA Breach Notification",
    description: "72-hour breach notification workflow per HIPAA Breach Notification Rule §164.400-414. Required when unsecured PHI is compromised.",
    category: "HIPAA Breach",
    steps: [
      {
        order: 1,
        title: "Discover & Document Breach",
        description: "Record date of discovery, nature of breach, types of PHI involved, and number of individuals affected",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Perform Risk Assessment",
        description: "Conduct 4-factor risk assessment: nature of PHI, unauthorized person, PHI actually acquired/viewed, risk mitigation",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Determine Notification Requirements",
        description: "Determine if breach affects 500+ individuals (media notification) or requires HHS reporting timeline",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Notify Affected Individuals",
        description: "Send breach notification letters within 60 days describing breach, PHI types, steps taken, and protective actions",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Report to HHS",
        description: "Submit breach report to HHS Secretary via breach portal (immediate if 500+, annual log if under 500)",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Media Notification (if required)",
        description: "Notify prominent media outlets in affected states if breach affects 500+ residents",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 7,
        title: "Document Remediation",
        description: "Document all corrective actions taken to prevent future breaches and update policies",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "60 days max",
    priority: "critical",
    isDefault: true,
  },
  {
    name: "HIPAA Workforce Training",
    description: "Annual HIPAA training program per §164.308(a)(5) and §164.530(b). Ensures all workforce members understand PHI handling.",
    category: "HIPAA Training",
    steps: [
      {
        order: 1,
        title: "Review Training Content",
        description: "Update training materials with latest HIPAA regulations, organizational policies, and recent breach examples",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Assign Training Modules",
        description: "Assign role-appropriate HIPAA training covering Privacy Rule, Security Rule, and breach notification",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Complete Training Course",
        description: "Workforce members complete all assigned training modules (Privacy, Security, Breach Notification basics)",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Pass Knowledge Assessment",
        description: "Successfully complete knowledge assessment with minimum 80% score on HIPAA requirements",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Sign Confidentiality Agreement",
        description: "Sign annual confidentiality and acceptable use agreement acknowledging HIPAA responsibilities",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Update Training Records",
        description: "Document completion in training management system with dates and scores per §164.530(j) (6-year retention)",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "1 week",
    priority: "high",
    isDefault: true,
  },
  {
    name: "PHI Access Audit",
    description: "Regular audit of PHI access logs per HIPAA §164.312(b). Identifies unauthorized access and maintains audit controls.",
    category: "HIPAA Security",
    steps: [
      {
        order: 1,
        title: "Extract Access Logs",
        description: "Pull user access logs from all systems containing PHI (EHR, databases, file shares, cloud storage)",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Review Access Patterns",
        description: "Analyze access patterns for anomalies: after-hours access, bulk downloads, access to VIP records",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Verify Authorization",
        description: "Confirm each access was authorized based on job role, treatment relationship, or legitimate need",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Document Findings",
        description: "Document any suspicious access, policy violations, or unauthorized disclosures discovered",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Investigate Anomalies",
        description: "Conduct follow-up investigation on flagged access events with user interviews if needed",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Report & Remediate",
        description: "Report findings to Privacy Officer, implement corrective actions, and update audit report",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "1 week",
    priority: "medium",
    isDefault: true,
  },
  {
    name: "New Employee HIPAA Onboarding",
    description: "Comprehensive HIPAA compliance onboarding for new workforce members per §164.308(a)(3) and §164.530(b).",
    category: "HIPAA Onboarding",
    steps: [
      {
        order: 1,
        title: "Background Verification",
        description: "Complete background check and verify credentials before granting PHI access per workforce clearance procedures",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Sign Confidentiality Agreement",
        description: "Sign HIPAA confidentiality agreement and acceptable use policy before system access",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Complete Initial HIPAA Training",
        description: "Complete new hire HIPAA training covering Privacy Rule, Security Rule, and organizational policies",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Assign Minimum Necessary Access",
        description: "Provision system access based on job role following minimum necessary standard per §164.514(d)",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Review Incident Procedures",
        description: "Train on breach reporting procedures and how to report suspected privacy/security incidents",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Verify Understanding",
        description: "Confirm understanding of HIPAA responsibilities and complete knowledge verification quiz",
        requiresApproval: true,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "3 days",
    priority: "high",
    isDefault: true,
  },
  {
    name: "HIPAA Policy Review & Update",
    description: "Annual review and update of HIPAA policies and procedures per §164.316(b)(2)(iii). Ensures documentation is current.",
    category: "HIPAA Documentation",
    steps: [
      {
        order: 1,
        title: "Inventory Current Policies",
        description: "Compile list of all HIPAA-related policies (Privacy, Security, Breach, BAA, Sanctions, etc.)",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 2,
        title: "Review Regulatory Updates",
        description: "Review HHS guidance, OCR enforcement trends, and regulatory changes from the past year",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 3,
        title: "Identify Policy Gaps",
        description: "Compare current policies against HIPAA requirements and identify gaps or outdated provisions",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 4,
        title: "Draft Policy Updates",
        description: "Revise policies to address gaps, incorporate regulatory changes, and reflect operational updates",
        requiresApproval: false,
        requiresDocumentation: true,
      },
      {
        order: 5,
        title: "Legal & Compliance Review",
        description: "Submit updated policies for legal counsel and compliance officer review",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 6,
        title: "Leadership Approval",
        description: "Obtain executive approval on finalized policies before publication",
        requiresApproval: true,
        requiresDocumentation: true,
      },
      {
        order: 7,
        title: "Publish & Communicate",
        description: "Publish updated policies, retain prior versions, and communicate changes to workforce",
        requiresApproval: false,
        requiresDocumentation: true,
      },
    ],
    estimatedDuration: "3 weeks",
    priority: "medium",
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
