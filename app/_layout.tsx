import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import React, { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useProfileStore } from '@/store/profileStore';
import { useVehicleStore } from '@/store/vehicleStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [booting, setBooting] = useState(true);
  
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const onboardingDone = useOnboardingStore((s) => s.onboardingDone);
  const onboardingHydrated = useOnboardingStore((s) => s.hydrated);

  useEffect(() => {
    (async () => {
      try {
        // Hydrate all stores in parallel
        await Promise.all([
          useAuthStore.getState().hydrate(),
          useOnboardingStore.getState().hydrate(),
          useProfileStore.getState().hydrate(),
        ]);
        
        // Load maintenance records and vehicles if user is logged in
        if (useAuthStore.getState().user) {
          await Promise.all([
            useVehicleStore.getState().loadVehicles().catch(() => undefined),
            useMaintenanceStore.getState().loadRecords().catch(() => undefined),
          ]);
        } else {
          // No user - mark stores as hydrated with empty data
          useVehicleStore.setState({ hydrated: true, vehicles: [] });
          useMaintenanceStore.setState({ hydrated: true, records: [] });
        }
      } catch (e) {
        console.error('Boot error:', e);
        // Set default states on error
        useVehicleStore.setState({ hydrated: true });
        useMaintenanceStore.setState({ hydrated: true });
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/auth" options={{ headerShown: false }} />
        <Stack.Screen name="modals" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]/history" options={{ headerShown: false }} />
        <Stack.Screen name="settings/change-email" options={{ headerShown: false }} />
        <Stack.Screen name="settings/change-name" options={{ headerShown: false }} />
        <Stack.Screen name="settings/service-types" options={{ headerShown: false }} />
      </Stack>

      {booting || !authHydrated || !onboardingHydrated ? null : !onboardingDone ? (
        <Redirect href="/onboarding" />
      ) : !user ? (
        <Redirect href="/(auth)/auth" />
      ) : null}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
