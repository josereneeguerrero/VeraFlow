import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Badge, EmptyState } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, History } from 'lucide-react-native';

export default function RecommendationHistoryScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);
  const history = useQuery(
    api.recommendations.getHistory,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const actedItems = history?.filter(r => r.status === 'acted') || [];
  const dismissedItems = history?.filter(r => r.status === 'dismissed') || [];

  return (
    <SafeArea>
      <Header showBack title="History" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {history && history.length > 0 ? (
          <>
            {actedItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CheckCircle size={20} color={colors.success[500]} />
                  <Text style={styles.sectionTitle}>Completed</Text>
                  <Text style={styles.sectionCount}>{actedItems.length}</Text>
                </View>
                {actedItems.map((rec: any) => (
                  <HistoryCard key={rec._id} recommendation={rec} />
                ))}
              </View>
            )}

            {dismissedItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <XCircle size={20} color={colors.gray[400]} />
                  <Text style={styles.sectionTitle}>Dismissed</Text>
                  <Text style={styles.sectionCount}>{dismissedItems.length}</Text>
                </View>
                {dismissedItems.map((rec: any) => (
                  <HistoryCard key={rec._id} recommendation={rec} isDismissed />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<History size={48} color={colors.gray[300]} />}
            title="No history yet"
            description="Completed and dismissed recommendations will appear here."
          />
        )}
      </ScrollView>
    </SafeArea>
  );
}

function HistoryCard({
  recommendation,
  isDismissed = false,
}: {
  recommendation: any;
  isDismissed?: boolean;
}) {
  return (
    <Card style={[cardStyles.container, isDismissed && cardStyles.dismissed]}>
      <View style={cardStyles.header}>
        <Text style={[cardStyles.title, isDismissed && cardStyles.titleDismissed]}>
          {recommendation.title}
        </Text>
        <Badge 
          label={isDismissed ? 'Dismissed' : 'Completed'} 
          variant={isDismissed ? 'default' : 'success'} 
          size="sm" 
        />
      </View>
      <Text style={cardStyles.category}>{recommendation.category}</Text>
      {recommendation.actedAt && (
        <Text style={cardStyles.date}>
          {isDismissed ? 'Dismissed' : 'Completed'} {formatDate(recommendation.actedAt)}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginLeft: spacing.sm,
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
  dismissed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1,
    marginRight: spacing.md,
  },
  titleDismissed: {
    textDecorationLine: 'line-through',
    color: colors.gray[500],
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
});
