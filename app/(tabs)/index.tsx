import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Card, Button, Avatar, Badge, ProgressBar, AccountDropdown, OfflineBanner } from '@/components/ui';
import { useOnboardingTour, TourTriggerButton } from '@/components/ui/OnboardingTour';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatRelativeTime, getScoreColor } from '@/lib/utils';
import { 
  Bell, ChevronRight, AlertCircle, CheckCircle,
  Clock, ArrowUpRight, Sparkles, Search, HelpCircle
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const quickStyles = createQuickStyles(colors);
  const { startTour, isActive } = useOnboardingTour();
  
  const user = useQuery(api.users.getCurrentUser);
  const workspace = useQuery(api.workspaces.getCurrent);
  const recommendations = useQuery(
    api.recommendations.getActive,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const pendingApprovals = useQuery(
    api.workflowSteps.getPendingApprovals,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const activities = useQuery(
    api.activity.list,
    workspace ? { workspaceId: workspace._id, limit: 5 } : 'skip'
  );

  const [refreshing, setRefreshing] = React.useState(false);
  const [tourShown, setTourShown] = React.useState(false);

  useEffect(() => {
    if (user && !user.onboardingCompleted && !tourShown && !isActive) {
      setTourShown(true);
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, tourShown, isActive, startTour]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const urgentTasks = pendingApprovals?.slice(0, 3) || [];
  const topRecommendations = recommendations?.slice(0, 3) || [];
  const recentActivity = activities?.slice(0, 4) || [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{user?.name || 'there'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Search size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color={colors.text.primary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <AccountDropdown size="md" />
          </View>
        </View>

        {/* Readiness Score Card */}
        <Card style={styles.scoreCard} variant="elevated">
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Compliance Readiness</Text>
            <TouchableOpacity 
              style={styles.viewMore}
              onPress={() => router.push('/(tabs)/dashboard')}
            >
              <Text style={styles.viewMoreText}>View Details</Text>
              <ArrowUpRight size={16} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.scoreContent}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: getScoreColor(workspace?.readinessScore || 0) }]}>
                {workspace?.readinessScore || 0}
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <ProgressBar 
                value={workspace?.readinessScore || 0} 
                size="lg"
                style={styles.progressBar}
              />
              <Text style={styles.scoreMessage}>
                {(workspace?.readinessScore || 0) >= 70
                  ? "You're on track! Keep up the good work."
                  : "Let's improve your compliance score together."}
              </Text>
            </View>
          </View>
        </Card>

        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <AlertCircle size={20} color={colors.warning[500]} />
                <Text style={styles.sectionTitle}>Needs Your Attention</Text>
              </View>
              <Badge label={`${pendingApprovals?.length || 0}`} variant="warning" />
            </View>
            {urgentTasks.map((task: any) => (
              <Card
                key={task._id}
                style={styles.taskCard}
                onPress={() => router.push(`/(tabs)/workflows/${task.workflowId}`)}
              >
                <View style={styles.taskContent}>
                  <View style={styles.taskIcon}>
                    <Clock size={20} color={colors.warning[500]} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSubtitle}>
                      {task.workflow?.name} • Awaiting approval
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.text.tertiary} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {topRecommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color={colors.primary[500]} />
                <Text style={styles.sectionTitle}>Recommended Actions</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recommendations')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {topRecommendations.map((rec: any) => (
              <Card
                key={rec._id}
                style={styles.recCard}
                onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
              >
                <View style={styles.recPriority}>
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: rec.priority === 'critical' ? colors.error[500] 
                      : rec.priority === 'high' ? colors.warning[500] 
                      : colors.primary[500] }
                  ]} />
                </View>
                <View style={styles.recContent}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDescription} numberOfLines={1}>
                    {rec.description}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.text.tertiary} />
              </Card>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleSimple}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={quickStyles.container} 
              onPress={() => router.push('/(tabs)/workflows/create')}
            >
              <View style={quickStyles.icon}>
                <CheckCircle size={24} color={colors.success[500]} />
              </View>
              <Text style={quickStyles.label}>New Workflow</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={quickStyles.container} 
              onPress={() => router.push('/(tabs)/recommendations')}
            >
              <View style={quickStyles.icon}>
                <Bell size={24} color={colors.primary[500]} />
              </View>
              <Text style={quickStyles.label}>View Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleSimple}>Recent Activity</Text>
            <Card style={styles.activityCard} padding="none">
              {recentActivity.map((activity: any, index: number) => (
                <View 
                  key={activity._id} 
                  style={[
                    styles.activityItem,
                    index < recentActivity.length - 1 && styles.activityItemBorder
                  ]}
                >
                  <Avatar name={activity.userName} size="sm" />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityName}>{activity.userName}</Text>
                      {' '}{activity.action.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatRelativeTime(activity.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
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
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error[500],
    borderWidth: 2,
    borderColor: colors.surface,
  },
  scoreCard: {
    marginBottom: spacing.xl,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    marginRight: spacing.xs,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  scoreValue: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  scoreInfo: {
    flex: 1,
  },
  progressBar: {
    marginBottom: spacing.sm,
  },
  scoreMessage: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  sectionTitleSimple: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.warning[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  taskSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recPriority: {
    marginRight: spacing.md,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  recDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  activityCard: {
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activityText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  activityName: {
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});

const createQuickStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
});
