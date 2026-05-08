import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { useOnboardingStore } from '@/lib/store';
import { 
  Shield, FileCheck, Users, Clock, 
  FileText, AlertTriangle, BookOpen, Check 
} from 'lucide-react-native';

const goalOptions = [
  {
    id: 'hipaa',
    title: 'HIPAA Compliance',
    description: 'Privacy and security standards',
    icon: Shield,
  },
  {
    id: 'documentation',
    title: 'Documentation Management',
    description: 'Organize and track required documents',
    icon: FileText,
  },
  {
    id: 'training',
    title: 'Staff Training',
    description: 'Track and verify team training',
    icon: BookOpen,
  },
  {
    id: 'audit',
    title: 'Audit Preparation',
    description: 'Be ready for compliance audits',
    icon: FileCheck,
  },
  {
    id: 'risk',
    title: 'Risk Management',
    description: 'Identify and mitigate risks',
    icon: AlertTriangle,
  },
  {
    id: 'team',
    title: 'Team Coordination',
    description: 'Improve team collaboration',
    icon: Users,
  },
  {
    id: 'efficiency',
    title: 'Process Efficiency',
    description: 'Streamline compliance workflows',
    icon: Clock,
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, setGoals, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(goals);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const toggleGoal = (goalId: string) => {
    setSelected((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    setGoals(selected);
    setStep(4);
    router.push('/(onboarding)/assessment');
  };

  return (
    <SafeArea>
      <Header showBack title="Goals" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '56%' }]} />
          </View>
          <Text style={styles.progressText}>Step 4 of 7</Text>
        </View>

        <Text style={styles.title}>What are your main goals?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. We'll prioritize recommendations based on your goals.
        </Text>

        <View style={styles.options}>
          {goalOptions.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selected.includes(goal.id);
            
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Icon size={24} color={isSelected ? colors.primary[500] : colors.text.tertiary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    isSelected && styles.optionTitleSelected,
                  ]}>
                    {goal.title}
                  </Text>
                  <Text style={styles.optionDescription}>{goal.description}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}>
                  {isSelected && <Check size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Text style={styles.selectedCount}>
            {selected.length} goal{selected.length !== 1 ? 's' : ''} selected
          </Text>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={selected.length === 0}
            fullWidth
            size="lg"
          />
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
  scrollContent: {
    padding: spacing.xl,
  },
  progress: {
    marginBottom: spacing['2xl'],
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
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
    lineHeight: 24,
  },
  options: {
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
    marginBottom: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary[100],
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionTitleSelected: {
    color: colors.primary[700],
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  actions: {
    marginTop: spacing.lg,
  },
  selectedCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
