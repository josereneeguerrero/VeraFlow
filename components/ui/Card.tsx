import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { borderRadius, spacing, shadows } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const colors = useThemeColors();
  const dynamicStyles = createStyles(colors);
  
  const cardStyle = [
    dynamicStyles.base,
    dynamicStyles[variant],
    dynamicStyles[`padding_${padding}` as keyof typeof dynamicStyles],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card.background,
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.md,
  },
  padding_md: {
    padding: spacing.lg,
  },
  padding_lg: {
    padding: spacing.xl,
  },
});
