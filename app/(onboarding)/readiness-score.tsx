import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Button, Card, SubscriptionPopup } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useOnboardingStore } from '@/lib/store';
import { getScoreColor, getScoreLabel } from '@/lib/utils';
import { api } from '@/convex/_generated/api';
import { 
  TrendingUp, CheckCircle2, ListTodo, 
  Link2, Sparkles 
} from 'lucide-react-native';

export default function ReadinessScoreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ score: string; workspaceId: string }>();
  const { reset } = useOnboardingStore();
  const user = useQuery(api.users.getCurrentUser);
  
  const score = parseInt(params.score || '0', 10);
  const [animatedScore] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState(0);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(true);

  useEffect(() => {
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    return () => {
      animatedScore.removeAllListeners();
    };
  }, [score]);

  const handleGetStarted = () => {
    setShowSubscriptionPopup(true);
  };

  const handleSubscriptionComplete = () => {
    setShowSubscriptionPopup(false);
    reset();
    router.replace('/(tabs)');
  };

  const handleClosePopup = () => {
    setShowSubscriptionPopup(false);
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <SafeArea>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 7 of 7 - Complete!</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.subtitle}>Your Compliance</Text>
          <Text style={styles.title}>Readiness Score</Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {displayScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <TrendingUp size={16} color={scoreColor} />
            <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
              {scoreLabel}
            </Text>
          </View>
        </View>

        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Sparkles size={20} color={colors.primary[500]} />
            <Text style={styles.insightTitle}>Personalized for You</Text>
          </View>
          <Text style={styles.insightText}>
            Based on your assessment, we've created a personalized dashboard with 
            recommendations and workflows tailored to your team's needs.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Your Dashboard Includes</Text>
        
        <View style={styles.features}>
          <FeatureItem
            icon={<CheckCircle2 size={24} color={colors.success[500]} />}
            title="Readiness Score"
            description="Track your compliance progress over time"
          />
          <FeatureItem
            icon={<ListTodo size={24} color={colors.primary[500]} />}
            title="Smart Recommendations"
            description="Prioritized actions based on your goals"
          />
          <FeatureItem
            icon={<Link2 size={24} color={colors.warning[500]} />}
            title="Guided Workflows"
            description="Step-by-step compliance processes"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Go to Dashboard"
            onPress={handleGetStarted}
            fullWidth
            size="lg"
          />
        </View>

        <Text style={styles.footer}>
          You can always access settings and invite team members later.
        </Text>
      </ScrollView>

      <SubscriptionPopup
        visible={showSubscriptionPopup}
        onClose={handleClosePopup}
        onSubscriptionComplete={handleSubscriptionComplete}
        userEmail={user?.email}
      />
    </SafeArea>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={featureStyles.container}>
      <View style={featureStyles.icon}>{icon}</View>
      <View style={featureStyles.content}>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  progress: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.success[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.success[600],
    fontWeight: fontWeight.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
  },
  scoreMax: {
    fontSize: fontSize.lg,
    color: colors.gray[400],
    marginTop: -spacing.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  scoreBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  insightCard: {
    backgroundColor: colors.primary[50],
    marginBottom: spacing['2xl'],
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginLeft: spacing.sm,
  },
  insightText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  features: {
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

const featureStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
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
  },
});
