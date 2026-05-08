import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeMode, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { User, Mail, Camera, Sun, Moon, Smartphone, Check } from 'lucide-react-native';

const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Smartphone },
];

export default function AccountSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { themeMode, setThemeMode } = useTheme();
  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({ name: name.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeArea>
      <Header showBack title="Account Settings" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <Avatar name={user?.name} size="xl" />
          <Button
            title="Change Photo"
            variant="ghost"
            size="sm"
            icon={<Camera size={16} color={colors.primary[500]} />}
            style={styles.photoButton}
          />
        </View>

        {/* Profile Info */}
        <Card style={styles.card}>
          <Input
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
              leftIcon={<User size={20} color={colors.text.tertiary} />}
          />
          
          <View style={styles.emailField}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.emailValue}>
              <Mail size={20} color={colors.text.tertiary} />
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>
              Contact support to change your email address
            </Text>
          </View>
        </Card>

        {/* Theme Selection */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Card style={styles.themeCard}>
            {themeOptions.map((option, index) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.mode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    index < themeOptions.length - 1 && styles.themeOptionBorder,
                  ]}
                  onPress={() => setThemeMode(option.mode)}
                >
                  <View style={[styles.themeIconContainer, isSelected && styles.themeIconSelected]}>
                    <Icon size={20} color={isSelected ? colors.primary[500] : colors.text.tertiary} />
                  </View>
                  <Text style={[styles.themeLabel, isSelected && styles.themeLabelSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Check size={20} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

        {success && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>Profile updated successfully!</Text>
          </View>
        )}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
          disabled={name === user?.name}
        />

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerLabel}>Delete Account</Text>
            <Text style={styles.dangerDescription}>
              Permanently delete your account and all associated data.
              This action cannot be undone.
            </Text>
            <Button
              title="Delete Account"
              variant="danger"
              size="sm"
              style={styles.deleteButton}
            />
          </Card>
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
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoButton: {
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.xl,
  },
  emailField: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  email: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginLeft: spacing.md,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  themeSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  themeCard: {
    padding: 0,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  themeOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  themeIconSelected: {
    backgroundColor: colors.surfaceSecondary,
  },
  themeLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  themeLabelSelected: {
    color: colors.primary[500],
  },
  successMessage: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  successText: {
    fontSize: fontSize.sm,
    color: colors.success[700],
    textAlign: 'center',
  },
  dangerZone: {
    marginTop: spacing['3xl'],
  },
  dangerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.error[600],
    marginBottom: spacing.md,
  },
  dangerCard: {
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  dangerLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dangerDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
});
