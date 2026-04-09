import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

import { borderRadius, useAppTheme, overdue, soon } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

import VehicleCard from '@/components/VehicleCard';

export default function DashboardScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();

  const userName = useAuthStore((s) => s.user?.name ?? '');
  const vehicles = useVehicleStore((s) => s.vehicles);
  const recentVehicleId = useVehicleStore((s) => s.recentVehicleId);
  const vehicleHydrated = useVehicleStore((s) => s.hydrated);

  const records = useMaintenanceStore((s) => s.records);
  const maintenanceHydrated = useMaintenanceStore((s) => s.hydrated);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Good morning';
    if (hour < 15) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const urgentReminders = React.useMemo(() => {
    const items: {
      key: string;
      vehicleName: string;
      vehicleId: string;
      type: string;
      status: 'soon' | 'overdue';
      remainingKM: number;
      nextServiceKM: number;
    }[] = [];

    for (const v of vehicles) {
      const statuses = getMaintenanceStatuses(v, records);
      for (const s of statuses) {
        if (s.status === 'soon' || s.status === 'overdue') {
          items.push({
            key: `${v.id}-${s.type}`,
            vehicleId: v.id,
            vehicleName: v.name,
            type: s.type,
            status: s.status,
            remainingKM: s.remainingKM,
            nextServiceKM: s.nextServiceKM,
          });
        }
      }
    }

    items.sort((a, b) => {
      const aRank = a.status === 'overdue' ? 0 : 1;
      const bRank = b.status === 'overdue' ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return a.remainingKM - b.remainingKM;
    });

    return items.slice(0, 2);
  }, [records, vehicles]);

  const targetVehicle = React.useMemo(() => {
    if (recentVehicleId) {
      const found = vehicles.find((v) => v.id === recentVehicleId);
      if (found) return found;
    }
    return vehicles[0];
  }, [recentVehicleId, vehicles]);

  // Quick KM update (debounced 800ms before saving).
  const [kmDraft, setKmDraft] = React.useState<number>(targetVehicle?.currentKM ?? 0);
  React.useEffect(() => {
    setKmDraft(targetVehicle?.currentKM ?? 0);
  }, [targetVehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!targetVehicle) return;
    if (!vehicleHydrated || !maintenanceHydrated) return;

    const t = setTimeout(() => {
      if (kmDraft === targetVehicle.currentKM) return;

      const prevVehicle = targetVehicle;
      const prevStatuses = getMaintenanceStatuses(prevVehicle, records);

      const nextVehicle = {
        ...prevVehicle,
        currentKM: kmDraft,
        updatedAt: new Date().toISOString(),
      };
      const nextStatuses = getMaintenanceStatuses(nextVehicle, records);

      const prevByType = Object.fromEntries(prevStatuses.map((s) => [s.type, s]));

      const transitionsToSafe = nextStatuses.some((ns) => ns.status === 'safe' && prevByType[ns.type]?.status !== 'safe');
      const shouldSchedule = nextStatuses.filter((ns) => {
        const ps = prevByType[ns.type];
        if (!ps) return false;
        const becameNonSafe = ps.status === 'safe' && ns.status !== 'safe';
        const becameOverdue = ns.status === 'overdue' && ps.status !== 'overdue';
        return becameNonSafe || becameOverdue;
      });

      useVehicleStore.getState().updateKM(prevVehicle.id, kmDraft);

      (async () => {
        if (transitionsToSafe) {
          await cancelAllRemindersForVehicle(prevVehicle.id);
        }
        if (shouldSchedule.length > 0) {
          await Promise.all(shouldSchedule.map((ns) => scheduleMaintenanceReminder(nextVehicle, ns)));
        }
      })().catch(() => undefined);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }, 800);

    return () => clearTimeout(t);
  }, [kmDraft, maintenanceHydrated, records, targetVehicle, vehicleHydrated]);

  if (!vehicleHydrated || !maintenanceHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 70, marginBottom: 16 }}>🏍️</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
            Add Your First Vehicle
          </Text>
          <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 22 }}>
            Track KM and never miss a service again
          </Text>
          <Pressable
            onPress={() => router.push('/modals/add-vehicle')}
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: borderRadius.button,
              backgroundColor: brand,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 220,
            }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Add Vehicle</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const showVerticalList = vehicles.length <= 2;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, backgroundColor: t.bg }}>
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>
              {greeting}, {userName || 'there'}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>
              Keep your motorcycle maintenance on track.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/reminders')}
            accessibilityRole="button"
            style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="notifications" size={20} color={t.text} />
          </Pressable>
        </View>
      </View>

      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: t.text }}>Your Vehicles</Text>

      <FlatList
        data={vehicles}
        horizontal={!showVerticalList}
        scrollEnabled={!showVerticalList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const statuses = getMaintenanceStatuses(item, records);
          return <VehicleCard vehicle={item} statuses={statuses} />;
        }}
      />

      <View style={{ marginTop: 18 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: t.text }}>Quick KM Update</Text>
        {targetVehicle ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: borderRadius.card,
              padding: 14,
              backgroundColor: t.surface,
            }}>
            <Text style={{ fontSize: 14, fontWeight: '700', marginBottom: 6, color: t.text }}>
              {targetVehicle.name}
            </Text>
            <Text style={{ color: t.textMuted, marginBottom: 6 }}>
              Current KM: {targetVehicle.currentKM.toLocaleString()}
            </Text>
            <TextInput
              value={String(kmDraft)}
              onChangeText={(t) => {
                const parsed = Number(t.replace(/[^0-9]/g, ''));
                setKmDraft(Number.isFinite(parsed) ? parsed : 0);
              }}
              keyboardType="numeric"
              placeholderTextColor={t.textSubtle}
              style={{
                height: 44,
                borderRadius: borderRadius.input,
                borderWidth: 1,
                borderColor: t.inputBorder,
                paddingHorizontal: 12,
                backgroundColor: t.inputBg,
                color: t.text,
              }}
            />
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>
              Saved automatically after 800ms
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 18 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10, color: t.text }}>Reminders</Text>
        {urgentReminders.length === 0 ? (
          <View
            style={{
              padding: 14,
              borderRadius: borderRadius.card,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
            }}>
            <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text }}>All Good ✅</Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>No soon/overdue services yet.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {urgentReminders.map((r) => (
              <Pressable
                key={r.key}
                onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                style={{
                  padding: 14,
                  borderRadius: borderRadius.card,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  borderLeftWidth: 3,
                  borderLeftColor: r.status === 'overdue' ? overdue : soon,
                }}>
                <Text style={{ fontWeight: '800', color: t.text }}>
                  {r.status === 'overdue' ? '⚠️ Overdue' : '🚨 Due Soon'}: {r.vehicleName}
                </Text>
                <Text style={{ color: t.textMuted, marginTop: 6, fontSize: 12 }}>
                  {r.type.replace(/_/g, ' ')} in {Math.max(0, r.remainingKM).toLocaleString()} km
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
