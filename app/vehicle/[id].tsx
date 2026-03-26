import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { cardGradients, borderRadius, brand, overdue, safe, soon } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceStatus } from '@/types';
import { getMaintenanceStatuses, getVehicleWorstStatus } from '@/utils/maintenanceCalc';
import MaintenanceProgressRow from '@/components/MaintenanceProgressRow';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = params.id;
  const vehicleId = Array.isArray(idParam) ? idParam[0] : idParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);
  const hydratedVehicles = useVehicleStore((s) => s.hydrated);

  const records = useMaintenanceStore((s) => (vehicleId ? s.getRecordsForVehicle(vehicleId) : []));
  const hydratedMaintenance = useMaintenanceStore((s) => s.hydrated);

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  React.useEffect(() => {
    if (vehicleId) setRecentVehicle(vehicleId);
  }, [setRecentVehicle, vehicleId]);

  const statuses = React.useMemo(() => {
    if (!vehicle) return [];
    return getMaintenanceStatuses(vehicle, records);
  }, [records, vehicle]);

  const worstStatus = React.useMemo(() => getVehicleWorstStatus(statuses), [statuses]);

  const oilStatus = React.useMemo(
    () => statuses.find((s) => s.type === 'oil_change'),
    [statuses],
  );

  const [kmDraft, setKmDraft] = React.useState<number>(vehicle?.currentKM ?? 0);
  React.useEffect(() => {
    if (vehicle?.id) setKmDraft(vehicle.currentKM);
  }, [vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!vehicle) return;
    if (!hydratedVehicles || !hydratedMaintenance) return;

    const t = setTimeout(() => {
      if (kmDraft === vehicle.currentKM) return;
      const prevVehicle = vehicle;
      const prevStatuses = getMaintenanceStatuses(prevVehicle, records);

      const nextVehicle = {
        ...prevVehicle,
        currentKM: kmDraft,
        updatedAt: new Date().toISOString(),
      };
      const nextStatuses = getMaintenanceStatuses(nextVehicle, records);

      const prevByType = Object.fromEntries(prevStatuses.map((s) => [s.type, s]));

      const transitionsToSafe = nextStatuses.some(
        (ns) => ns.status === 'safe' && prevByType[ns.type]?.status !== 'safe',
      );
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
  }, [hydratedMaintenance, hydratedVehicles, kmDraft, records, vehicle]);

  if (!hydratedVehicles || !hydratedMaintenance) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontWeight: '800', marginBottom: 10 }}>Vehicle not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            height: 44,
            borderRadius: borderRadius.button,
            backgroundColor: brand,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 18,
          }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const statusBadgeBg =
    worstStatus === 'overdue'
      ? 'rgba(239, 68, 68, 0.16)'
      : worstStatus === 'soon'
        ? 'rgba(234, 179, 8, 0.16)'
        : 'rgba(34, 197, 94, 0.16)';
  const statusBadgeFg = worstStatus === 'overdue' ? overdue : worstStatus === 'soon' ? soon : safe;

  const kmLeft = oilStatus ? oilStatus.remainingKM : 0;

  const recentRecords = records.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <LinearGradient
        colors={cardGradients[worstStatus]}
        style={{
          borderRadius: 16,
          padding: 14,
          overflow: 'hidden',
          marginBottom: 14,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={{
              width: 42,
              height: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.16)',
            }}>
            <MaterialIcons name="arrow-back" size={22} color="white" />
          </Pressable>

          <View
            style={{
              backgroundColor: statusBadgeBg,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 999,
              alignItems: 'center',
            }}>
            <Text style={{ color: statusBadgeFg, fontWeight: '900', fontSize: 12 }}>
              {worstStatus === 'overdue' ? 'OVERDUE' : worstStatus === 'soon' ? 'SERVICE SOON' : 'SAFE'}
            </Text>
          </View>
        </View>

        <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginTop: 10 }}>{vehicle.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{vehicle.plate}</Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>Current</Text>
              <Text style={{ color: 'white', fontWeight: '900' }}>{vehicle.currentKM.toLocaleString()} km</Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>Next Oil</Text>
              <Text style={{ color: 'white', fontWeight: '900' }}>
                {(oilStatus?.nextServiceKM ?? 0).toLocaleString()} km
              </Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>KM Left</Text>
              <Text style={{ color: 'white', fontWeight: '900' }}>
                {Math.max(0, kmLeft).toLocaleString()} km
              </Text>
            </View>
          </View>

          <View>
            <Text style={{ color: 'white', fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Update KM</Text>
            <TextInput
              value={String(kmDraft)}
              onChangeText={(t) => {
                const parsed = Number(t.replace(/[^0-9]/g, ''));
                setKmDraft(Number.isFinite(parsed) ? parsed : 0);
              }}
              keyboardType="numeric"
              style={{
                height: 44,
                borderRadius: borderRadius.input,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                paddingHorizontal: 12,
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: 'white',
              }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }}>
              Saved automatically after 800ms
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>Maintenance Status</Text>
          <Pressable
            onPress={() => router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicle.id)}`)}
            style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ color: brand, fontWeight: '900' }}>+ Add Record</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 10, gap: 10 }}>
          {statuses.map((s: MaintenanceStatus) => (
            <MaintenanceProgressRow key={s.type} status={s} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>Recent History</Text>
          <Pressable
            onPress={() => router.push(`/vehicle/${vehicle.id}/history`)}
            style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ color: brand, fontWeight: '900' }}>View Full History</Text>
          </Pressable>
        </View>

        {recentRecords.length === 0 ? (
          <View style={{ padding: 14, borderRadius: borderRadius.card, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'white', marginTop: 10 }}>
            <Text style={{ fontWeight: '900', marginBottom: 6 }}>No records yet</Text>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 12 }}>
              Log your first service.
            </Text>
            <Pressable
              onPress={() => router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicle.id)}`)}
              style={{
                height: 44,
                borderRadius: borderRadius.button,
                backgroundColor: brand,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 18,
              }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Add Record</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            {recentRecords.map((r) => (
              <View
                key={r.id}
                style={{
                  padding: 14,
                  borderRadius: borderRadius.card,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: 'white',
                }}>
                <Text style={{ fontWeight: '900' }}>{r.type.replace(/_/g, ' ')}</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>
                  {r.serviceKM.toLocaleString()} km • {new Date(r.date).toLocaleDateString()}
                </Text>
                {r.notes ? (
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>{r.notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

