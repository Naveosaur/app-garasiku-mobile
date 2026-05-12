import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import { borderRadius, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceType } from '@/types';

function typeIcon(type: MaintenanceType): React.ComponentProps<typeof MaterialIcons>['name'] {
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

function formatMonth(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Tesla-inspired History Screen
 * Minimal monochrome timeline
 */
export default function VehicleHistoryScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = params.id;
  const vehicleId = Array.isArray(idParam) ? idParam[0] : idParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const allRecords = useMaintenanceStore((s) => s.records);

  const records = React.useMemo(() => {
    if (!vehicleId) return [];
    return allRecords
      .filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, vehicleId]);

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const recordsDesc = React.useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof recordsDesc>();
    for (const r of recordsDesc) {
      const ts = new Date(r.date).getTime();
      const key = `${new Date(ts).getFullYear()}-${String(new Date(ts).getMonth() + 1).padStart(2, '0')}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime())
      .map(([key, list]) => ({
        key,
        label: formatMonth(new Date(list[0].date).getTime()),
        list,
      }));
  }, [recordsDesc]);

  const openAdd = () => {
    if (!vehicleId) return;
    router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicleId)}`);
  };

  if (!vehicle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
        <Text style={{ fontWeight: '900', marginBottom: 16, color: t.text, fontSize: 20, letterSpacing: -0.5 }}>
          Vehicle not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            height: 52,
            borderRadius: borderRadius.button,
            backgroundColor: t.brand,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            alignSelf: 'flex-start',
          }}>
          <Text style={{ 
            color: isDark ? '#000000' : '#FFFFFF', 
            fontWeight: '700',
            letterSpacing: 1,
          }}>
            GO BACK
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
                marginBottom: 6,
              }}>
                {vehicle.plate}
              </Text>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '900', 
                color: t.text, 
                letterSpacing: -1.2,
                marginBottom: 4,
              }}>
                History
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 14,
                fontWeight: '500',
              }}>
                {vehicle.name} · {recordsDesc.length} {recordsDesc.length === 1 ? 'record' : 'records'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ 
                height: 44, 
                width: 44, 
                borderRadius: 14, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}>
              <MaterialIcons name="arrow-back" size={22} color={t.text} />
            </Pressable>
          </View>
        </AnimatedListItem>

        {recordsDesc.length === 0 ? (
          <AnimatedListItem index={1}>
            <GlassCard style={{ padding: 24 }}>
              <Text style={{ 
                fontWeight: '800', 
                marginBottom: 6, 
                color: t.text,
                fontSize: 16,
                letterSpacing: -0.3,
              }}>
                No records yet
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 13,
                marginBottom: 20,
                fontWeight: '500',
              }}>
                Start tracking your maintenance history
              </Text>
              <Pressable
                onPress={openAdd}
                style={({ pressed }) => ({
                  borderRadius: borderRadius.button,
                  overflow: 'hidden',
                  alignSelf: 'flex-start',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <View style={{
                  height: 48,
                  paddingHorizontal: 20,
                  backgroundColor: t.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ 
                    color: isDark ? '#000000' : '#FFFFFF', 
                    fontWeight: '700',
                    letterSpacing: 1,
                    fontSize: 12,
                  }}>
                    ADD FIRST RECORD
                  </Text>
                </View>
              </Pressable>
            </GlassCard>
          </AnimatedListItem>
        ) : (
          <View style={{ gap: 24 }}>
            {grouped.map((g, groupIndex) => (
              <AnimatedListItem key={g.key} index={groupIndex + 1}>
                <View>
                  <Text style={{ 
                    fontWeight: '700', 
                    color: t.textSubtle, 
                    marginBottom: 16,
                    fontSize: 11,
                    letterSpacing: 2,
                  }}>
                    {g.label.toUpperCase()}
                  </Text>

                  <View style={{ gap: 10 }}>
                    {g.list.map((r, idx) => {
                      const isLast = idx === g.list.length - 1;
                      return (
                        <View key={r.id} style={{ flexDirection: 'row', gap: 14 }}>
                          {/* Timeline */}
                          <View style={{ width: 24, alignItems: 'center' }}>
                            <View style={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: 999, 
                              backgroundColor: t.bg,
                              borderWidth: 2,
                              borderColor: t.text,
                              marginTop: 18,
                            }} />
                            {!isLast && (
                              <View style={{ 
                                width: 1.5, 
                                flex: 1, 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', 
                                marginTop: 4,
                              }} />
                            )}
                          </View>
                          
                          {/* Content */}
                          <View style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
                            <GlassCard style={{ padding: 16 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <View style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                                }}>
                                  <MaterialIcons name={typeIcon(r.type)} size={18} color={t.text} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ 
                                    fontWeight: '800', 
                                    color: t.text,
                                    fontSize: 14,
                                    letterSpacing: -0.3,
                                  }}>
                                    {typeLabel(r.type)}
                                  </Text>
                                  <Text style={{ 
                                    color: t.textMuted, 
                                    fontSize: 11, 
                                    marginTop: 2,
                                    fontWeight: '500',
                                    letterSpacing: 0.3,
                                    fontVariant: ['tabular-nums'],
                                  }}>
                                    {r.serviceKM.toLocaleString()} KM · {new Date(r.date).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                              {r.notes ? (
                                <Text style={{ 
                                  color: t.textMuted, 
                                  fontSize: 12, 
                                  marginTop: 4,
                                  lineHeight: 18,
                                  fontWeight: '400',
                                  paddingLeft: 48,
                                }}>
                                  {r.notes}
                                </Text>
                              ) : null}
                            </GlassCard>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </AnimatedListItem>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
