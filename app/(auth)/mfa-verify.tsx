import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { ShieldCheck, Key } from 'lucide-react-native';

export default function MfaVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const verifyMfaCode = useMutation(api.mfa.verifyMfaCode);
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter a valid code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyMfaCode({ code: code.replace(/[\s-]/g, '') });
      
      if (result.success) {
        const returnTo = params.returnTo || '/(tabs)';
        router.replace(returnTo as any);
      }
    } catch (error: any) {
      Alert.alert('Invalid Code', error.message || 'Please check your code and try again');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeArea>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={48} color={colors.primary[500]} />
          </View>
          
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            {useBackupCode 
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </Text>

          <Card style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder={useBackupCode ? '0000-0000' : '000000'}
              placeholderTextColor={colors.text.tertiary}
              value={code}
              onChangeText={setCode}
              keyboardType={useBackupCode ? 'default' : 'number-pad'}
              maxLength={useBackupCode ? 9 : 6}
              textAlign="center"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Verify"
              onPress={handleVerify}
              loading={loading}
              fullWidth
              disabled={code.length < 6}
            />
          </Card>

          <View style={styles.footer}>
            <Button
              title={useBackupCode ? 'Use authenticator app' : 'Use a backup code'}
              variant="ghost"
              onPress={() => {
                setUseBackupCode(!useBackupCode);
                setCode('');
              }}
              icon={<Key size={16} color={colors.primary[500]} />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  card: {
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 8,
    marginBottom: spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
});
