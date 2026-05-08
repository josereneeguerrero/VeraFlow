import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing } from '@/lib/constants';
import { Mail, CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would call a password reset mutation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSent(true);
    } catch (err: any) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeArea>
        <Header showBack title="Check Your Email" />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={colors.success[500]} />
          </View>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.successHint}>
            Check your inbox and follow the instructions to reset your password.
            If you don't see the email, check your spam folder.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            style={styles.backButton}
          />
          <Button
            title="Resend Email"
            onPress={() => {
              setSent(false);
              handleSendReset();
            }}
            variant="ghost"
            fullWidth
          />
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Header showBack title="Reset Password" />
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
            <Text style={styles.title}>Forgot Your Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Mail size={20} color={colors.gray[400]} />}
            />

            <Button
              title="Send Reset Link"
              onPress={handleSendReset}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <Button
              title="Back to Login"
              onPress={() => router.back()}
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
    marginBottom: spacing['3xl'],
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  successContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  successMessage: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emailHighlight: {
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  successHint: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  backButton: {
    marginBottom: spacing.md,
  },
});
