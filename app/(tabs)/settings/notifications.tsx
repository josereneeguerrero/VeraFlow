import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Mail, Smartphone, CheckCircle, XCircle } from 'lucide-react-native';

export default function NotificationSettingsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { expoPushToken, permissionStatus, registerForNotifications } = useNotifications();

  const [settings, setSettings] = useState({
    push: {
      enabled: permissionStatus === 'granted',
      items: [
        { id: 'workflow_updates', label: 'Workflow Updates', description: 'Step completions and progress', enabled: true },
        { id: 'approvals', label: 'Approval Requests', description: 'When items need your approval', enabled: true },
        { id: 'recommendations', label: 'New Recommendations', description: 'AI-generated insights', enabled: true },
        { id: 'due_dates', label: 'Due Date Reminders', description: '24 hours before deadlines', enabled: true },
        { id: 'team', label: 'Team Activity', description: 'When team members join or complete tasks', enabled: false },
      ],
    },
    email: {
      enabled: true,
      items: [
        { id: 'daily_digest', label: 'Daily Digest', description: 'Summary of daily activity', enabled: true },
        { id: 'weekly_report', label: 'Weekly Report', description: 'Compliance progress report', enabled: true },
        { id: 'critical_alerts', label: 'Critical Alerts', description: 'Urgent compliance issues', enabled: true },
      ],
    },
  });

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        enabled: permissionStatus === 'granted',
      },
    }));
  }, [permissionStatus]);

  const handleEnablePush = async () => {
    const token = await registerForNotifications();
    if (!token) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive push notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleSetting = (category: 'push' | 'email', itemId: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        items: prev[category].items.map((item) =>
          item.id === itemId ? { ...item, enabled: !item.enabled } : item
        ),
      },
    }));
  };

  const toggleEmailCategory = () => {
    setSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        enabled: !prev.email.enabled,
      },
    }));
  };

  return (
    <SafeArea>
      <Header showBack title="Notifications" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notification Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusIcon,
              permissionStatus === 'granted' ? styles.statusIconSuccess : styles.statusIconWarning
            ]}>
              {permissionStatus === 'granted' ? (
                <CheckCircle size={24} color={colors.success[500]} />
              ) : (
                <XCircle size={24} color={colors.warning[500]} />
              )}
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {permissionStatus === 'granted' ? 'Push Notifications Enabled' : 'Push Notifications Disabled'}
              </Text>
              <Text style={styles.statusDescription}>
                {permissionStatus === 'granted'
                  ? 'You will receive real-time alerts on this device.'
                  : 'Enable notifications to stay updated on compliance activities.'}
              </Text>
            </View>
          </View>
          {permissionStatus !== 'granted' && (
            <Button
              title="Enable Push Notifications"
              onPress={handleEnablePush}
              variant="primary"
              fullWidth
              icon={<Smartphone size={18} color="#FFFFFF" />}
              style={styles.enableButton}
            />
          )}
        </Card>

        {/* Push Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Bell size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Push Notification Types</Text>
              <Text style={styles.sectionDescription}>
                Choose which notifications you receive
              </Text>
            </View>
          </View>

          <Card style={styles.settingsCard} padding="none">
            {settings.push.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.settingItem,
                  index < settings.push.items.length - 1 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={item.enabled && permissionStatus === 'granted'}
                  onValueChange={() => toggleSetting('push', item.id)}
                  disabled={permissionStatus !== 'granted'}
                  trackColor={{ false: colors.surface, true: colors.primary[200] }}
                  thumbColor={item.enabled && permissionStatus === 'granted' ? colors.primary[500] : colors.text.tertiary}
                />
              </View>
            ))}
          </Card>
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Mail size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Email Notifications</Text>
              <Text style={styles.sectionDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              value={settings.email.enabled}
              onValueChange={toggleEmailCategory}
              trackColor={{ false: colors.surface, true: colors.primary[200] }}
              thumbColor={settings.email.enabled ? colors.primary[500] : colors.text.tertiary}
            />
          </View>

          {settings.email.enabled && (
            <Card style={styles.settingsCard} padding="none">
              {settings.email.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.settingItem,
                    index < settings.email.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    value={item.enabled}
                    onValueChange={() => toggleSetting('email', item.id)}
                    trackColor={{ false: colors.surface, true: colors.primary[200] }}
                    thumbColor={item.enabled ? colors.primary[500] : colors.text.tertiary}
                  />
                </View>
              ))}
            </Card>
          )}
        </View>

        <Text style={styles.footer}>
          Critical security alerts will always be sent regardless of your preferences.
        </Text>
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
  statusCard: {
    marginBottom: spacing.xl,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusIconSuccess: {
    backgroundColor: colors.success[50],
  },
  statusIconWarning: {
    backgroundColor: colors.warning[50],
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  enableButton: {
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
