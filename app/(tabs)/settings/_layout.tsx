import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="integrations" />
      <Stack.Screen name="team" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="account" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
