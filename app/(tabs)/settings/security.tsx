import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Shield, ShieldCheck, ShieldOff, Key, Copy, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function SecurityScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const mfaStatus = useQuery(api.mfa.getMfaStatus);
  const setupMfa = useMutation(api.mfa.setupMfa);
  const verifyAndEnableMfa = useMutation(api.mfa.verifyAndEnableMfa);
  const disableMfa = useMutation(api.mfa.disableMfa);
  const regenerateBackupCodes = useMutation(api.mfa.regenerateBackupCodes);

  const [setupData, setSetupData] = useState<{
    secret: string;
    otpAuthUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);

  const handleSetupMfa = async () => {
    setLoading(true);
    try {
      const data = await setupMfa();
      setSetupData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyAndEnableMfa({ code: verificationCode });
      Alert.alert('Success', 'Two-factor authentication has been enabled');
      setSetupData(null);
      setVerificationCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disableCode || disableCode.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await disableMfa({ code: disableCode });
      Alert.alert('Success', 'Two-factor authentication has been disabled');
      setShowDisableForm(false);
      setDisableCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!regenerateCode || regenerateCode.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const result = await regenerateBackupCodes({ code: regenerateCode });
      setNewBackupCodes(result.backupCodes);
      setShowRegenerateForm(false);
      setRegenerateCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Copied to clipboard');
  };

  const copyAllBackupCodes = async (codes: string[]) => {
    await Clipboard.setStringAsync(codes.join('\n'));
    Alert.alert('Copied', 'All backup codes copied to clipboard');
  };

  if (!mfaStatus) {
    return (
      <SafeArea>
        <PageHeader title="Security" showBack />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <PageHeader title="Security" showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: mfaStatus.mfaEnabled ? colors.success[500] + '20' : colors.warning[500] + '20' }]}>
              {mfaStatus.mfaEnabled ? (
                <ShieldCheck size={24} color={colors.success[500]} />
              ) : (
                <Shield size={24} color={colors.warning[500]} />
              )}
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
              <Text style={styles.cardDescription}>
                {mfaStatus.mfaEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </Text>
            </View>
          </View>

          {!mfaStatus.mfaEnabled && !setupData && (
            <View style={styles.cardContent}>
              <Text style={styles.infoText}>
                Two-factor authentication adds an additional layer of security to your account by requiring a verification code from your authenticator app when signing in.
              </Text>
              <Text style={styles.infoText}>
                This is <Text style={styles.bold}>required for HIPAA compliance</Text> to protect sensitive healthcare data.
              </Text>
              <Button
                title="Enable Two-Factor Authentication"
                onPress={handleSetupMfa}
                loading={loading}
                fullWidth
                style={styles.button}
              />
            </View>
          )}

          {setupData && (
            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Step 1: Scan QR Code</Text>
              <Text style={styles.infoText}>
                Scan this code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </Text>
              
              <View style={styles.secretContainer}>
                <Text style={styles.secretLabel}>Manual Entry Key:</Text>
                <View style={styles.secretRow}>
                  <Text style={styles.secretText}>{setupData.secret}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(setupData.secret)}>
                    <Copy size={20} color={colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Step 2: Save Backup Codes</Text>
              <Text style={styles.infoText}>
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </Text>
              
              <View style={styles.backupCodesContainer}>
                {setupData.backupCodes.map((code, index) => (
                  <Text key={index} style={styles.backupCode}>{code}</Text>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyAllBackupCodes(setupData.backupCodes)}
              >
                <Copy size={16} color={colors.primary[500]} />
                <Text style={styles.copyButtonText}>Copy All Codes</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Step 3: Verify</Text>
              <Text style={styles.infoText}>
                Enter the 6-digit code from your authenticator app to complete setup.
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.text.tertiary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              
              <Button
                title="Verify and Enable"
                onPress={handleVerifyMfa}
                loading={loading}
                fullWidth
                disabled={verificationCode.length < 6}
              />
              
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setSetupData(null);
                  setVerificationCode('');
                }}
                fullWidth
                style={styles.cancelButton}
              />
            </View>
          )}

          {mfaStatus.mfaEnabled && !showDisableForm && !showRegenerateForm && !newBackupCodes && (
            <View style={styles.cardContent}>
              <View style={styles.enabledStatus}>
                <ShieldCheck size={20} color={colors.success[500]} />
                <Text style={styles.enabledText}>
                  Enabled {mfaStatus.mfaVerifiedAt ? `on ${new Date(mfaStatus.mfaVerifiedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowRegenerateForm(true)}
                >
                  <RefreshCw size={20} color={colors.primary[500]} />
                  <Text style={styles.actionButtonText}>Regenerate Backup Codes</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => setShowDisableForm(true)}
                >
                  <ShieldOff size={20} color={colors.error[500]} />
                  <Text style={[styles.actionButtonText, styles.dangerText]}>Disable 2FA</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showDisableForm && (
            <View style={styles.cardContent}>
              <Text style={styles.warningText}>
                Disabling two-factor authentication will make your account less secure. Enter your current 2FA code to confirm.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.text.tertiary}
                value={disableCode}
                onChangeText={setDisableCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <Button
                title="Disable 2FA"
                variant="danger"
                onPress={handleDisableMfa}
                loading={loading}
                fullWidth
                disabled={disableCode.length < 6}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setShowDisableForm(false);
                  setDisableCode('');
                }}
                fullWidth
                style={styles.cancelButton}
              />
            </View>
          )}

          {showRegenerateForm && (
            <View style={styles.cardContent}>
              <Text style={styles.infoText}>
                Enter your current 2FA code to generate new backup codes. Your old backup codes will no longer work.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.text.tertiary}
                value={regenerateCode}
                onChangeText={setRegenerateCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <Button
                title="Generate New Codes"
                onPress={handleRegenerateBackupCodes}
                loading={loading}
                fullWidth
                disabled={regenerateCode.length < 6}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setShowRegenerateForm(false);
                  setRegenerateCode('');
                }}
                fullWidth
                style={styles.cancelButton}
              />
            </View>
          )}

          {newBackupCodes && (
            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>New Backup Codes</Text>
              <Text style={styles.infoText}>
                Your old backup codes have been invalidated. Save these new codes in a secure location.
              </Text>
              <View style={styles.backupCodesContainer}>
                {newBackupCodes.map((code, index) => (
                  <Text key={index} style={styles.backupCode}>{code}</Text>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyAllBackupCodes(newBackupCodes)}
              >
                <Copy size={16} color={colors.primary[500]} />
                <Text style={styles.copyButtonText}>Copy All Codes</Text>
              </TouchableOpacity>
              <Button
                title="Done"
                onPress={() => setNewBackupCodes(null)}
                fullWidth
                style={styles.button}
              />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[500] + '20' }]}>
              <Key size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Session Security</Text>
              <Text style={styles.cardDescription}>
                Manage your active sessions and security settings
              </Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.infoText}>
              Your session is secured with industry-standard encryption. For HIPAA compliance, sessions automatically expire after 30 minutes of inactivity.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  cardContent: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bold: {
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  button: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  secretContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  secretLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secretText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  backupCodesContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backupCode: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    fontFamily: 'monospace',
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  copyButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    marginLeft: spacing.xs,
    fontWeight: fontWeight.medium,
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
  cancelButton: {
    marginTop: spacing.sm,
  },
  enabledStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500] + '15',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  enabledText: {
    fontSize: fontSize.sm,
    color: colors.success[600],
    marginLeft: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
    fontWeight: fontWeight.medium,
  },
  dangerButton: {
    backgroundColor: colors.error[50],
  },
  dangerText: {
    color: colors.error[600],
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.error[600],
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
