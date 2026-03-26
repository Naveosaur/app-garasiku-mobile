import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { brand, borderRadius } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle, clearAllUnreadReminders } from '@/utils/notifications';

export default function ProfileScreen() {
  const router = useRouter();

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: '#EEF2FF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginBottom: 16,
        }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>Profile</Text>
        <Text style={{ marginTop: 10, fontWeight: '900' }}>{name || 'User'}</Text>
        <Text style={{ marginTop: 4, color: '#64748B' }}>{email || '—'}</Text>
      </View>

      <Pressable
        onPress={onLogout}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: brand,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

