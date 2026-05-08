import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fontSize, spacing } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
}

export function Divider({ label, style }: DividerProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (label) {
    return (
      <View style={[styles.containerWithLabel, style]}>
        <View style={styles.line} />
        <Text style={styles.label}>{label}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.line, styles.fullLine, style]} />;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  containerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  fullLine: {
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
});
