import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { User, Mail, Camera } from 'lucide-react-native';

export default function AccountSettingsScreen() {
  const router = useRouter();
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
            leftIcon={<User size={20} color={colors.gray[400]} />}
          />
          
          <View style={styles.emailField}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.emailValue}>
              <Mail size={20} color={colors.gray[400]} />
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>
              Contact support to change your email address
            </Text>
          </View>
        </Card>

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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  emailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  email: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    marginLeft: spacing.md,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
  successMessage: {
    backgroundColor: colors.success[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
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
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  dangerDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
});
