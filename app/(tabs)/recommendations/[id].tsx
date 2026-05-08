import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, PriorityBadge } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { formatDate } from '@/lib/utils';
import { 
  Lightbulb, AlertTriangle, ArrowRight, 
  CheckCircle, XCircle 
} from 'lucide-react-native';

export default function RecommendationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const recommendation = useQuery(api.recommendations.get, { id: id as Id<"recommendations"> });
  const markViewed = useMutation(api.recommendations.markViewed);
  const markActed = useMutation(api.recommendations.markActed);
  const dismiss = useMutation(api.recommendations.dismiss);

  useEffect(() => {
    if (recommendation && recommendation.status === 'new') {
      markViewed({ id: recommendation._id });
    }
  }, [recommendation]);

  if (!recommendation) {
    return (
      <SafeArea>
        <Header showBack title="Recommendation" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

  const handleTakeAction = async () => {
    await markActed({ id: recommendation._id });
    if (recommendation.relatedWorkflowId) {
      router.push(`/(tabs)/workflows/${recommendation.relatedWorkflowId}`);
    } else {
      router.back();
    }
  };

  const handleDismiss = async () => {
    await dismiss({ id: recommendation._id });
    router.back();
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical': return colors.error[500];
      case 'high': return colors.warning[500];
      case 'medium': return colors.primary[500];
      default: return colors.text.tertiary;
    }
  };

  return (
    <SafeArea>
      <Header showBack title="Recommendation" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.mainCard}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: getPriorityColor() + '20' }]}>
              <Lightbulb size={24} color={getPriorityColor()} />
            </View>
            <PriorityBadge priority={recommendation.priority} />
          </View>

          <Text style={styles.title}>{recommendation.title}</Text>
          <Text style={styles.description}>{recommendation.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.category}>
              <Text style={styles.categoryText}>{recommendation.category}</Text>
            </View>
            <Text style={styles.date}>
              Added {formatDate(recommendation.createdAt)}
            </Text>
          </View>
        </Card>

        {/* Why This Matters */}
        <Card style={styles.whyCard}>
          <View style={styles.whyHeader}>
            <AlertTriangle size={20} color={colors.warning[500]} />
            <Text style={styles.whyTitle}>Why This Matters</Text>
          </View>
          <Text style={styles.whyText}>
            Addressing this recommendation will help improve your overall compliance 
            score and reduce risk exposure. Organizations that proactively handle 
            {recommendation.priority === 'critical' ? ' critical ' : ' '}
            issues see 40% fewer compliance violations.
          </Text>
        </Card>

        {/* Suggested Action */}
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Suggested Action</Text>
          <View style={styles.actionContent}>
            <ArrowRight size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>{recommendation.suggestedAction}</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Take Action"
            onPress={handleTakeAction}
            fullWidth
            size="lg"
            icon={<CheckCircle size={20} color="#FFFFFF" />}
          />
          <Button
            title="Dismiss"
            onPress={handleDismiss}
            variant="ghost"
            fullWidth
            style={styles.dismissButton}
            icon={<XCircle size={20} color={colors.text.secondary} />}
          />
        </View>

        <Text style={styles.disclaimer}>
          Dismissing this recommendation will move it to your history. 
          You can always review dismissed items later.
        </Text>
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  mainCard: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  whyCard: {
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  whyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.warning[700],
    marginLeft: spacing.sm,
  },
  whyText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  actionCard: {
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  actionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginBottom: spacing.md,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
    fontWeight: fontWeight.medium,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  dismissButton: {
    marginTop: spacing.md,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
