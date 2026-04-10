import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, useAppTheme, cardShadowStyle } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle, clearAllUnreadReminders } from '@/utils/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const name = user?.name ?? '';
  const email = user?.email ?? '';

  const vehicleCount = useVehicleStore((s) => s.vehicles.length);
  const recordCount = useMaintenanceStore((s) => s.records.length);

  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(name);

  React.useEffect(() => {
    setNameDraft(name);
  }, [name]);

  async function onLogout() {
    const vehicles = useVehicleStore.getState().vehicles;
    try {
      await Promise.all(vehicles.map((v) => cancelAllRemindersForVehicle(v.id)));
    } catch {
      // ignore
    }

    await clearAllUnreadReminders().catch(() => undefined);
    await useAuthStore.getState().logout().catch(() => undefined);

    useVehicleStore.setState({ vehicles: [], recentVehicleId: null, hydrated: true });
    useMaintenanceStore.setState({ records: [], hydrated: true });

    router.replace('/login');
  }

  function onSaveName() {
    if (nameDraft.trim() && user) {
      useAuthStore.getState().login({ ...user, name: nameDraft.trim() });
    }
    setEditingName(false);
  }

  if (!authHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, backgroundColor: t.bg }}>
        <Text style={{ color: t.text }}>Loading...</Text>
      </View>
    );
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 120, backgroundColor: t.bg }}>

      {/* Profile Header Card */}
      <View
        style={{
          borderRadius: 16,
          padding: 20,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          marginBottom: 20,
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
            marginBottom: 16,
          }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: t.brand }}>
            {initials || '?'}
          </Text>
        </View>

        {editingName ? (
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSaveName}
            style={{
              fontSize: 18,
              fontWeight: '900',
              color: t.text,
              borderBottomWidth: 2,
              borderColor: t.brand,
              paddingVertical: 4,
              minWidth: 140,
              textAlign: 'center',
              marginBottom: 12,
            }}
          />
        ) : (
          <Text style={{ fontSize: 18, fontWeight: '900', color: t.text, marginBottom: 12 }}>
            {name || 'User'}
          </Text>
        )}

        <Pressable
          onPress={editingName ? onSaveName : () => setEditingName(true)}
          style={{ marginBottom: 12 }}>
          <MaterialIcons
            name={editingName ? 'check' : 'edit'}
            size={18}
            color={t.brand}
          />
        </Pressable>

        <View style={{ width: '100%', height: 1, backgroundColor: t.border, marginBottom: 12 }} />

        <Pressable
          onPress={() => router.push('/settings/change-email')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: t.textMuted }}>
            {email || '—'}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={16}
            color={t.textMuted}
          />
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '700', marginBottom: 10, color: t.text, fontSize: 13 }}>Statistics</Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
          }}>
          <View
            style={{
              flex: 1,
              borderRadius: borderRadius.card,
              padding: 14,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: t.brand }}>{vehicleCount}</Text>
            <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Vehicles</Text>
          </View>
          <View
            style={{
              flex: 1,
              borderRadius: borderRadius.card,
              padding: 14,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: t.brand }}>{recordCount}</Text>
            <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Records</Text>
          </View>
        </View>
      </View>

      {/* Logout Link - Text only */}
      <Pressable onPress={onLogout} style={{ marginTop: 'auto' }}>
        <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}
