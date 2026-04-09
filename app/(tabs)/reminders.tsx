import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

import { borderRadius, overdue, safe, soon, useAppTheme, cardShadowStyle } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { clearAllUnreadReminders, getUnreadRemindersMap } from '@/utils/notifications';
import type { MaintenanceType, ServiceStatus } from '@/types';

function timeAgo(ts: number) {
  const diffMs = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return 'just now';
}

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

function statusColor(status: ServiceStatus) {
  if (status === 'overdue') return overdue;
  if (status === 'soon') return soon;
  return safe;
}

type ReminderItem = {
  key: string;
  vehicleId: string;
  vehicleName: string;
  type: MaintenanceType;
  status: ServiceStatus;
  remainingKM: number;
  nextServiceKM: number;
  timeForDisplay: number;
};

export default function RemindersScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const vehicles = useVehicleStore((s) => s.vehicles);
  const records = useMaintenanceStore((s) => s.records);

  const [unreadMap, setUnreadMap] = React.useState<Record<string, number>>({});

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      let clearTimeout: ReturnType<typeof setTimeout> | null = null;

      (async () => {
        const map = await getUnreadRemindersMap();
        if (mounted) setUnreadMap(map);
      })().catch(() => undefined);

      // Clear unread state once the tab is opened.
      (async () => {
        await clearAllUnreadReminders().catch(() => undefined);
        clearTimeout = setTimeout(() => {
          if (mounted) setUnreadMap({});
        }, 300);
      })().catch(() => undefined);

      return () => {
        mounted = false;
        if (clearTimeout) clearTimeout = null;
      };
    }, []),
  );

  const reminderItems = React.useMemo(() => {
    const items: ReminderItem[] = [];

    for (const v of vehicles) {
      const statuses = getMaintenanceStatuses(v, records);
      for (const s of statuses) {
        if (s.status !== 'soon' && s.status !== 'overdue') continue;

        const key = `${v.id}:${s.type}`;
        const fallbackTs = s.lastRecord
          ? new Date(s.lastRecord.date).getTime()
          : new Date(v.updatedAt).getTime();

        const timeForDisplay = unreadMap[key] ?? fallbackTs;

        items.push({
          key,
          vehicleId: v.id,
          vehicleName: v.name,
          type: s.type,
          status: s.status,
          remainingKM: s.remainingKM,
          nextServiceKM: s.nextServiceKM,
          timeForDisplay,
        });
      }
    }

    items.sort((a, b) => {
      const aRank = a.status === 'overdue' ? 0 : 1;
      const bRank = b.status === 'overdue' ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return a.remainingKM - b.remainingKM;
    });

    return items;
  }, [records, unreadMap, vehicles]);

  const overdueItems = reminderItems.filter((i) => i.status === 'overdue');
  const soonItems = reminderItems.filter((i) => i.status === 'soon');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, backgroundColor: t.bg }}>
      <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 10, color: t.text }}>Reminders</Text>

      {overdueItems.length > 0 ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontWeight: '900', marginBottom: 10, color: t.text }}>🚨 Action Required</Text>

          {overdueItems.map((r) => {
            const color = statusColor(r.status);
            const isUnread = Boolean(unreadMap[r.key]);

            return (
              <Pressable
                key={r.key}
                onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                style={{
                  padding: 14,
                  borderRadius: borderRadius.card,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  marginBottom: 10,
                  ...cardShadowStyle(isDark),
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: `${color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <MaterialIcons name={typeIcon(r.type) as any} size={18} color={color} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: '900', color: t.text }}>
                        {typeLabel(r.type)} • {r.vehicleName}
                      </Text>
                      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
                        {Math.abs(r.remainingKM).toLocaleString()} km overdue. Next at{' '}
                        {r.nextServiceKM.toLocaleString()} km.
                      </Text>
                      <Text style={{ color: t.textSubtle, fontSize: 12, marginTop: 4 }}>
                        {timeAgo(r.timeForDisplay)}
                      </Text>
                    </View>
                  </View>

                  {isUnread ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: t.brand,
                        marginTop: 4,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => undefined}
            style={{
              height: 44,
              borderRadius: borderRadius.button,
              backgroundColor: t.brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
            }}>
            <Text style={{ color: 'white', fontWeight: '900' }}>Book Service Now</Text>
          </Pressable>
        </View>
      ) : null}

      {soonItems.length > 0 ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontWeight: '900', marginBottom: 10, color: t.text }}>⚠️ Due Soon</Text>

          {soonItems.map((r) => {
            const color = statusColor(r.status);
            const isUnread = Boolean(unreadMap[r.key]);

            return (
              <Pressable
                key={r.key}
                onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                style={{
                  padding: 14,
                  borderRadius: borderRadius.card,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: 'white',
                  marginBottom: 10,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: `${color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <MaterialIcons name={typeIcon(r.type) as any} size={18} color={color} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: '900' }}>
                        {typeLabel(r.type)} • {r.vehicleName}
                      </Text>
                      <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                        {Math.max(0, r.remainingKM).toLocaleString()} km left. Next at{' '}
                        {r.nextServiceKM.toLocaleString()} km.
                      </Text>
                      <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                        {timeAgo(r.timeForDisplay)}
                      </Text>
                    </View>
                  </View>

                  {isUnread ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: brand,
                        marginTop: 4,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {overdueItems.length === 0 && soonItems.length === 0 ? (
        <View
          style={{
            padding: 14,
            borderRadius: borderRadius.card,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            ...cardShadowStyle(isDark),
          }}>
          <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>✅ All Good</Text>
          <Text style={{ color: t.textMuted, fontSize: 12 }}>No upcoming services yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

