import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeArea, Header } from '@/components/layout';
import { Card } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { Bell, Mail, MessageSquare, AlertTriangle } from 'lucide-react-native';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    push: {
      enabled: true,
      items: [
        { id: 'workflow_updates', label: 'Workflow Updates', description: 'Step completions and progress', enabled: true },
        { id: 'approvals', label: 'Approval Requests', description: 'When items need your approval', enabled: true },
        { id: 'recommendations', label: 'New Recommendations', description: 'AI-generated insights', enabled: true },
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

  const toggleCategory = (category: 'push' | 'email') => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        enabled: !prev[category].enabled,
      },
    }));
  };

  return (
    <SafeArea>
      <Header showBack title="Notifications" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Bell size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Push Notifications</Text>
              <Text style={styles.sectionDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={settings.push.enabled}
              onValueChange={() => toggleCategory('push')}
              trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
              thumbColor={settings.push.enabled ? colors.primary[500] : colors.gray[400]}
            />
          </View>

          {settings.push.enabled && (
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
                    value={item.enabled}
                    onValueChange={() => toggleSetting('push', item.id)}
                    trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                    thumbColor={item.enabled ? colors.primary[500] : colors.gray[400]}
                  />
                </View>
              ))}
            </Card>
          )}
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
              onValueChange={() => toggleCategory('email')}
              trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
              thumbColor={settings.email.enabled ? colors.primary[500] : colors.gray[400]}
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
                    trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                    thumbColor={item.enabled ? colors.primary[500] : colors.gray[400]}
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
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
    color: colors.gray[900],
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
    borderBottomColor: colors.gray[100],
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 20,
  },
});
