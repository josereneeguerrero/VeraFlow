import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Badge, Button, ProgressBar } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { 
  GraduationCap, Clock, CheckCircle, AlertCircle, 
  ChevronRight, Plus, Award, BookOpen 
} from 'lucide-react-native';

export default function TrainingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const myAssignments = useQuery(api.trainings.getMyAssignments);
  const trainingStatus = useQuery(
    api.trainings.getUserTrainingStatus,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const stats = useQuery(
    api.trainings.getStats,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: colors.success[500], label: 'Completed', variant: 'success' as const };
      case 'in_progress':
        return { icon: Clock, color: colors.warning[500], label: 'In Progress', variant: 'warning' as const };
      case 'assigned':
        return { icon: BookOpen, color: colors.primary[500], label: 'Not Started', variant: 'primary' as const };
      case 'failed':
        return { icon: AlertCircle, color: colors.error[500], label: 'Failed', variant: 'error' as const };
      case 'expired':
        return { icon: AlertCircle, color: colors.gray[500], label: 'Expired', variant: 'default' as const };
      default:
        return { icon: BookOpen, color: colors.gray[500], label: status, variant: 'default' as const };
    }
  };

  const pendingAssignments = myAssignments?.filter(
    (a) => a.status === 'assigned' || a.status === 'in_progress'
  ) || [];
  const completedAssignments = myAssignments?.filter(
    (a) => a.status === 'completed'
  ) || [];
  const overdueAssignments = pendingAssignments.filter(
    (a) => a.dueDate && a.dueDate < Date.now()
  );

  return (
    <SafeArea>
      <PageHeader 
        title="Training" 
        rightAction={
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push('/(tabs)/training/manage')}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Overview */}
        {trainingStatus && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <GraduationCap size={24} color={colors.primary[500]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Your Training Progress</Text>
                <Text style={styles.statusSubtitle}>
                  {trainingStatus.completionRate}% Complete
                </Text>
              </View>
            </View>
            <ProgressBar value={trainingStatus.completionRate} style={styles.progressBar} />
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusNumber, { color: colors.success[500] }]}>
                  {trainingStatus.completed}
                </Text>
                <Text style={styles.statusLabel}>Completed</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusNumber, { color: colors.warning[500] }]}>
                  {trainingStatus.pending}
                </Text>
                <Text style={styles.statusLabel}>Pending</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusNumber, { color: colors.error[500] }]}>
                  {trainingStatus.overdue}
                </Text>
                <Text style={styles.statusLabel}>Overdue</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Overdue Alert */}
        {overdueAssignments.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertCircle size={20} color={colors.error[500]} />
              <Text style={styles.alertTitle}>
                {overdueAssignments.length} Overdue Training{overdueAssignments.length > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.alertText}>
              Complete these trainings as soon as possible to maintain compliance.
            </Text>
          </Card>
        )}

        {/* Pending Trainings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Training</Text>
          {pendingAssignments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CheckCircle size={48} color={colors.success[500]} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                You have no pending training assignments.
              </Text>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => {
              const statusConfig = getStatusConfig(assignment.status);
              const StatusIcon = statusConfig.icon;
              const isOverdue = assignment.dueDate && assignment.dueDate < Date.now();

              return (
                <TouchableOpacity
                  key={assignment._id}
                  onPress={() => router.push(`/(tabs)/training/${assignment._id}`)}
                >
                  <Card style={[styles.trainingCard, isOverdue && styles.overdueCard]}>
                    <View style={styles.trainingHeader}>
                      <View style={styles.trainingIcon}>
                        <GraduationCap size={24} color={colors.primary[500]} />
                      </View>
                      <View style={styles.trainingInfo}>
                        <Text style={styles.trainingName}>
                          {assignment.course?.name}
                        </Text>
                        <Text style={styles.trainingCategory}>
                          {assignment.course?.category}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.text.tertiary} />
                    </View>

                    <View style={styles.trainingMeta}>
                      <Badge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
                      <Text style={styles.trainingDuration}>
                        {assignment.course?.duration}
                      </Text>
                      {assignment.dueDate && (
                        <Text style={[
                          styles.trainingDue,
                          isOverdue && styles.overdueDue
                        ]}>
                          {isOverdue ? 'Overdue' : `Due ${formatDate(assignment.dueDate)}`}
                        </Text>
                      )}
                    </View>

                    {assignment.status !== 'assigned' && (
                      <View style={styles.trainingProgress}>
                        <Text style={styles.progressLabel}>
                          Attempt {assignment.attempts}
                        </Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Completed Trainings */}
        {completedAssignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedAssignments.slice(0, 5).map((assignment) => (
              <TouchableOpacity
                key={assignment._id}
                onPress={() => router.push(`/(tabs)/training/${assignment._id}`)}
              >
                <Card style={styles.completedCard}>
                  <View style={styles.completedHeader}>
                    <Award size={20} color={colors.success[500]} />
                    <View style={styles.completedInfo}>
                      <Text style={styles.completedName}>
                        {assignment.course?.name}
                      </Text>
                      <Text style={styles.completedDate}>
                        Completed {formatRelativeTime(assignment.completedAt!)}
                      </Text>
                    </View>
                    <Text style={styles.completedScore}>
                      {assignment.score}%
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  manageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  statusTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  statusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  progressBar: {
    marginBottom: spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  alertCard: {
    backgroundColor: colors.error[500] + '15',
    borderWidth: 1,
    borderColor: colors.error[500] + '30',
    marginBottom: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error[600],
    marginLeft: spacing.sm,
  },
  alertText: {
    fontSize: fontSize.sm,
    color: colors.error[600],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trainingCard: {
    marginBottom: spacing.md,
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: colors.error[500] + '50',
  },
  trainingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainingIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  trainingCategory: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  trainingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  trainingDuration: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  trainingDue: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  overdueDue: {
    color: colors.error[500],
    fontWeight: fontWeight.medium,
  },
  trainingProgress: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  completedCard: {
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  completedName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  completedDate: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  completedScore: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success[500],
  },
});
