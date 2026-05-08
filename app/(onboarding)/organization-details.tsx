import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useOnboardingStore } from '@/lib/store';
import { Building, Users, MapPin, Check } from 'lucide-react-native';

const industries = [
  'Hospital / Health System',
  'Medical Practice',
  'Home Health Care',
  'Mental Health Services',
  'Dental Practice',
  'Pharmacy',
  'Laboratory',
  'Other Healthcare',
];

const teamSizes = [
  '1-5',
  '6-15',
  '16-50',
  '51-200',
  '200+',
];

export default function OrganizationDetailsScreen() {
  const router = useRouter();
  const { organizationDetails, setOrganizationDetails, setStep } = useOnboardingStore();
  
  const [industry, setIndustry] = useState(organizationDetails.industry);
  const [teamSize, setTeamSize] = useState(organizationDetails.teamSize);

  const handleContinue = () => {
    if (!industry || !teamSize) return;
    setOrganizationDetails({ industry, teamSize });
    setStep(2);
    router.push('/(onboarding)/team-type');
  };

  const isValid = industry && teamSize;

  return (
    <SafeArea>
      <Header showBack title="Organization Details" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '28%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 7</Text>
        </View>

        <Text style={styles.sectionTitle}>What type of organization?</Text>
        <View style={styles.optionsGrid}>
          {industries.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionCard,
                industry === item && styles.optionCardSelected,
              ]}
              onPress={() => setIndustry(item)}
              activeOpacity={0.7}
            >
              {industry === item && (
                <View style={styles.checkIcon}>
                  <Check size={16} color={colors.white} />
                </View>
              )}
              <Text
                style={[
                  styles.optionText,
                  industry === item && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
          How large is your team?
        </Text>
        <View style={styles.sizeOptionsRow}>
          {teamSizes.slice(0, 3).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeOption,
                teamSize === size && styles.sizeOptionSelected,
              ]}
              onPress={() => setTeamSize(size)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sizeText,
                  teamSize === size && styles.sizeTextSelected,
                ]}
              >
                {size}
              </Text>
              <Text style={styles.sizeLabel}>people</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sizeOptionsRow}>
          {teamSizes.slice(3).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeOption,
                styles.sizeOptionWide,
                teamSize === size && styles.sizeOptionSelected,
              ]}
              onPress={() => setTeamSize(size)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sizeText,
                  teamSize === size && styles.sizeTextSelected,
                ]}
              >
                {size}
              </Text>
              <Text style={styles.sizeLabel}>people</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  progress: {
    marginBottom: spacing['2xl'],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[100],
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
    color: colors.gray[500],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  sectionSpacing: {
    marginTop: spacing['2xl'],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  checkIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: fontWeight.medium,
  },
  optionTextSelected: {
    color: colors.primary[700],
  },
  sizeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sizeOption: {
    flex: 1,
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    minWidth: 80,
  },
  sizeOptionWide: {
    flex: 1,
    maxWidth: '48%',
  },
  sizeOptionSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  sizeText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
  },
  sizeTextSelected: {
    color: colors.primary[700],
  },
  sizeLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing['3xl'],
  },
});
