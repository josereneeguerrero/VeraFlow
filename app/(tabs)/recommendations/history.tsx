import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Badge, EmptyState } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, History } from 'lucide-react-native';

export default function RecommendationHistoryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const cardStyles = createCardStyles(colors);
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
                  <HistoryCard key={rec._id} recommendation={rec} cardStyles={cardStyles} />
                ))}
              </View>
            )}

            {dismissedItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <XCircle size={20} color={colors.text.tertiary} />
                  <Text style={styles.sectionTitle}>Dismissed</Text>
                  <Text style={styles.sectionCount}>{dismissedItems.length}</Text>
                </View>
                {dismissedItems.map((rec: any) => (
                  <HistoryCard key={rec._id} recommendation={rec} isDismissed cardStyles={cardStyles} />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<History size={48} color={colors.text.tertiary} />}
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
  cardStyles,
}: {
  recommendation: any;
  isDismissed?: boolean;
  cardStyles: ReturnType<typeof createCardStyles>;
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

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
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
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const createCardStyles = (colors: ThemeColors) => StyleSheet.create({
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
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  titleDismissed: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
});
