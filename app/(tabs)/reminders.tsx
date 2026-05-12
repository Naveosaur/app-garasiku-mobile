import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
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

function typeIcon(type: MaintenanceType): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'oil_change': return 'opacity';
    case 'brake_pads': return 'build';
    case 'battery': return 'battery-charging-full';
    case 'general_service': return 'construction';
    default: return 'build';
  }
}

function typeLabel(type: MaintenanceType) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

/**
 * Tesla-inspired Reminders Screen
 * Minimal monochrome with critical-only accents
 */
export default function RemindersScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const vehicles = useVehicleStore((s) => s.vehicles);
  const records = useMaintenanceStore((s) => s.records);

  const [unreadMap, setUnreadMap] = React.useState<Record<string, number>>({});

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      (async () => {
        const map = await getUnreadRemindersMap();
        if (mounted) setUnreadMap(map);
      })().catch(() => undefined);

      (async () => {
        await clearAllUnreadReminders().catch(() => undefined);
        setTimeout(() => {
          if (mounted) setUnreadMap({});
        }, 300);
      })().catch(() => undefined);

      return () => {
        mounted = false;
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
                marginBottom: 6,
              }}>
                ALERTS
              </Text>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '900', 
                color: t.text, 
                letterSpacing: -1.2,
              }}>
                Reminders
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="close" size={22} color={t.text} />
            </Pressable>
          </View>
        </AnimatedListItem>

        {/* Overdue Section */}
        {overdueItems.length > 0 && (
          <AnimatedListItem index={1}>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: overdue,
                }} />
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: '700', 
                  color: overdue, 
                  letterSpacing: 2,
                }}>
                  ACTION REQUIRED · {overdueItems.length}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {overdueItems.map((r, idx) => {
                  const isUnread = Boolean(unreadMap[r.key]);
                  return (
                    <AnimatedListItem key={r.key} index={2 + idx}>
                      <Pressable
                        onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                        style={({ pressed }) => ({ 
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.99 : 1 }],
                        })}
                      >
                        <GlassCard style={{ padding: 18 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flex: 1 }}>
                              <View
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 12,
                                  backgroundColor: 'rgba(220, 38, 38, 0.12)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: 'rgba(220, 38, 38, 0.25)',
                                }}
                              >
                                <MaterialIcons name={typeIcon(r.type)} size={20} color={overdue} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ 
                                  fontWeight: '800', 
                                  color: t.text,
                                  fontSize: 15,
                                  letterSpacing: -0.3,
                                  marginBottom: 3,
                                }}>
                                  {typeLabel(r.type)}
                                </Text>
                                <Text style={{ 
                                  color: t.textMuted, 
                                  fontSize: 12,
                                  fontWeight: '500',
                                  marginBottom: 3,
                                }}>
                                  {r.vehicleName}
                                </Text>
                                <Text style={{ 
                                  color: overdue, 
                                  fontSize: 11,
                                  fontWeight: '600',
                                  letterSpacing: 0.3,
                                }}>
                                  {Math.abs(r.remainingKM).toLocaleString()} km overdue · {timeAgo(r.timeForDisplay)}
                                </Text>
                              </View>
                            </View>

                            {isUnread && (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  backgroundColor: overdue,
                                  marginTop: 4,
                                }}
                              />
                            )}
                          </View>
                        </GlassCard>
                      </Pressable>
                    </AnimatedListItem>
                  );
                })}
              </View>
            </View>
          </AnimatedListItem>
        )}

        {/* Due Soon Section */}
        {soonItems.length > 0 && (
          <AnimatedListItem index={overdueItems.length + 2}>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: t.textMuted,
                }} />
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: '700', 
                  color: t.textMuted, 
                  letterSpacing: 2,
                }}>
                  DUE SOON · {soonItems.length}
                </Text>
              </View>

              <View style={{ gap: 10 }}>
                {soonItems.map((r, idx) => {
                  const isUnread = Boolean(unreadMap[r.key]);
                  return (
                    <AnimatedListItem key={r.key} index={3 + overdueItems.length + idx}>
                      <Pressable
                        onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                        style={({ pressed }) => ({ 
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.99 : 1 }],
                        })}
                      >
                        <GlassCard style={{ padding: 18 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flex: 1 }}>
                              <View
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 12,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                                }}
                              >
                                <MaterialIcons name={typeIcon(r.type)} size={20} color={t.text} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ 
                                  fontWeight: '800', 
                                  color: t.text,
                                  fontSize: 15,
                                  letterSpacing: -0.3,
                                  marginBottom: 3,
                                }}>
                                  {typeLabel(r.type)}
                                </Text>
                                <Text style={{ 
                                  color: t.textMuted, 
                                  fontSize: 12,
                                  fontWeight: '500',
                                  marginBottom: 3,
                                }}>
                                  {r.vehicleName}
                                </Text>
                                <Text style={{ 
                                  color: t.textMuted, 
                                  fontSize: 11,
                                  fontWeight: '600',
                                  letterSpacing: 0.3,
                                }}>
                                  {Math.max(0, r.remainingKM).toLocaleString()} km left · {timeAgo(r.timeForDisplay)}
                                </Text>
                              </View>
                            </View>

                            {isUnread && (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  backgroundColor: t.text,
                                  marginTop: 4,
                                }}
                              />
                            )}
                          </View>
                        </GlassCard>
                      </Pressable>
                    </AnimatedListItem>
                  );
                })}
              </View>
            </View>
          </AnimatedListItem>
        )}

        {/* Empty State */}
        {overdueItems.length === 0 && soonItems.length === 0 && (
          <AnimatedListItem index={1}>
            <GlassCard style={{ padding: 32, alignItems: 'center' }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                  marginBottom: 16,
                }}
              >
                <MaterialIcons name="check" size={32} color={t.text} />
              </View>
              <Text style={{ 
                fontWeight: '800', 
                marginBottom: 6, 
                color: t.text,
                fontSize: 18,
                letterSpacing: -0.5,
              }}>
                All Clear
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 13,
                textAlign: 'center',
                fontWeight: '500',
              }}>
                No pending maintenance reminders
              </Text>
            </GlassCard>
          </AnimatedListItem>
        )}
      </ScrollView>
    </View>
  );
}
