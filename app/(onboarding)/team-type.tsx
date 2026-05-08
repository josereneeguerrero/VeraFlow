import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { useOnboardingStore } from '@/lib/store';
import { Stethoscope, Briefcase, Users, Check } from 'lucide-react-native';

const teamTypes = [
  {
    id: 'clinical',
    title: 'Clinical Team',
    description: 'Doctors, nurses, and healthcare providers',
    icon: Stethoscope,
  },
  {
    id: 'administrative',
    title: 'Administrative Team',
    description: 'Office staff, billing, and operations',
    icon: Briefcase,
  },
  {
    id: 'mixed',
    title: 'Mixed Team',
    description: 'Both clinical and administrative staff',
    icon: Users,
  },
];

export default function TeamTypeScreen() {
  const router = useRouter();
  const { teamType, setTeamType, setStep } = useOnboardingStore();
  const [selected, setSelected] = useState(teamType);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const handleContinue = () => {
    if (!selected) return;
    setTeamType(selected);
    setStep(3);
    router.push('/(onboarding)/goals');
  };

  return (
    <SafeArea>
      <Header showBack title="Team Type" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '42%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 7</Text>
        </View>

        <Text style={styles.title}>What type of team is this?</Text>
        <Text style={styles.subtitle}>
          This helps us tailor workflows and recommendations to your specific needs.
        </Text>

        <View style={styles.options}>
          {teamTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.id;
            
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelected(type.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}>
                  <Icon size={28} color={isSelected ? colors.primary[500] : colors.text.tertiary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    isSelected && styles.optionTitleSelected,
                  ]}>
                    {type.title}
                  </Text>
                  <Text style={styles.optionDescription}>{type.description}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={20} color={colors.primary[500]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selected}
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
    flexGrow: 1,
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
    marginBottom: spacing.xl,
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
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
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
  checkIcon: {
    marginLeft: spacing.md,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
