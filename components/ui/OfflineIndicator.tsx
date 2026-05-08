import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { WifiOff, CloudOff, Clock, ChevronRight } from 'lucide-react-native';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatRelativeTime } from '@/lib/utils';

interface OfflineIndicatorProps {
  showPendingActions?: boolean;
}

export function OfflineIndicator({ showPendingActions = true }: OfflineIndicatorProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const { isOnline, pendingActionsCount, lastSyncTime } = useNetworkStatus();
  
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOnline ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, slideAnim]);

  if (isOnline && pendingActionsCount === 0) {
    return null;
  }

  if (isOnline && pendingActionsCount > 0) {
    return (
      <TouchableOpacity
        style={styles.syncBanner}
        onPress={() => router.push('/(tabs)/settings')}
      >
        <Clock size={16} color={colors.warning[600]} />
        <Text style={styles.syncText}>
          {pendingActionsCount} pending change{pendingActionsCount > 1 ? 's' : ''} to sync
        </Text>
        <ChevronRight size={16} color={colors.warning[600]} />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <WifiOff size={18} color="#FFFFFF" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>You're offline</Text>
          <Text style={styles.subtitle}>
            Changes will sync when you reconnect
          </Text>
        </View>
      </View>
      {lastSyncTime && (
        <Text style={styles.lastSync}>
          Last synced {formatRelativeTime(lastSyncTime)}
        </Text>
      )}
    </Animated.View>
  );
}

export function OfflineBanner() {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const { isOnline, pendingActionsCount } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <CloudOff size={16} color={colors.warning[700]} />
      <Text style={styles.bannerText}>
        Working offline
        {pendingActionsCount > 0 && ` • ${pendingActionsCount} pending`}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: isDark ? colors.error[900] : colors.error[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  lastSync: {
    fontSize: fontSize.xs,
    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.warning[900] : colors.warning[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.warning[700] : colors.warning[200],
  },
  syncText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: isDark ? colors.warning[200] : colors.warning[700],
    marginLeft: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? colors.warning[900] : colors.warning[100],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bannerText: {
    fontSize: fontSize.sm,
    color: isDark ? colors.warning[100] : colors.warning[700],
    marginLeft: spacing.sm,
  },
});
