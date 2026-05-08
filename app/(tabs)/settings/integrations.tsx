import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Badge } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatRelativeTime } from '@/lib/utils';
import { 
  Link, Check, RefreshCw, AlertCircle,
  Hospital, MessageSquare, Mail, Grid, Video, PenTool, Trello
} from 'lucide-react-native';

const iconMap: Record<string, any> = {
  hospital: Hospital,
  'file-medical': Hospital,
  'message-square': MessageSquare,
  mail: Mail,
  grid: Grid,
  video: Video,
  'pen-tool': PenTool,
  trello: Trello,
};

export default function IntegrationsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const workspace = useQuery(api.workspaces.getCurrent);
  const integrations = useQuery(
    api.integrations.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const connect = useMutation(api.integrations.connect);
  const disconnect = useMutation(api.integrations.disconnect);
  const sync = useMutation(api.integrations.sync);

  const connectedIntegrations = integrations?.filter(i => i.isConnected) || [];
  const availableIntegrations = integrations?.filter(i => !i.isConnected) || [];

  const handleConnect = async (provider: string) => {
    if (!workspace) return;
    await connect({ workspaceId: workspace._id, provider });
  };

  const handleDisconnect = async (id: string) => {
    await disconnect({ id: id as any });
  };

  const handleSync = async (id: string) => {
    await sync({ id: id as any });
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Link;
    return Icon;
  };

  return (
    <SafeArea>
      <Header showBack title="Integrations" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Connected */}
        {connectedIntegrations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected</Text>
            {connectedIntegrations.map((integration: any) => {
              const Icon = getIcon(integration.icon);
              return (
                <Card key={integration.provider} style={styles.integrationCard}>
                  <View style={styles.integrationHeader}>
                    <View style={[styles.integrationIcon, styles.connectedIcon]}>
                      <Icon size={24} color={colors.primary[500]} />
                    </View>
                    <View style={styles.integrationInfo}>
                      <Text style={styles.integrationName}>{integration.name}</Text>
                      <Text style={styles.integrationDescription}>
                        {integration.description}
                      </Text>
                    </View>
                    <Badge label="Connected" variant="success" size="sm" />
                  </View>
                  
                  {integration.lastSyncAt && (
                    <Text style={styles.lastSync}>
                      Last synced {formatRelativeTime(integration.lastSyncAt)}
                    </Text>
                  )}
                  
                  <View style={styles.integrationActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleSync(integration._id)}
                    >
                      <RefreshCw size={16} color={colors.primary[500]} />
                      <Text style={styles.actionText}>Sync Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDisconnect(integration._id)}
                    >
                      <AlertCircle size={16} color={colors.error[500]} />
                      <Text style={[styles.actionText, styles.disconnectText]}>
                        Disconnect
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Available */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Integrations</Text>
          {availableIntegrations.map((integration: any) => {
            const Icon = getIcon(integration.icon);
            return (
              <Card key={integration.provider} style={styles.integrationCard}>
                <View style={styles.integrationHeader}>
                  <View style={styles.integrationIcon}>
                    <Icon size={24} color={colors.gray[400]} />
                  </View>
                  <View style={styles.integrationInfo}>
                    <Text style={styles.integrationName}>{integration.name}</Text>
                    <Text style={styles.integrationDescription}>
                      {integration.description}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Connect"
                  onPress={() => handleConnect(integration.provider)}
                  variant="outline"
                  size="sm"
                  style={styles.connectButton}
                />
              </Card>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Need a different integration? Contact our support team and we'll work with you to add it.
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  integrationCard: {
    marginBottom: spacing.md,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  integrationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  connectedIcon: {
    backgroundColor: colors.primary[50],
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  integrationDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  lastSync: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  integrationActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing.xs,
  },
  disconnectText: {
    color: colors.error[500],
  },
  connectButton: {
    marginTop: spacing.md,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
