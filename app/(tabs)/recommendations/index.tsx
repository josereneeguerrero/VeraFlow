import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useAction } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, PriorityBadge, EmptyState, Badge, Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatRelativeTime } from '@/lib/utils';
import { Lightbulb, ChevronRight, Clock, History, Sparkles, RefreshCw } from 'lucide-react-native';

export default function RecommendationsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const cardStyles = createCardStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const recommendations = useQuery(
    api.recommendations.getActive,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const generateRecommendations = useAction(api.ai.generateRecommendations);

  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleGenerateAI = async () => {
    if (!workspace) return;
    
    setGenerating(true);
    try {
      await generateRecommendations({ workspaceId: workspace._id });
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const criticalItems = recommendations?.filter(r => r.priority === 'critical') || [];
  const highItems = recommendations?.filter(r => r.priority === 'high') || [];
  const otherItems = recommendations?.filter(r => r.priority === 'medium' || r.priority === 'low') || [];

  return (
    <SafeArea>
      <PageHeader
        title="Recommendations"
        subtitle={`${recommendations?.length || 0} action items`}
        action={
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/(tabs)/recommendations/history')}
          >
            <History size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* AI Generation Card */}
        <Card style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Sparkles size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>AI-Powered Insights</Text>
              <Text style={styles.aiDescription}>
                Generate personalized recommendations based on your compliance data.
              </Text>
            </View>
          </View>
          <Button
            title={generating ? "Generating..." : "Generate New Recommendations"}
            onPress={handleGenerateAI}
            loading={generating}
            variant="primary"
            fullWidth
            icon={<RefreshCw size={18} color="#FFFFFF" />}
          />
        </Card>

        {recommendations && recommendations.length > 0 ? (
          <>
            {criticalItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.priorityIndicator, { backgroundColor: colors.error[500] }]} />
                  <Text style={styles.sectionTitle}>Critical</Text>
                  <Text style={styles.sectionCount}>{criticalItems.length}</Text>
                </View>
                {criticalItems.map((rec: any) => (
                  <RecommendationCard
                    key={rec._id}
                    recommendation={rec}
                    colors={colors}
                    cardStyles={cardStyles}
                    onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
                  />
                ))}
              </View>
            )}

            {highItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.priorityIndicator, { backgroundColor: colors.warning[500] }]} />
                  <Text style={styles.sectionTitle}>High Priority</Text>
                  <Text style={styles.sectionCount}>{highItems.length}</Text>
                </View>
                {highItems.map((rec: any) => (
                  <RecommendationCard
                    key={rec._id}
                    recommendation={rec}
                    colors={colors}
                    cardStyles={cardStyles}
                    onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
                  />
                ))}
              </View>
            )}

            {otherItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.priorityIndicator, { backgroundColor: colors.primary[500] }]} />
                  <Text style={styles.sectionTitle}>Other</Text>
                  <Text style={styles.sectionCount}>{otherItems.length}</Text>
                </View>
                {otherItems.map((rec: any) => (
                  <RecommendationCard
                    key={rec._id}
                    recommendation={rec}
                    colors={colors}
                    cardStyles={cardStyles}
                    onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Lightbulb size={48} color={colors.text.tertiary} />}
            title="No recommendations"
            description="Great job! You've addressed all recommendations. Use AI to generate new insights."
          />
        )}
      </ScrollView>
    </SafeArea>
  );
}

function RecommendationCard({
  recommendation,
  colors,
  cardStyles,
  onPress,
}: {
  recommendation: any;
  colors: ThemeColors;
  cardStyles: any;
  onPress: () => void;
}) {
  return (
    <Card style={cardStyles.container} onPress={onPress}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconRow}>
          <View style={cardStyles.icon}>
            <Lightbulb size={20} color={colors.primary[500]} />
          </View>
          {recommendation.aiGenerated && (
            <View style={cardStyles.aiBadge}>
              <Sparkles size={12} color={colors.primary[500]} />
              <Text style={cardStyles.aiBadgeText}>AI</Text>
            </View>
          )}
        </View>
        <PriorityBadge priority={recommendation.priority} />
      </View>
      
      <Text style={cardStyles.title}>{recommendation.title}</Text>
      <Text style={cardStyles.description} numberOfLines={2}>
        {recommendation.description}
      </Text>
      
      <View style={cardStyles.footer}>
        <View style={cardStyles.category}>
          <Text style={cardStyles.categoryText}>{recommendation.category}</Text>
        </View>
        <View style={cardStyles.time}>
          <Clock size={12} color={colors.text.tertiary} />
          <Text style={cardStyles.timeText}>
            {formatRelativeTime(recommendation.generatedAt || recommendation.createdAt || Date.now())}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.text.tertiary} />
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  aiCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  aiDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priorityIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});

const createCardStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  aiBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
    marginLeft: 4,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
});
