import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Input, Divider } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      router.replace('/(tabs)');
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
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
              leftIcon={<Mail size={20} color={colors.gray[400]} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.gray[400]} />}
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

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error[700],
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
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
});
