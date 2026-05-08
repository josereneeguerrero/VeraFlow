import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatDate } from '@/lib/utils';
import { 
  FileText, CheckCircle, Clock, Archive, User, Calendar,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react-native';

export default function PolicyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const policy = useQuery(api.policies.get, { id: id as Id<"policies"> });
  const acknowledgments = useQuery(
    api.policies.getAcknowledgments,
    id ? { policyId: id as Id<"policies"> } : 'skip'
  );

  const submitForReview = useMutation(api.policies.submitForReview);
  const approve = useMutation(api.policies.approve);
  const archive = useMutation(api.policies.archive);
  const acknowledge = useMutation(api.policies.acknowledge);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAcknowledgments, setShowAcknowledgments] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  if (!policy) {
    return (
      <SafeArea>
        <PageHeader title="Policy" showBack />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

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

  const handleSubmitForReview = async () => {
    setLoading('submit');
    try {
      await submitForReview({ id: policy._id });
      Alert.alert('Success', 'Policy submitted for review');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async () => {
    Alert.alert(
      'Approve Policy',
      'Are you sure you want to approve this policy? It will become the official version.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setLoading('approve');
            try {
              await approve({ id: policy._id });
              Alert.alert('Success', 'Policy approved');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    Alert.alert(
      'Archive Policy',
      'Are you sure you want to archive this policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setLoading('archive');
            try {
              await archive({ id: policy._id });
              Alert.alert('Success', 'Policy archived');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAcknowledge = async () => {
    setLoading('acknowledge');
    try {
      await acknowledge({ policyId: policy._id });
      Alert.alert('Success', 'Policy acknowledged');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(null);
    }
  };

  const statusConfig = getStatusConfig(policy.status);
  const StatusIcon = statusConfig.icon;

  return (
    <SafeArea>
      <PageHeader title="Policy Details" showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Card */}
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <FileText size={32} color={colors.primary[500]} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.policyName}>{policy.name}</Text>
              <Text style={styles.policyCategory}>{policy.category}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Badge label={statusConfig.label} variant={statusConfig.variant} />
            <Text style={styles.version}>Version {policy.version}</Text>
          </View>

          <Text style={styles.description}>{policy.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <User size={16} color={colors.text.tertiary} />
              <Text style={styles.infoLabel}>Created by</Text>
              <Text style={styles.infoValue}>{policy.creatorName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Calendar size={16} color={colors.text.tertiary} />
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(policy.createdAt)}</Text>
            </View>
            {policy.effectiveDate && (
              <View style={styles.infoItem}>
                <CheckCircle size={16} color={colors.text.tertiary} />
                <Text style={styles.infoLabel}>Effective</Text>
                <Text style={styles.infoValue}>{formatDate(policy.effectiveDate)}</Text>
              </View>
            )}
            {policy.nextReviewDate && (
              <View style={styles.infoItem}>
                <Clock size={16} color={colors.text.tertiary} />
                <Text style={styles.infoLabel}>Next Review</Text>
                <Text style={styles.infoValue}>{formatDate(policy.nextReviewDate)}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Acknowledgment Alert */}
        {policy.status === 'approved' && !policy.hasUserAcknowledged && (
          <Card style={styles.acknowledgeCard}>
            <View style={styles.acknowledgeHeader}>
              <AlertTriangle size={20} color={colors.warning[500]} />
              <Text style={styles.acknowledgeTitle}>Acknowledgment Required</Text>
            </View>
            <Text style={styles.acknowledgeText}>
              Please review this policy and acknowledge that you have read and understood it.
            </Text>
            <Button
              title="I Acknowledge This Policy"
              onPress={handleAcknowledge}
              loading={loading === 'acknowledge'}
              fullWidth
            />
          </Card>
        )}

        {policy.hasUserAcknowledged && (
          <Card style={styles.acknowledgedCard}>
            <CheckCircle size={20} color={colors.success[500]} />
            <Text style={styles.acknowledgedText}>
              You acknowledged this policy on {formatDate(policy.userAcknowledgmentDate!)}
            </Text>
          </Card>
        )}

        {/* Policy Content */}
        {policy.content && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Policy Content</Text>
            <Text style={styles.policyContent}>{policy.content}</Text>
          </Card>
        )}

        {/* Version History */}
        {policy.versionHistory && policy.versionHistory.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowVersionHistory(!showVersionHistory)}
            >
              <Text style={styles.sectionTitle}>Version History</Text>
              {showVersionHistory ? (
                <ChevronUp size={20} color={colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={colors.text.secondary} />
              )}
            </TouchableOpacity>
            {showVersionHistory && (
              <View style={styles.versionList}>
                {policy.versionHistory.map((version: any) => (
                  <View key={version._id} style={styles.versionItem}>
                    <Text style={styles.versionNumber}>v{version.version}</Text>
                    <Text style={styles.versionDate}>{formatDate(version.createdAt)}</Text>
                    {version.changes && (
                      <Text style={styles.versionChanges}>{version.changes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Acknowledgments */}
        {acknowledgments && acknowledgments.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowAcknowledgments(!showAcknowledgments)}
            >
              <Text style={styles.sectionTitle}>
                Acknowledgments ({acknowledgments.length})
              </Text>
              {showAcknowledgments ? (
                <ChevronUp size={20} color={colors.text.secondary} />
              ) : (
                <ChevronDown size={20} color={colors.text.secondary} />
              )}
            </TouchableOpacity>
            {showAcknowledgments && (
              <View style={styles.ackList}>
                {acknowledgments.map((ack: any) => (
                  <View key={ack._id} style={styles.ackItem}>
                    <Text style={styles.ackName}>{ack.userName}</Text>
                    <Text style={styles.ackDate}>
                      v{ack.version} • {formatDate(ack.acknowledgedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {policy.status === 'draft' && (
            <>
              <Button
                title="Submit for Review"
                onPress={handleSubmitForReview}
                loading={loading === 'submit'}
                fullWidth
              />
              <Button
                title="Edit Policy"
                variant="outline"
                onPress={() => router.push(`/(tabs)/policies/edit/${policy._id}`)}
                fullWidth
                style={styles.actionButton}
              />
            </>
          )}

          {policy.status === 'pending_review' && (
            <Button
              title="Approve Policy"
              onPress={handleApprove}
              loading={loading === 'approve'}
              fullWidth
            />
          )}

          {policy.status !== 'archived' && (
            <Button
              title="Archive Policy"
              variant="ghost"
              onPress={handleArchive}
              loading={loading === 'archive'}
              fullWidth
              style={styles.actionButton}
              textStyle={{ color: colors.error[500] }}
            />
          )}
        </View>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
  },
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  policyName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  policyCategory: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  acknowledgeCard: {
    backgroundColor: colors.warning[500] + '15',
    borderWidth: 1,
    borderColor: colors.warning[500] + '30',
    marginBottom: spacing.lg,
  },
  acknowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  acknowledgeTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.warning[700],
    marginLeft: spacing.sm,
  },
  acknowledgeText: {
    fontSize: fontSize.sm,
    color: colors.warning[600],
    marginBottom: spacing.lg,
  },
  acknowledgedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500] + '15',
    marginBottom: spacing.lg,
  },
  acknowledgedText: {
    fontSize: fontSize.sm,
    color: colors.success[600],
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  policyContent: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionList: {
    marginTop: spacing.md,
  },
  versionItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  versionNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  versionDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  versionChanges: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  ackList: {
    marginTop: spacing.md,
  },
  ackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ackName: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  ackDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  actions: {
    marginTop: spacing.md,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
