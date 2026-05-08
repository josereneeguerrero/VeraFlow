import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme, useThemeColors } from '@/lib/theme';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  backgroundColor?: string;
}

export function SafeArea({
  children,
  style,
  edges = ['top', 'bottom'],
  backgroundColor,
}: SafeAreaProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const bgColor = backgroundColor ?? colors.background;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }, style]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={bgColor} 
      />
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
  const colors = useThemeColors();
  
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});
