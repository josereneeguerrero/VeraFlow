import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, PriorityBadge, EmptyState } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { formatRelativeTime } from '@/lib/utils';
import { Lightbulb, ChevronRight, Clock, History } from 'lucide-react-native';

export default function RecommendationsScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);
  const recommendations = useQuery(
    api.recommendations.getActive,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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
            <History size={20} color={colors.gray[600]} />
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
                    onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Lightbulb size={48} color={colors.gray[300]} />}
            title="No recommendations"
            description="Great job! You've addressed all recommendations. Check back later for new insights."
          />
        )}
      </ScrollView>
    </SafeArea>
  );
}

function RecommendationCard({
  recommendation,
  onPress,
}: {
  recommendation: any;
  onPress: () => void;
}) {
  return (
    <Card style={cardStyles.container} onPress={onPress}>
      <View style={cardStyles.header}>
        <View style={cardStyles.icon}>
          <Lightbulb size={20} color={colors.primary[500]} />
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
          <Clock size={12} color={colors.gray[400]} />
          <Text style={cardStyles.timeText}>
            {formatRelativeTime(recommendation.createdAt)}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.gray[400]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
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
    color: colors.gray[900],
    flex: 1,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
});

const cardStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginLeft: spacing.xs,
  },
});
