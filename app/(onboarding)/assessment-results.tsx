import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { useOnboardingStore } from '@/lib/store';
import { api } from '@/convex/_generated/api';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react-native';

export default function AssessmentResultsScreen() {
  const router = useRouter();
  const { 
    workspaceName, 
    organizationDetails, 
    teamType, 
    goals,
    assessmentResponses,
    setStep,
    reset 
  } = useOnboardingStore();
  
  const createWorkspace = useMutation(api.workspaces.create);
  const submitAssessment = useMutation(api.assessments.submit);
  const generateRecommendations = useMutation(api.recommendations.generateInitialRecommendations);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const colors = useThemeColors();
  const styles = createStyles(colors);
  useEffect(() => {
    setupWorkspace();
  }, []);

  const setupWorkspace = async () => {
    try {
      const wsId = await createWorkspace({
        name: workspaceName,
        industry: organizationDetails.industry,
        teamSize: organizationDetails.teamSize,
        teamType: teamType,
        goals: goals,
      });

      setWorkspaceId(wsId);

      const responses = Object.entries(assessmentResponses).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const result = await submitAssessment({
        workspaceId: wsId,
        responses,
      });

      setScore(result.score);

      await generateRecommendations({ workspaceId: wsId });

      await completeOnboarding({ workspaceId: wsId });

      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to setup workspace:', error);
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setStep(6);
    router.push({
      pathname: '/(onboarding)/readiness-score',
      params: { score: score.toString(), workspaceId: workspaceId || '' },
    });
  };

  if (loading) {
    return (
      <SafeArea>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Text style={styles.loadingEmoji}>⚙️</Text>
          </View>
          <Text style={styles.loadingTitle}>Setting up your workspace...</Text>
          <Text style={styles.loadingSubtitle}>
            We're analyzing your responses and generating personalized recommendations.
          </Text>
        </View>
      </SafeArea>
    );
  }

  const getScoreCategory = () => {
    if (score >= 80) return { label: 'Excellent', color: colors.success[500] };
    if (score >= 60) return { label: 'Good', color: colors.success[500] };
    if (score >= 40) return { label: 'Needs Improvement', color: colors.warning[500] };
    return { label: 'Critical', color: colors.error[500] };
  };

  const category = getScoreCategory();

  return (
    <SafeArea>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <Text style={styles.progressText}>Step 6 of 7</Text>
          </View>

          <View style={styles.header}>
            <View style={[styles.scoreCircle, { borderColor: category.color }]}>
              <Text style={[styles.scoreValue, { color: category.color }]}>{score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <Text style={styles.title}>Assessment Complete!</Text>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
          </View>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>What this means</Text>
            <Text style={styles.summaryText}>
              {score >= 60
                ? "Your team has a solid foundation for compliance. We've identified some areas to strengthen and created personalized workflows to help you improve."
                : "There's significant room for improvement in your compliance readiness. Don't worry - we've created a step-by-step plan to get you on track."}
            </Text>
          </Card>

          <Text style={styles.sectionTitle}>Your Workspace</Text>
          <Card style={styles.workspaceCard}>
            <Text style={styles.workspaceName}>{workspaceName}</Text>
            <View style={styles.workspaceDetails}>
              <Text style={styles.detailText}>{organizationDetails.industry}</Text>
              <Text style={styles.detailDivider}>•</Text>
              <Text style={styles.detailText}>{organizationDetails.teamSize} people</Text>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>What's Next</Text>
          <View style={styles.nextSteps}>
            <NextStepItem
              colors={colors}
              icon={<CheckCircle size={20} color={colors.success[500]} />}
              title="Review your readiness score"
              description="Understand your current compliance status"
            />
            <NextStepItem
              colors={colors}
              icon={<AlertCircle size={20} color={colors.warning[500]} />}
              title="Check recommendations"
              description="See personalized action items"
            />
            <NextStepItem
              colors={colors}
              icon={<ArrowRight size={20} color={colors.primary[500]} />}
              title="Start your first workflow"
              description="Begin improving compliance step by step"
            />
          </View>

          <View style={styles.actions}>
            <Button
              title="See Your Dashboard"
              onPress={handleContinue}
              fullWidth
              size="lg"
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeArea>
  );
}

function NextStepItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colors: ThemeColors;
}) {
  const styles = createStepStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  loadingEmoji: {
    fontSize: 40,
  },
  loadingTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  progress: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card.background,
    marginBottom: spacing.lg,
  },
  scoreValue: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  scoreLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  summaryCard: {
    marginBottom: spacing['2xl'],
  },
  summaryTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  workspaceCard: {
    marginBottom: spacing['2xl'],
  },
  workspaceName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  workspaceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  detailDivider: {
    marginHorizontal: spacing.sm,
    color: colors.text.tertiary,
  },
  nextSteps: {
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
});

const createStepStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
