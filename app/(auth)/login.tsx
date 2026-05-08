import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Input, Divider } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingMfa, setCheckingMfa] = useState(false);

  const mfaStatus = useQuery(
    api.mfa.checkMfaRequired,
    isAuthenticated && checkingMfa ? {} : 'skip'
  );

  useEffect(() => {
    if (checkingMfa && mfaStatus) {
      if (mfaStatus.required) {
        router.replace('/(auth)/mfa-verify');
      } else {
        router.replace('/(tabs)');
      }
      setCheckingMfa(false);
    }
  }, [mfaStatus, checkingMfa]);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await signIn('password', {
        email,
        password,
        flow: 'signIn',
      });
      setCheckingMfa(true);
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeArea>
      <Header showBack title="Log In" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Log in to continue managing your compliance workflows
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Mail size={20} color={colors.text.tertiary} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.text.tertiary} />}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <Divider label="or" />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              title="Create Account"
              onPress={() => router.push('/(auth)/sign-up')}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: isDark ? colors.error[900] : colors.error[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: isDark ? colors.error[700] : colors.error[200],
  },
  errorText: {
    color: isDark ? colors.error[100] : colors.error[700],
    fontSize: fontSize.sm,
  },
  form: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
