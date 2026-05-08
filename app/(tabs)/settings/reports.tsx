import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, ProgressBar, Badge } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { getScoreColor } from '@/lib/utils';
import { 
  FileText, TrendingUp, Users, AlertTriangle,
  Shield, Download, ChevronRight, CheckCircle, XCircle
} from 'lucide-react-native';

type ReportType = 'compliance' | 'workflows' | 'team' | 'documentation' | 'audit';

export default function ReportsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const statStyles = createStatStyles(colors);
  const workspace = useQuery(api.workspaces.getCurrent);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const complianceSummary = useQuery(
    api.reports.getComplianceSummary,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const workflowCompletion = useQuery(
    api.reports.getWorkflowCompletion,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const teamActivity = useQuery(
    api.reports.getTeamActivity,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const missingDocs = useQuery(
    api.reports.getMissingDocumentation,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const auditReadiness = useQuery(
    api.reports.getAuditReadiness,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const reports = [
    {
      id: 'compliance' as const,
      title: 'Compliance Summary',
      description: 'Overall compliance status and metrics',
      icon: Shield,
      color: colors.primary[500],
    },
    {
      id: 'workflows' as const,
      title: 'Workflow Completion',
      description: 'Progress on active workflows',
      icon: TrendingUp,
      color: colors.success[500],
    },
    {
      id: 'team' as const,
      title: 'Team Activity',
      description: 'Team member contributions',
      icon: Users,
      color: colors.warning[500],
    },
    {
      id: 'documentation' as const,
      title: 'Missing Documentation',
      description: 'Identify documentation gaps',
      icon: FileText,
      color: colors.error[500],
    },
    {
      id: 'audit' as const,
      title: 'Audit Readiness',
      description: 'Preparation checklist for audits',
      icon: AlertTriangle,
      color: colors.primary[500],
    },
  ];

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'compliance':
        return (
          <View style={styles.reportContent}>
            <View style={styles.scoreSection}>
              <Text style={[
                styles.bigScore, 
                { color: getScoreColor(complianceSummary?.readinessScore || 0) }
              ]}>
                {complianceSummary?.readinessScore || 0}
              </Text>
              <Text style={styles.scoreLabel}>Readiness Score</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatItem statStyles={statStyles} label="Active Workflows" value={complianceSummary?.activeWorkflows || 0} />
              <StatItem statStyles={statStyles} label="Completed" value={complianceSummary?.completedWorkflows || 0} />
              <StatItem statStyles={statStyles} label="Open Items" value={complianceSummary?.openRecommendations || 0} />
              <StatItem statStyles={statStyles} label="Critical" value={complianceSummary?.criticalItems || 0} color={colors.error[500]} />
            </View>
          </View>
        );

      case 'workflows':
        return (
              <View style={styles.reportContent}>
            {workflowCompletion?.map((workflow: any) => (
              <Card key={workflow._id} style={styles.workflowItem}>
                <Text style={styles.workflowName}>{workflow.name}</Text>
                <ProgressBar value={workflow.progress} size="sm" />
                <View style={styles.workflowMeta}>
                  <Text style={styles.workflowProgress}>{workflow.progress}%</Text>
                  <Text style={styles.workflowSteps}>
                    {workflow.completedSteps}/{workflow.totalSteps} steps
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        );

      case 'team':
        return (
          <View style={styles.reportContent}>
            {teamActivity?.map((member: any) => (
              <Card key={member.memberId} style={styles.teamItem}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <View style={styles.teamStats}>
                  <View style={styles.teamStat}>
                    <Text style={styles.teamStatValue}>{member.completedTasks}</Text>
                    <Text style={styles.teamStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.teamStat}>
                    <Text style={styles.teamStatValue}>{member.activityCount}</Text>
                    <Text style={styles.teamStatLabel}>Activities</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        );

      case 'documentation':
        return (
          <View style={styles.reportContent}>
            {missingDocs && missingDocs.length > 0 ? (
              missingDocs.map((doc: any) => (
                <Card key={doc.stepId} style={styles.docItem}>
                  <View style={styles.docIcon}>
                    <XCircle size={20} color={colors.error[500]} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{doc.stepTitle}</Text>
                    <Text style={styles.docWorkflow}>{doc.workflowName}</Text>
                  </View>
                  <Badge label={doc.stepStatus} variant="warning" size="sm" />
                </Card>
              ))
            ) : (
              <View style={styles.emptyReport}>
                <CheckCircle size={48} color={colors.success[500]} />
                <Text style={styles.emptyText}>All documentation complete!</Text>
              </View>
            )}
          </View>
        );

      case 'audit':
        return (
          <View style={styles.reportContent}>
            <View style={styles.auditScore}>
              <Text style={[
                styles.bigScore,
                { color: getScoreColor(auditReadiness?.score || 0) }
              ]}>
                {auditReadiness?.score || 0}%
              </Text>
              <Text style={styles.scoreLabel}>Audit Ready</Text>
            </View>
            {auditReadiness?.checklistItems?.map((item: any, index: number) => (
              <View key={index} style={styles.checklistItem}>
                {item.completed ? (
                  <CheckCircle size={20} color={colors.success[500]} />
                ) : (
                  <XCircle size={20} color={colors.text.tertiary} />
                )}
                <Text style={[
                  styles.checklistText,
                  item.completed && styles.checklistTextComplete
                ]}>
                  {item.item}
                </Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeArea>
      <Header showBack title="Reports" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {selectedReport ? (
          <>
            <TouchableOpacity 
              style={styles.backToReports}
              onPress={() => setSelectedReport(null)}
            >
              <Text style={styles.backText}>← Back to Reports</Text>
            </TouchableOpacity>
            
            <Text style={styles.reportTitle}>
              {reports.find(r => r.id === selectedReport)?.title}
            </Text>
            
            {renderReportContent()}
            
            <TouchableOpacity style={styles.exportButton}>
              <Download size={20} color={colors.primary[500]} />
              <Text style={styles.exportText}>Export Report</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Available Reports</Text>
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => setSelectedReport(report.id)}
                >
                  <View style={[styles.reportIcon, { backgroundColor: report.color + (isDark ? '33' : '20') }]}>
                    <Icon size={24} color={report.color} />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportName}>{report.title}</Text>
                    <Text style={styles.reportDescription}>{report.description}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.text.tertiary} />
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
}

function StatItem({
  label,
  value,
  color,
  statStyles,
}: {
  label: string;
  value: number;
  color?: string;
  statStyles: ReturnType<typeof createStatStyles>;
}) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, color && { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  reportDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  backToReports: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
  },
  reportTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  reportContent: {
    marginBottom: spacing.xl,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bigScore: {
    fontSize: 64,
    fontWeight: fontWeight.bold,
  },
  scoreLabel: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  workflowItem: {
    marginBottom: spacing.md,
  },
  workflowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  workflowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  workflowProgress: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  workflowSteps: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  teamItem: {
    marginBottom: spacing.md,
  },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  memberRole: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  teamStats: {
    flexDirection: 'row',
  },
  teamStat: {
    marginRight: spacing.xl,
  },
  teamStatValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  teamStatLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  docIcon: {
    marginRight: spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  docWorkflow: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  emptyReport: {
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  auditScore: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
    flex: 1,
  },
  checklistTextComplete: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
  },
  exportText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[500],
    marginLeft: spacing.sm,
  },
});

const createStatStyles = (colors: ThemeColors) => StyleSheet.create({
  item: {
    width: '50%',
    padding: spacing.md,
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
