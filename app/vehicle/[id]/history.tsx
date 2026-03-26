import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { brand, borderRadius } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceType } from '@/types';

function typeIcon(type: MaintenanceType) {
  switch (type) {
    case 'oil_change':
      return 'oil_barrel';
    case 'brake_pads':
      return 'build';
    case 'battery':
      return 'battery_charging_full';
    case 'general_service':
      return 'construction';
    default:
      return 'build';
  }
}

function typeLabel(type: MaintenanceType) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonth(ts: number) {
  return new Date(ts).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export default function VehicleHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = params.id;
  const vehicleId = Array.isArray(idParam) ? idParam[0] : idParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const records = useMaintenanceStore((s) => (vehicleId ? s.getRecordsForVehicle(vehicleId) : []));

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const recordsAsc = React.useMemo(() => {
    return [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof recordsAsc>();
    for (const r of recordsAsc) {
      const ts = new Date(r.date).getTime();
      const key = `${new Date(ts).getFullYear()}-${String(new Date(ts).getMonth() + 1).padStart(2, '0')}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[1][0].date).getTime() - new Date(b[1][0].date).getTime())
      .map(([key, list]) => ({
        key,
        label: formatMonth(new Date(list[0].date).getTime()),
        list,
      }));
  }, [recordsAsc]);

  const openAdd = () => {
    if (!vehicleId) return;
    router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicleId)}`);
  };

  if (!vehicle) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ fontWeight: '900', marginBottom: 12 }}>Vehicle not found</Text>
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>Maintenance History</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ height: 40, width: 40, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={20} color={brand} />
        </Pressable>
      </View>

      <View
        style={{
          padding: 14,
          borderRadius: borderRadius.card,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          backgroundColor: 'white',
          marginBottom: 14,
        }}>
        <Text style={{ fontWeight: '900', fontSize: 16 }}>{vehicle.name}</Text>
        <Text style={{ color: '#64748B', marginTop: 4 }}>{vehicle.plate}</Text>
      </View>

      {recordsAsc.length === 0 ? (
        <View
          style={{
            padding: 14,
            borderRadius: borderRadius.card,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            backgroundColor: 'white',
          }}>
          <Text style={{ fontWeight: '900', marginBottom: 6 }}>No maintenance records yet. Log your first service.</Text>
          <Pressable
            onPress={openAdd}
            style={{
              height: 44,
              borderRadius: borderRadius.button,
              backgroundColor: brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
            }}>
            <Text style={{ color: 'white', fontWeight: '900' }}>Add Record</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {grouped.map((g) => (
            <View key={g.key}>
              <Text style={{ fontWeight: '900', color: '#0F172A', marginBottom: 10 }}>{g.label}</Text>

              <View style={{ gap: 12 }}>
                {g.list.map((r, idx) => {
                  const isLast = idx === g.list.length - 1;
                  return (
                    <View key={r.id} style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ width: 22, alignItems: 'center' }}>
                        <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: brand, marginTop: 6 }} />
                        {!isLast ? <View style={{ width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 6 }} /> : null}
                      </View>
                      <View style={{ flex: 1, paddingVertical: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <MaterialIcons name={typeIcon(r.type) as any} size={18} color={brand} />
                          <Text style={{ fontWeight: '900' }}>{typeLabel(r.type)}</Text>
                        </View>
                        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>
                          {r.serviceKM.toLocaleString()} km • {new Date(r.date).toLocaleDateString()}
                        </Text>
                        {r.notes ? (
                          <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>{r.notes}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

