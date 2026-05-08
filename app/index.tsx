import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth } from 'convex/react';
import { useQuery } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Shield, CheckCircle, BarChart3 } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser);
  const hasRedirected = useRef(false);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (isLoading || !isAuthenticated || hasRedirected.current) {
      return;
    }

    if (user?.onboardingCompleted) {
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } else if (user) {
      hasRedirected.current = true;
      router.replace('/(onboarding)/workspace-setup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <SafeArea>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield size={48} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>VeraFlow</Text>
          <Text style={styles.subtitle}>Healthcare Compliance Made Simple</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            colors={colors}
            icon={<CheckCircle size={24} color={colors.success[500]} />}
            title="Guided Workflows"
            description="Step-by-step compliance processes"
          />
          <FeatureItem
            colors={colors}
            icon={<BarChart3 size={24} color={colors.primary[500]} />}
            title="Real-time Dashboard"
            description="Track your compliance readiness"
          />
          <FeatureItem
            colors={colors}
            icon={<Shield size={24} color={colors.warning[500]} />}
            title="Smart Recommendations"
            description="AI-powered compliance insights"
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            fullWidth
            size="lg"
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            fullWidth
            style={styles.loginButton}
          />
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeArea>
  );
}

function FeatureItem({
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
  const styles = createFeatureStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing['3xl'],
  },
  actions: {
    marginTop: 'auto',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footer: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

const createFeatureStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  textContainer: {
    flex: 1,
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
  },
});
