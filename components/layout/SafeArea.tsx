import React from 'react';
import { SafeAreaView, View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { colors } from '@/lib/constants';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

export function SafeArea({
  children,
  style,
  edges = ['top', 'bottom'],
  backgroundColor = colors.background,
}: SafeAreaProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  );
}

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}

export function ScreenContainer({ children, style }: ScreenContainerProps) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
