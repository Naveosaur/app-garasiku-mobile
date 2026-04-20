import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { initializeDatabase } from '@/db/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [booting, setBooting] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('onboarding_done');
        setOnboardingDone(raw === 'true');

        // Initialize SQLite and load store data
        await initializeDatabase();
        await Promise.all([
          useVehicleStore.getState().loadVehicles(),
          useMaintenanceStore.getState().loadRecords(),
        ]);
      } catch (e) {
        console.error('Boot error:', e);
        // Graceful degradation — mark hydrated even on error
        useVehicleStore.setState({ hydrated: true });
        useMaintenanceStore.setState({ hydrated: true });
        setOnboardingDone(false);
      } finally {
        setBooting(false);
      }
    })();

    // Hydrate auth in parallel.
    useAuthStore.getState().hydrate().catch(() => undefined);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="modals" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]/history" options={{ headerShown: false }} />
        <Stack.Screen name="settings/change-email" options={{ headerShown: false }} />
      </Stack>

      {booting || onboardingDone === null || !authHydrated ? null : !onboardingDone ? (
        <Redirect href="/onboarding" />
      ) : !user ? (
        <Redirect href="/(auth)/login" />
      ) : null}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
