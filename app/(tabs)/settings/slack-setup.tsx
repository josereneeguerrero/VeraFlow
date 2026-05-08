import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useAction } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { MessageSquare, ExternalLink, Check, AlertCircle } from 'lucide-react-native';

export default function SlackSetupScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const slackConfig = useQuery(
    api.slack.getSlackConfig,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const configureSlack = useMutation(api.slack.configureSlack);
  const disconnectSlack = useMutation(api.slack.disconnectSlack);
  const testWebhook = useAction(api.slack.testSlackWebhook);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [channel, setChannel] = useState('#compliance');
  const [notifyOn, setNotifyOn] = useState({
    workflowCreated: true,
    stepCompleted: true,
    approvalRequired: true,
    recommendationCritical: true,
    documentUploaded: false,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (slackConfig) {
      setChannel(slackConfig.channel);
      setNotifyOn(slackConfig.notifyOn);
    }
  }, [slackConfig]);

  const handleSave = async () => {
    if (!workspace) return;
    
    if (!webhookUrl && !slackConfig?.webhookConfigured) {
      Alert.alert('Error', 'Please enter a Slack webhook URL');
      return;
    }

    setSaving(true);
    try {
      await configureSlack({
        workspaceId: workspace._id,
        webhookUrl: webhookUrl || '',
        channel,
        notifyOn,
      });
      Alert.alert('Success', 'Slack integration configured successfully');
      setWebhookUrl('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to configure Slack');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!workspace) return;
    
    setTesting(true);
    try {
      const result = await testWebhook({ workspaceId: workspace._id });
      if (result.success) {
        Alert.alert('Success', 'Test message sent to Slack!');
      } else {
        Alert.alert('Error', result.error || 'Failed to send test message');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test webhook');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!workspace) return;
    
    Alert.alert(
      'Disconnect Slack',
      'Are you sure you want to disconnect Slack? You will stop receiving notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectSlack({ workspaceId: workspace._id });
              Alert.alert('Success', 'Slack disconnected');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openSlackDocs = () => {
    Linking.openURL('https://api.slack.com/messaging/webhooks');
  };

  const isConnected = slackConfig?.status === 'connected' && slackConfig?.webhookConfigured;

  return (
    <SafeArea>
      <PageHeader title="Slack Integration" showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: isConnected ? colors.success[500] + '20' : colors.primary[500] + '20' }]}>
              <MessageSquare size={24} color={isConnected ? colors.success[500] : colors.primary[500]} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Slack Notifications</Text>
              <Text style={styles.subtitle}>
                {isConnected 
                  ? 'Connected and sending notifications'
                  : 'Connect to receive compliance notifications in Slack'
                }
              </Text>
            </View>
          </View>

          {isConnected && (
            <View style={styles.statusBanner}>
              <Check size={16} color={colors.success[600]} />
              <Text style={styles.statusText}>
                Connected to {slackConfig?.channel}
              </Text>
            </View>
          )}
        </Card>

        {!isConnected && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Setup Instructions</Text>
            <View style={styles.steps}>
              <Text style={styles.stepText}>1. Go to your Slack workspace settings</Text>
              <Text style={styles.stepText}>2. Create an Incoming Webhook app</Text>
              <Text style={styles.stepText}>3. Choose a channel and copy the webhook URL</Text>
              <Text style={styles.stepText}>4. Paste the URL below</Text>
            </View>
            <Button
              title="View Slack Documentation"
              variant="outline"
              onPress={openSlackDocs}
              icon={<ExternalLink size={16} color={colors.primary[500]} />}
              fullWidth
            />
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Webhook Configuration</Text>
          
          {!isConnected ? (
            <Input
              label="Webhook URL"
              placeholder="https://hooks.slack.com/services/..."
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <View style={styles.configuredRow}>
              <Text style={styles.configuredLabel}>Webhook URL</Text>
              <Text style={styles.configuredValue}>••••••••••{slackConfig?.webhookConfigured ? ' (configured)' : ''}</Text>
            </View>
          )}

          <Input
            label="Channel"
            placeholder="#compliance"
            value={channel}
            onChangeText={setChannel}
            autoCapitalize="none"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose which events trigger Slack notifications</Text>

          <NotificationToggle
            label="Workflow Created"
            description="When a new workflow is started"
            value={notifyOn.workflowCreated}
            onValueChange={(v) => setNotifyOn({ ...notifyOn, workflowCreated: v })}
            colors={colors}
          />
          <NotificationToggle
            label="Step Completed"
            description="When a workflow step is marked complete"
            value={notifyOn.stepCompleted}
            onValueChange={(v) => setNotifyOn({ ...notifyOn, stepCompleted: v })}
            colors={colors}
          />
          <NotificationToggle
            label="Approval Required"
            description="When a step needs approval"
            value={notifyOn.approvalRequired}
            onValueChange={(v) => setNotifyOn({ ...notifyOn, approvalRequired: v })}
            colors={colors}
          />
          <NotificationToggle
            label="Critical Recommendations"
            description="When a critical compliance issue is detected"
            value={notifyOn.recommendationCritical}
            onValueChange={(v) => setNotifyOn({ ...notifyOn, recommendationCritical: v })}
            colors={colors}
          />
          <NotificationToggle
            label="Document Uploaded"
            description="When a document is uploaded"
            value={notifyOn.documentUploaded}
            onValueChange={(v) => setNotifyOn({ ...notifyOn, documentUploaded: v })}
            colors={colors}
            isLast
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title={isConnected ? 'Update Settings' : 'Connect Slack'}
            onPress={handleSave}
            loading={saving}
            fullWidth
          />

          {isConnected && (
            <>
              <Button
                title="Send Test Message"
                variant="outline"
                onPress={handleTest}
                loading={testing}
                fullWidth
                style={styles.actionButton}
              />
              <Button
                title="Disconnect Slack"
                variant="ghost"
                onPress={handleDisconnect}
                fullWidth
                style={styles.actionButton}
                textStyle={{ color: colors.error[500] }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeArea>
  );
}

function NotificationToggle({
  label,
  description,
  value,
  onValueChange,
  colors,
  isLast,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
  isLast?: boolean;
}) {
  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }
    ]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.primary }}>
          {label}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.text.secondary, marginTop: spacing.xs }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray[300], true: colors.primary[500] }}
      />
    </View>
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
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500] + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.success[600],
    marginLeft: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  steps: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  stepText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  configuredRow: {
    marginBottom: spacing.lg,
  },
  configuredLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  configuredValue: {
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  actions: {
    marginTop: spacing.md,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
