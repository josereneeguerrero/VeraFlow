import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Avatar, Badge, OfflineBanner } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { 
  User, Building2, Link, Users, FileText, FolderOpen,
  CreditCard, Bell, HelpCircle, LogOut, ChevronRight,
  CloudOff, RefreshCw, Wifi, WifiOff
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const user = useQuery(api.users.getCurrentUser);
  const workspace = useQuery(api.workspaces.getCurrent);
  const subscription = useQuery(
    api.billing.getCurrentPlan,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const { isOnline, pendingActionsCount, syncNow } = useOfflineSync();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.log('Sign out error:', error);
    }
    router.replace('/(auth)/login');
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        {
          icon: User,
          label: 'Account Settings',
          description: 'Manage your profile and preferences',
          route: '/(tabs)/settings/account',
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Configure notification preferences',
          route: '/(tabs)/settings/notifications',
        },
      ],
    },
    {
      section: 'Workspace',
      items: [
        {
          icon: Building2,
          label: 'Workspace Settings',
          description: 'Manage workspace details',
          route: '/(tabs)/settings/workspace',
        },
        {
          icon: Users,
          label: 'Team Members',
          description: 'Invite and manage team',
          route: '/(tabs)/settings/team',
          badge: 'New',
        },
        {
          icon: Link,
          label: 'Integrations',
          description: 'Connect external tools',
          route: '/(tabs)/settings/integrations',
        },
      ],
    },
    {
      section: 'Data',
      items: [
        {
          icon: FolderOpen,
          label: 'Documents',
          description: 'Manage uploaded files',
          route: '/(tabs)/settings/documents',
        },
        {
          icon: FileText,
          label: 'Reports',
          description: 'View and export reports',
          route: '/(tabs)/settings/reports',
        },
      ],
    },
    {
      section: 'Billing',
      items: [
        {
          icon: CreditCard,
          label: 'Billing & Plan',
          description: subscription?.name || 'Manage subscription',
          route: '/(tabs)/settings/billing',
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'Get help and contact us',
          route: '/(tabs)/settings/help',
        },
      ],
    },
  ];

  return (
    <SafeArea>
      <OfflineBanner />
      <PageHeader title="Settings" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Avatar name={user?.name} size="lg" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.workspaceName}>{workspace?.name}</Text>
          </View>
        </Card>

        {/* Sync Status Card */}
        {(!isOnline || pendingActionsCount > 0) && (
          <Card style={styles.syncCard}>
            <View style={styles.syncHeader}>
              {isOnline ? (
                <Wifi size={20} color={colors.success[500]} />
              ) : (
                <WifiOff size={20} color={colors.warning[500]} />
              )}
              <Text style={styles.syncTitle}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            {pendingActionsCount > 0 && (
              <>
                <View style={styles.syncInfo}>
                  <CloudOff size={16} color={colors.text.secondary} />
                  <Text style={styles.syncText}>
                    {pendingActionsCount} pending change{pendingActionsCount > 1 ? 's' : ''}
                  </Text>
                </View>
                {isOnline && (
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color={colors.primary[500]} />
                    ) : (
                      <>
                        <RefreshCw size={16} color={colors.primary[500]} />
                        <Text style={styles.syncButtonText}>Sync Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </Card>
        )}

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <Card style={styles.menuCard} padding="none">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.menuIcon}>
                      <Icon size={20} color={colors.text.secondary} />
                    </View>
                    <View style={styles.menuContent}>
                      <View style={styles.menuLabelRow}>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        {item.badge && (
                          <Badge label={item.badge} variant="primary" size="sm" />
                        )}
                      </View>
                      <Text style={styles.menuDescription}>{item.description}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.text.tertiary} />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity 
          style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]} 
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut size={20} color={isSigningOut ? colors.text.tertiary : colors.error[500]} />
          <Text style={[styles.signOutText, isSigningOut && styles.signOutTextDisabled]}>
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  syncCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  syncTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  syncText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: isDark ? colors.surfaceSecondary : colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: isDark ? colors.primary[700] : colors.primary[200],
  },
  syncButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing.sm,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  workspaceName: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
  section: {
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
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  menuDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: isDark ? colors.error[900] : colors.error[50],
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: isDark ? colors.error[700] : colors.error[200],
  },
  signOutButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error[500],
    marginLeft: spacing.sm,
  },
  signOutTextDisabled: {
    color: colors.text.tertiary,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
