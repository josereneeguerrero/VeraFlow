import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="workspace-setup" />
      <Stack.Screen name="organization-details" />
      <Stack.Screen name="team-type" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="assessment" />
      <Stack.Screen name="assessment-results" />
      <Stack.Screen name="readiness-score" />
    </Stack>
  );
}
