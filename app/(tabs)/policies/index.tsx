import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, Archive, ChevronRight } from 'lucide-react-native';

export default function PoliciesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const policies = useQuery(
    api.policies.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const stats = useQuery(
    api.policies.getStats,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const pendingAcks = useQuery(
    api.policies.getPendingAcknowledgments,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: colors.success[500], label: 'Approved', variant: 'success' as const };
      case 'pending_review':
        return { icon: Clock, color: colors.warning[500], label: 'Pending Review', variant: 'warning' as const };
      case 'draft':
        return { icon: FileText, color: colors.gray[500], label: 'Draft', variant: 'default' as const };
      case 'archived':
        return { icon: Archive, color: colors.gray[400], label: 'Archived', variant: 'default' as const };
      default:
        return { icon: FileText, color: colors.gray[500], label: status, variant: 'default' as const };
    }
  };

  const activePolicies = policies?.filter(p => p.status !== 'archived') || [];
  const archivedPolicies = policies?.filter(p => p.status === 'archived') || [];

  return (
    <SafeArea>
      <PageHeader 
        title="Policies" 
        rightAction={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/policies/create')}
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
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPolicies}</Text>
              <Text style={styles.statLabel}>Total Policies</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.success[500] }]}>
                {stats.approvedPolicies}
              </Text>
              <Text style={styles.statLabel}>Approved</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.warning[500] }]}>
                {stats.needsReview}
              </Text>
              <Text style={styles.statLabel}>Needs Review</Text>
            </Card>
          </View>
        )}

        {/* Pending Acknowledgments */}
        {pendingAcks && pendingAcks.length > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={colors.warning[500]} />
              <Text style={styles.alertTitle}>
                {pendingAcks.length} Policy {pendingAcks.length === 1 ? 'Requires' : 'Require'} Your Acknowledgment
              </Text>
            </View>
            <Text style={styles.alertText}>
              Please review and acknowledge the following policies to maintain compliance.
            </Text>
            <Button
              title="Review Policies"
              variant="outline"
              size="sm"
              onPress={() => router.push(`/(tabs)/policies/${pendingAcks[0]._id}`)}
              style={styles.alertButton}
            />
          </Card>
        )}

        {/* Active Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Policies</Text>
          {activePolicies.length === 0 ? (
            <Card style={styles.emptyCard}>
              <FileText size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No policies yet</Text>
              <Text style={styles.emptyText}>
                Create your first policy document to get started with compliance management.
              </Text>
              <Button
                title="Create Policy"
                onPress={() => router.push('/(tabs)/policies/create')}
                style={styles.emptyButton}
              />
            </Card>
          ) : (
            activePolicies.map((policy) => {
              const statusConfig = getStatusConfig(policy.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <TouchableOpacity
                  key={policy._id}
                  onPress={() => router.push(`/(tabs)/policies/${policy._id}`)}
                >
                  <Card style={styles.policyCard}>
                    <View style={styles.policyHeader}>
                      <View style={styles.policyIcon}>
                        <FileText size={24} color={colors.primary[500]} />
                      </View>
                      <View style={styles.policyInfo}>
                        <Text style={styles.policyName}>{policy.name}</Text>
                        <Text style={styles.policyCategory}>{policy.category}</Text>
                      </View>
                      <ChevronRight size={20} color={colors.text.tertiary} />
                    </View>
                    
                    <View style={styles.policyMeta}>
                      <Badge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
                      <Text style={styles.policyVersion}>v{policy.version}</Text>
                      {policy.nextReviewDate && (
                        <Text style={styles.policyDate}>
                          Review: {formatDate(policy.nextReviewDate)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.policyFooter}>
                      <Text style={styles.acknowledgments}>
                        {policy.acknowledgmentCount} acknowledgment{policy.acknowledgmentCount !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.creator}>Created by {policy.creatorName}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Archived Policies */}
        {archivedPolicies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Archived</Text>
            {archivedPolicies.map((policy) => (
              <TouchableOpacity
                key={policy._id}
                onPress={() => router.push(`/(tabs)/policies/${policy._id}`)}
              >
                <Card style={[styles.policyCard, styles.archivedCard]}>
                  <View style={styles.policyHeader}>
                    <View style={[styles.policyIcon, styles.archivedIcon]}>
                      <Archive size={24} color={colors.text.tertiary} />
                    </View>
                    <View style={styles.policyInfo}>
                      <Text style={[styles.policyName, styles.archivedText]}>{policy.name}</Text>
                      <Text style={styles.policyCategory}>{policy.category}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.text.tertiary} />
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNumber: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  alertCard: {
    backgroundColor: colors.warning[500] + '15',
    borderWidth: 1,
    borderColor: colors.warning[500] + '30',
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
    color: colors.warning[700],
    marginLeft: spacing.sm,
  },
  alertText: {
    fontSize: fontSize.sm,
    color: colors.warning[600],
    marginBottom: spacing.md,
  },
  alertButton: {
    borderColor: colors.warning[500],
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
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    minWidth: 150,
  },
  policyCard: {
    marginBottom: spacing.md,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  policyInfo: {
    flex: 1,
  },
  policyName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  policyCategory: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  policyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  policyVersion: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  policyDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  policyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acknowledgments: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  creator: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  archivedCard: {
    opacity: 0.7,
  },
  archivedIcon: {
    backgroundColor: colors.gray[200],
  },
  archivedText: {
    color: colors.text.secondary,
  },
});
