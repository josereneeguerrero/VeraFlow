import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { useOnboardingStore } from '@/lib/store';
import { Building2 } from 'lucide-react-native';

export default function WorkspaceSetupScreen() {
  const router = useRouter();
  const { workspaceName, setWorkspaceName, setStep } = useOnboardingStore();
  const [name, setName] = useState(workspaceName);
  const [error, setError] = useState('');
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const handleContinue = () => {
    if (!name.trim()) {
      setError('Please enter a workspace name');
      return;
    }
    setWorkspaceName(name.trim());
    setStep(1);
    router.push('/(onboarding)/organization-details');
  };

  return (
    <SafeArea>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '14%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 7</Text>
          </View>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building2 size={32} color={colors.primary[500]} />
            </View>
            <Text style={styles.title}>Create Your Workspace</Text>
            <Text style={styles.subtitle}>
              Your workspace is where your team will collaborate on compliance workflows and track progress.
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="Workspace Name"
              placeholder="e.g., Acme Healthcare Team"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              error={error}
              hint="This can be your organization name or team name"
            />
          </Card>

          <View style={styles.actions}>
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
