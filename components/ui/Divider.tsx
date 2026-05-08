import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSize, spacing } from '@/lib/constants';

interface DividerProps {
  label?: string;
  style?: ViewStyle;
}

export function Divider({ label, style }: DividerProps) {
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

const styles = StyleSheet.create({
  containerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  fullLine: {
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginHorizontal: spacing.md,
  },
});
