import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  dot = false,
}: BadgeProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}` as keyof typeof styles], style]}>
      {dot && <View style={[styles.dot, styles[`dot_${variant}` as keyof typeof styles]]} />}
      <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], styles[`text_${size}` as keyof typeof styles]]}>
        {label}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'draft' | 'active' | 'paused';
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'primary' },
  awaiting_approval: { label: 'Awaiting Approval', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  draft: { label: 'Draft', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge label={config.label} variant={config.variant} size={size} dot />;
}

interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md';
}

const priorityConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  critical: { label: 'Critical', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return <Badge label={config.label} variant={config.variant} size={size} />;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  default: {
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.primary[50],
  },
  success: {
    backgroundColor: colors.success[50],
  },
  warning: {
    backgroundColor: colors.warning[50],
  },
  error: {
    backgroundColor: colors.error[50],
  },
  info: {
    backgroundColor: colors.primary[50],
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontWeight: fontWeight.medium,
  },
  text_default: {
    color: colors.text.secondary,
  },
  text_primary: {
    color: colors.primary[700],
  },
  text_success: {
    color: colors.success[700],
  },
  text_warning: {
    color: colors.warning[700],
  },
  text_error: {
    color: colors.error[700],
  },
  text_info: {
    color: colors.primary[700],
  },
  text_sm: {
    fontSize: fontSize.xs,
  },
  text_md: {
    fontSize: fontSize.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  dot_default: {
    backgroundColor: colors.text.tertiary,
  },
  dot_primary: {
    backgroundColor: colors.primary[500],
  },
  dot_success: {
    backgroundColor: colors.success[500],
  },
  dot_warning: {
    backgroundColor: colors.warning[500],
  },
  dot_error: {
    backgroundColor: colors.error[500],
  },
  dot_info: {
    backgroundColor: colors.primary[500],
  },
});
