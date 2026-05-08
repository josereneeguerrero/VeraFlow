import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Input, Divider } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { Mail, Lock, User } from 'lucide-react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createProfile = useMutation(api.users.createProfile);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingProfile, setPendingProfile] = useState<{ name: string; email: string } | null>(null);

  const handleSignUp = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signIn('password', {
        email,
        password,
        flow: 'signUp',
      });
      setPendingProfile({ name, email });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!pendingProfile || loading || isLoading || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    const finalizeSignUp = async () => {
      try {
        await createProfile(pendingProfile);
        if (!cancelled) {
          setPendingProfile(null);
          router.replace('/(onboarding)/workspace-setup');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to create account. Please try again.');
          setPendingProfile(null);
        }
      }
    };

    void finalizeSignUp();

    return () => {
      cancelled = true;
    };
  }, [createProfile, isAuthenticated, isLoading, loading, pendingProfile, router]);

  return (
    <SafeArea>
      <Header showBack title="Create Account" />
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
            <Text style={styles.title}>Welcome to VeraFlow</Text>
            <Text style={styles.subtitle}>
              Create your account to start improving your team's compliance
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={<User size={20} color={colors.gray[400]} />}
            />

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.gray[400]} />}
              hint="At least 8 characters"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={colors.gray[400]} />}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <Divider label="or" />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Button
              title="Log In"
              onPress={() => router.push('/(auth)/login')}
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
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
});
