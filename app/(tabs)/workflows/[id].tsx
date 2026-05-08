import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, StatusBadge, ProgressBar, Avatar, Badge } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatDate } from '@/lib/utils';
import { 
  CheckCircle, Circle, Clock, FileText, 
  User, ChevronRight, MoreVertical, Play, Pause
} from 'lucide-react-native';

export default function WorkflowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workflow = useQuery(api.workflows.get, { id: id as Id<"workflows"> });
  const updateStatus = useMutation(api.workflows.updateStatus);

  if (!workflow) {
    return (
      <SafeArea>
        <Header showBack title="Workflow" />
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

  const completedSteps = workflow.steps?.filter(s => s.status === 'completed').length || 0;
  const totalSteps = workflow.steps?.length || 0;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color={colors.success[500]} />;
      case 'in_progress':
        return <Clock size={20} color={colors.primary[500]} />;
      case 'awaiting_approval':
        return <Clock size={20} color={colors.warning[500]} />;
      default:
        return <Circle size={20} color={colors.gray[300]} />;
    }
  };

  const handlePauseResume = async () => {
    const newStatus = workflow.status === 'paused' ? 'active' : 'paused';
    await updateStatus({ id: workflow._id, status: newStatus });
  };

  return (
    <SafeArea>
      <Header 
        showBack 
        title="Workflow"
        rightAction={
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <StatusBadge status={workflow.status} />
            {workflow.dueDate && (
              <Text style={styles.dueDate}>Due {formatDate(workflow.dueDate)}</Text>
            )}
          </View>
          
          <Text style={styles.workflowName}>{workflow.name}</Text>
          <Text style={styles.workflowDescription}>{workflow.description}</Text>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{workflow.progress}%</Text>
            </View>
            <ProgressBar value={workflow.progress} size="md" />
            <Text style={styles.stepsCount}>
              {completedSteps} of {totalSteps} steps completed
            </Text>
          </View>

          {workflow.status === 'active' && (
            <View style={styles.actions}>
              <Button
                title={workflow.status === 'paused' ? 'Resume' : 'Pause'}
                onPress={handlePauseResume}
                variant="outline"
                icon={workflow.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                style={styles.actionButton}
              />
            </View>
          )}
        </Card>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          
          {workflow.steps?.map((step: any, index: number) => (
            <Card
              key={step._id}
              style={[
                styles.stepCard,
                step.status === 'in_progress' && styles.stepCardActive,
              ]}
              onPress={() => router.push(`/(tabs)/workflows/${id}/step/${step._id}`)}
            >
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {getStepIcon(step.status)}
              </View>
              
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription} numberOfLines={2}>
                  {step.description}
                </Text>
                
                <View style={styles.stepMeta}>
                  {step.assignedTo && (
                    <View style={styles.assignee}>
                      <Avatar size="sm" />
                      <Text style={styles.assigneeName}>Assigned</Text>
                    </View>
                  )}
                  {step.requiresDocumentation && (
                    <View style={styles.requirement}>
                      <FileText size={14} color={colors.gray[400]} />
                      <Text style={styles.requirementText}>Docs required</Text>
                    </View>
                  )}
                  {step.requiresApproval && (
                    <Badge label="Needs Approval" variant="warning" size="sm" />
                  )}
                </View>
              </View>
              
              <ChevronRight size={20} color={colors.gray[400]} />
            </Card>
          ))}
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Card style={styles.infoCard}>
            <InfoRow label="Created" value={formatDate(workflow.createdAt)} />
            {workflow.completedAt && (
              <InfoRow label="Completed" value={formatDate(workflow.completedAt)} />
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeArea>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  moreButton: {
    padding: spacing.xs,
  },
  headerCard: {
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dueDate: {
    fontSize: fontSize.sm,
    color: colors.warning[600],
  },
  workflowName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  workflowDescription: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  progressSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
  },
  progressValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  stepsCount: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepCardActive: {
    borderColor: colors.primary[200],
    borderWidth: 1,
    backgroundColor: colors.primary[50],
  },
  stepHeader: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[600],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeName: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  infoCard: {
    padding: 0,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
});
