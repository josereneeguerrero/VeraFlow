import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Button, StatusBadge, ProgressBar, EmptyState } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { Plus, ListChecks, ChevronRight, Filter } from 'lucide-react-native';

type FilterType = 'all' | 'active' | 'completed' | 'draft';

export default function WorkflowsScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);
  const workflows = useQuery(
    api.workflows.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredWorkflows = workflows?.filter((w) => {
    if (filter === 'all') return true;
    return w.status === filter;
  }) || [];

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'draft', label: 'Draft' },
  ];

  return (
    <SafeArea>
      <PageHeader
        title="Workflows"
        subtitle={`${workflows?.length || 0} total workflows`}
        action={
          <Button
            title="New"
            onPress={() => router.push('/(tabs)/workflows/create')}
            size="sm"
            icon={<Plus size={18} color={colors.white} />}
          />
        }
      />

      <View style={styles.filters}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredWorkflows.length > 0 ? (
          filteredWorkflows.map((workflow: any) => (
            <Card
              key={workflow._id}
              style={styles.workflowCard}
              onPress={() => router.push(`/(tabs)/workflows/${workflow._id}`)}
            >
              <View style={styles.workflowHeader}>
                <View style={styles.workflowIcon}>
                  <ListChecks size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.workflowInfo}>
                  <Text style={styles.workflowName}>{workflow.name}</Text>
                  <Text style={styles.workflowDescription} numberOfLines={1}>
                    {workflow.description}
                  </Text>
                </View>
                <StatusBadge status={workflow.status} />
              </View>

              <View style={styles.workflowProgress}>
                <ProgressBar value={workflow.progress} size="sm" />
                <Text style={styles.progressText}>{workflow.progress}% complete</Text>
              </View>

              <View style={styles.workflowFooter}>
                <Text style={styles.workflowMeta}>
                  Created {formatDate(workflow.createdAt)}
                </Text>
                {workflow.dueDate && (
                  <Text style={styles.workflowDue}>
                    Due {formatDate(workflow.dueDate)}
                  </Text>
                )}
                <ChevronRight size={16} color={colors.gray[400]} />
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<ListChecks size={48} color={colors.gray[300]} />}
            title={filter === 'all' ? "No workflows yet" : `No ${filter} workflows`}
            description={filter === 'all' 
              ? "Create your first workflow to start tracking compliance"
              : `You don't have any ${filter} workflows`
            }
            actionLabel="Create Workflow"
            onAction={() => router.push('/(tabs)/workflows/create')}
          />
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  filters: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  workflowCard: {
    marginBottom: spacing.md,
  },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  workflowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  workflowInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  workflowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  workflowDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  workflowProgress: {
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  workflowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workflowMeta: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    flex: 1,
  },
  workflowDue: {
    fontSize: fontSize.xs,
    color: colors.warning[600],
    marginRight: spacing.md,
  },
});
