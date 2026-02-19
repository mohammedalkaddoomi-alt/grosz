import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { useFonts } from 'expo-font';
import { useStore } from '../src/store/store';
import { Colors } from '../src/constants/theme';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { LockScreen } from '../src/components/LockScreen';
import { authService } from '../src/services/authService';

export default function RootLayout() {
  const { init, isLoading } = useStore();
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      await init();
      if (mounted) {
        await useStore.getState().loadSecuritySettings();
      }
    };
    bootstrap();

    // App State Listener for background locking
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        useStore.getState().lockApp();
      }
    });

    // Keep store synced with Supabase auth events (important for OAuth flows)
    const {
      data: { subscription: authSubscription },
    } = authService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        await useStore.getState().init();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, [init]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <LockScreen />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
