import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { User, LogOut, ChevronDown } from 'lucide-react-native';
import { borderRadius, fontSize, fontWeight, spacing, shadows } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Avatar } from './Avatar';

interface AccountDropdownProps {
  size?: 'sm' | 'md';
}

export function AccountDropdown({ size = 'md' }: AccountDropdownProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const { signOut } = useAuthActions();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = useQuery(api.users.getCurrentUser);

  const handleSignOut = async () => {
    setIsOpen(false);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.log('Sign out error:', error);
    }
    router.replace('/(auth)/login');
  };

  const handleNavigateToProfile = () => {
    setIsOpen(false);
    router.push('/(tabs)/settings/account');
  };

  const avatarSize = size === 'sm' ? 'sm' : 'md';

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Avatar name={user?.name} size={avatarSize} />
        <ChevronDown size={16} color={colors.text.secondary} style={styles.chevron} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdownContainer}>
            <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
              <View style={styles.userInfo}>
                <Avatar name={user?.name} size="md" />
                <View style={styles.userDetails}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'User'}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleNavigateToProfile}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <User size={18} color={colors.text.secondary} />
                </View>
                <Text style={styles.menuLabel}>Profile</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.menuItem, styles.signOutItem]}
                onPress={handleSignOut}
                disabled={isSigningOut}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, styles.signOutIcon]}>
                  <LogOut size={18} color={colors.error[500]} />
                </View>
                <Text style={styles.signOutLabel}>
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: spacing.lg,
  },
  dropdownContainer: {
    ...shadows.lg,
  },
  dropdown: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    minWidth: 220,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  userDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  signOutItem: {
    backgroundColor: isDark ? colors.error[900] : colors.error[50],
  },
  signOutIcon: {
    backgroundColor: isDark ? colors.error[800] : colors.error[100],
  },
  signOutLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: isDark ? colors.error[200] : colors.error[600],
  },
});
