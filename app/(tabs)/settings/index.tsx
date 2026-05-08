import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { 
  User, Building2, Link, Users, FileText, 
  CreditCard, Bell, HelpCircle, LogOut, ChevronRight
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = useQuery(api.users.getCurrentUser);
  const workspace = useQuery(api.workspaces.getCurrent);
  const subscription = useQuery(
    api.billing.getCurrentPlan,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  useEffect(() => {
    if (isSigningOut && !isAuthenticated) {
      router.replace('/');
    }
  }, [isSigningOut, isAuthenticated, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
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
                      <Icon size={20} color={colors.gray[600]} />
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
                    <ChevronRight size={20} color={colors.gray[400]} />
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
          <LogOut size={20} color={isSigningOut ? colors.gray[400] : colors.error[500]} />
          <Text style={[styles.signOutText, isSigningOut && styles.signOutTextDisabled]}>
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
    color: colors.gray[500],
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
    borderBottomColor: colors.gray[100],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
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
    color: colors.gray[900],
    marginRight: spacing.sm,
  },
  menuDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  signOutButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error[500],
    marginLeft: spacing.sm,
  },
  signOutTextDisabled: {
    color: colors.gray[400],
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
