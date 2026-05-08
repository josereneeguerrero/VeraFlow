import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConvexAuth } from 'convex/react';
import { 
  Home, LayoutDashboard, ListChecks, 
  Lightbulb, Settings 
} from 'lucide-react-native';
import { colors, fontSize, spacing } from '@/lib/constants';

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;
    router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workflows"
        options={{
          title: 'Workflows',
          tabBarIcon: ({ color, size }) => (
            <ListChecks size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Actions',
          tabBarIcon: ({ color, size }) => (
            <Lightbulb size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.gray[100],
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    height: 60,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
