import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

import { borderRadius, useAppTheme, overdue, cardShadowStyle } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle, clearAllUnreadReminders } from '@/utils/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const name = user?.name ?? '';
  const email = user?.email ?? '';

  async function onLogout() {
    const vehicles = useVehicleStore.getState().vehicles;
    try {
      await Promise.all(vehicles.map((v) => cancelAllRemindersForVehicle(v.id)));
    } catch {
      // ignore
    }

    await clearAllUnreadReminders().catch(() => undefined);
    await useAuthStore.getState().logout().catch(() => undefined);

    // Reset persisted app data for a clean logout.
    useVehicleStore.setState({ vehicles: [], recentVehicleId: null, hydrated: false });
    useMaintenanceStore.setState({ records: [], hydrated: false });

    router.replace('/login');
  }

  if (!authHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text style={{ color: t.text }}>Loading...</Text>
      </View>
    );
  }

  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, backgroundColor: t.bg }}>
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          marginBottom: 16,
          alignItems: 'center',
          ...cardShadowStyle(isDark),
        }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: t.brandMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: t.brand }}>
            {initials || '?'}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '900', color: t.text }}>
          {name || 'User'}
        </Text>
        <Text style={{ marginTop: 4, color: t.textMuted }}>
          {email || '—'}
        </Text>
      </View>

      <Pressable
        onPress={onLogout}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: overdue,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: overdue, fontWeight: '900' }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

