import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, ProgressBar, Badge, StatusBadge, OfflineBanner } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { getScoreColor } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, 
  ListChecks, Users, FileText, ChevronRight
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const statStyles = createStatStyles(colors);
  const breakdownStyles = createBreakdownStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const complianceSummary = useQuery(
    api.reports.getComplianceSummary,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const complianceBreakdown = useQuery(
    api.reports.getComplianceBreakdown,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const teamMembersCount = useQuery(
    api.reports.getTeamMembersCount,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const complianceTrend = useQuery(
    api.reports.getComplianceTrend,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const workflows = useQuery(
    api.workflows.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const recommendations = useQuery(
    api.recommendations.getActive,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const score = complianceSummary?.readinessScore || 0;
  const scoreColor = getScoreColor(score);

  const activeWorkflows = workflows?.filter(w => w.status === 'active') || [];
  const completedWorkflows = workflows?.filter(w => w.status === 'completed') || [];
  const criticalRecommendations = recommendations?.filter(r => r.priority === 'critical') || [];

  const trendValue = complianceTrend?.trend || 0;
  const TrendIcon = trendValue > 0 ? TrendingUp : trendValue < 0 ? TrendingDown : Minus;
  const trendColor = trendValue > 0 ? colors.success[500] : trendValue < 0 ? colors.error[500] : colors.text.tertiary;

  return (
    <SafeArea>
      <OfflineBanner />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <PageHeader
          title="Dashboard"
          subtitle={workspace?.name || 'Your Workspace'}
        />

        {/* Main Score Card */}
        <Card style={styles.mainScoreCard} variant="elevated">
          <View style={styles.scoreSection}>
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {score}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreTitle}>Compliance Readiness</Text>
              <View style={styles.scoreTrend}>
                <TrendIcon size={16} color={trendColor} />
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {trendValue > 0 ? '+' : ''}{trendValue} from last week
                </Text>
              </View>
              <Text style={styles.scoreDescription}>
                {score >= 70
                  ? "Your team is performing well. Keep maintaining your compliance standards."
                  : "There's room for improvement. Follow the recommended actions below."}
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={statStyles.card}>
            <View style={[statStyles.iconContainer, { backgroundColor: colors.primary[500] + '15' }]}>
              <ListChecks size={20} color={colors.primary[500]} />
            </View>
            <Text style={statStyles.value}>{activeWorkflows.length}</Text>
            <Text style={statStyles.label}>Active Workflows</Text>
          </Card>
          <Card style={statStyles.card}>
            <View style={[statStyles.iconContainer, { backgroundColor: colors.success[500] + '15' }]}>
              <CheckCircle2 size={20} color={colors.success[500]} />
            </View>
            <Text style={statStyles.value}>{completedWorkflows.length}</Text>
            <Text style={statStyles.label}>Completed</Text>
          </Card>
          <Card style={statStyles.card}>
            <View style={[statStyles.iconContainer, { backgroundColor: colors.error[500] + '15' }]}>
              <AlertTriangle size={20} color={colors.error[500]} />
            </View>
            <Text style={statStyles.value}>{criticalRecommendations.length}</Text>
            <Text style={statStyles.label}>Critical Items</Text>
          </Card>
          <Card style={statStyles.card}>
            <View style={[statStyles.iconContainer, { backgroundColor: colors.warning[500] + '15' }]}>
              <Users size={20} color={colors.warning[500]} />
            </View>
            <Text style={statStyles.value}>{teamMembersCount ?? 0}</Text>
            <Text style={statStyles.label}>Team Members</Text>
          </Card>
        </View>

        {/* Critical Items Alert */}
        {criticalRecommendations.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={colors.error[500]} />
              <Text style={styles.alertTitle}>Critical Items Need Attention</Text>
            </View>
            <Text style={styles.alertText}>
              You have {criticalRecommendations.length} critical item{criticalRecommendations.length > 1 ? 's' : ''} that require immediate action.
            </Text>
            <View style={styles.alertAction}>
              <Text 
                style={styles.alertLink}
                onPress={() => router.push('/(tabs)/recommendations')}
              >
                Review Now
              </Text>
            </View>
          </Card>
        )}

        {/* Workflow Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workflow Progress</Text>
            <Text 
              style={styles.seeAll}
              onPress={() => router.push('/(tabs)/workflows')}
            >
              See All
            </Text>
          </View>
          
          {activeWorkflows.length > 0 ? (
            activeWorkflows.slice(0, 3).map((workflow: any) => (
              <Card
                key={workflow._id}
                style={styles.workflowCard}
                onPress={() => router.push(`/(tabs)/workflows/${workflow._id}`)}
              >
                <View style={styles.workflowHeader}>
                  <Text style={styles.workflowName}>{workflow.name}</Text>
                  <StatusBadge status={workflow.status} />
                </View>
                <ProgressBar 
                  value={workflow.progress} 
                  showLabel 
                  style={styles.workflowProgress}
                />
                <View style={styles.workflowFooter}>
                  <Text style={styles.workflowMeta}>
                    {workflow.progress}% complete
                  </Text>
                  <ChevronRight size={16} color={colors.text.tertiary} />
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active workflows</Text>
              <Text 
                style={styles.emptyAction}
                onPress={() => router.push('/(tabs)/workflows/create')}
              >
                Create your first workflow
              </Text>
            </Card>
          )}
        </View>

        {/* Compliance Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.lg }]}>
            Compliance Breakdown
          </Text>
          <Card style={styles.breakdownCard}>
            <View style={breakdownStyles.item}>
              <View style={breakdownStyles.header}>
                <FileText size={18} color={colors.primary[500]} />
                <Text style={breakdownStyles.label}>Documentation</Text>
                <Text style={breakdownStyles.value}>{complianceBreakdown?.documentation ?? 0}%</Text>
              </View>
              <ProgressBar value={complianceBreakdown?.documentation ?? 0} size="sm" />
            </View>
            <View style={breakdownStyles.item}>
              <View style={breakdownStyles.header}>
                <Users size={18} color={colors.warning[500]} />
                <Text style={breakdownStyles.label}>Training</Text>
                <Text style={breakdownStyles.value}>{complianceBreakdown?.training ?? 0}%</Text>
              </View>
              <ProgressBar value={complianceBreakdown?.training ?? 0} size="sm" />
            </View>
            <View style={[breakdownStyles.item, { marginBottom: 0 }]}>
              <View style={breakdownStyles.header}>
                <ListChecks size={18} color={colors.success[500]} />
                <Text style={breakdownStyles.label}>Processes</Text>
                <Text style={breakdownStyles.value}>{complianceBreakdown?.processes ?? 0}%</Text>
              </View>
              <ProgressBar value={complianceBreakdown?.processes ?? 0} size="sm" />
            </View>
          </Card>
        </View>

        {/* Recommended Next Action */}
        {recommendations && recommendations.length > 0 && (
          <Card 
            style={styles.nextActionCard}
            onPress={() => router.push(`/(tabs)/recommendations/${recommendations[0]._id}`)}
          >
            <View style={styles.nextActionHeader}>
              <Text style={styles.nextActionLabel}>Recommended Next Action</Text>
              <Badge 
                label={recommendations[0].priority} 
                variant={recommendations[0].priority === 'critical' ? 'error' : 'warning'} 
                size="sm"
              />
            </View>
            <Text style={styles.nextActionTitle}>{recommendations[0].title}</Text>
            <Text style={styles.nextActionDescription} numberOfLines={2}>
              {recommendations[0].description}
            </Text>
            <View style={styles.nextActionButton}>
              <Text style={styles.nextActionButtonText}>Take Action</Text>
              <ChevronRight size={16} color={colors.primary[500]} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  mainScoreCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  scoreValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  scoreLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trendText: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  scoreDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  alertCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.error[50],
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error[700],
    marginLeft: spacing.sm,
  },
  alertText: {
    fontSize: fontSize.sm,
    color: colors.error[600],
    marginBottom: spacing.md,
  },
  alertAction: {
    alignItems: 'flex-end',
  },
  alertLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.error[700],
    paddingVertical: 4,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
    paddingVertical: 4,
    lineHeight: 20,
  },
  workflowCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  workflowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  workflowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  workflowProgress: {
    marginBottom: spacing.md,
  },
  workflowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workflowMeta: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptyAction: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
  },
  breakdownCard: {
    marginHorizontal: spacing.lg,
  },
  nextActionCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
  },
  nextActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nextActionLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  nextActionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  nextActionDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  nextActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
  nextActionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[500],
    marginRight: spacing.xs,
  },
});

const createStatStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

const createBreakdownStyles = (colors: ThemeColors) => StyleSheet.create({
  item: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
});
