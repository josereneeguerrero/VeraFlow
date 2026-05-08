import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/lib/constants';
import { getScoreColor } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  color,
  style,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const progressColor = color || getScoreColor(percentage);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, styles[`track_${size}`]]}>
        <View
          style={[
            styles.fill,
            styles[`fill_${size}`],
            { width: `${percentage}%`, backgroundColor: progressColor },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(percentage)}%</Text>
      )}
    </View>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color,
  showValue = true,
  label,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const progressColor = color || getScoreColor(percentage);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[circularStyles.container, { width: size, height: size }]}>
      <View style={circularStyles.svgContainer}>
        <View
          style={[
            circularStyles.track,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        <View
          style={[
            circularStyles.progress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      {showValue && (
        <View style={circularStyles.valueContainer}>
          <Text style={[circularStyles.value, { color: progressColor }]}>
            {Math.round(percentage)}
          </Text>
          {label && <Text style={circularStyles.label}>{label}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  track_sm: {
    height: 4,
  },
  track_md: {
    height: 8,
  },
  track_lg: {
    height: 12,
  },
  fill: {
    borderRadius: borderRadius.full,
  },
  fill_sm: {
    height: 4,
  },
  fill_md: {
    height: 8,
  },
  fill_lg: {
    height: 12,
  },
  label: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
});

const circularStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  track: {
    position: 'absolute',
    borderColor: colors.gray[100],
  },
  progress: {
    position: 'absolute',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  valueContainer: {
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
});
