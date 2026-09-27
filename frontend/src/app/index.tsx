import { Redirect } from 'expo-router';

export default function Index() {
  // Later we'll check AsyncStorage here to see if user has onboarded
  // For now always show onboarding
  return <Redirect href="/onboarding/slide-1" />;
}