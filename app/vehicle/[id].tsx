import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import MaintenanceProgressRow from '@/components/MaintenanceProgressRow';
import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceStatus } from '@/types';
import { getMaintenanceStatuses, getVehicleWorstStatus } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

/**
 * Tesla-inspired Vehicle Detail Screen
 * Minimal monochrome with premium glass feel
 */
export default function VehicleDetailScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';

  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = params.id;
  const vehicleId = Array.isArray(idParam) ? idParam[0] : idParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);
  const deleteVehicle = useVehicleStore((s) => s.deleteVehicle);
  const hydratedVehicles = useVehicleStore((s) => s.hydrated);

  // Get all records from store, then filter/sort in useMemo to prevent infinite loops
  const allRecords = useMaintenanceStore((s) => s.records);
  const hydratedMaintenance = useMaintenanceStore((s) => s.hydrated);

  const records = React.useMemo(() => {
    if (!vehicleId) return [];
    return allRecords
      .filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, vehicleId]);

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

  // Use lazy initializer - set once at mount, never sync from store again
  const [kmInput, setKmInput] = React.useState<string>(
    () => String(vehicle?.currentKM ?? 0)
  );
  const [kmFocused, setKmFocused] = React.useState(false);
  const [kmSaved, setKmSaved] = React.useState(false);

  // NO useEffect for init - lazy initializer handles it
  // This prevents any re-sync from store after user edits

  const kmValue = Number(kmInput.replace(/\D/g, '') || '0');

  // Debounced auto-save - exact same pattern as Home screen
  React.useEffect(() => {
    if (!vehicle) return;
    if (!hydratedVehicles || !hydratedMaintenance) return;

    const prevVehicle = vehicle;

    const timer = setTimeout(() => {
      if (kmValue === prevVehicle.currentKM) return;

      const currentRecords = useMaintenanceStore
        .getState()
        .records.filter((r) => r.vehicleId === prevVehicle.id);

      const prevStatuses = getMaintenanceStatuses(prevVehicle, currentRecords);
      const nextVehicle = { ...prevVehicle, currentKM: kmValue, updatedAt: new Date().toISOString() };
      const nextStatuses = getMaintenanceStatuses(nextVehicle, currentRecords);
      const prevByType = Object.fromEntries(prevStatuses.map((s) => [s.type, s]));

      const transitionsToSafe = nextStatuses.some(
        (ns) => ns.status === 'safe' && prevByType[ns.type]?.status !== 'safe',
      );
      const shouldSchedule = nextStatuses.filter((ns) => {
        const ps = prevByType[ns.type];
        if (!ps) return false;
        return (
          (ps.status === 'safe' && ns.status !== 'safe') ||
          (ns.status === 'overdue' && ps.status !== 'overdue')
        );
      });

      useVehicleStore.getState().updateKM(prevVehicle.id, kmValue);

      (async () => {
        if (transitionsToSafe) await cancelAllRemindersForVehicle(prevVehicle.id);
        if (shouldSchedule.length > 0) {
          await Promise.all(shouldSchedule.map((ns) => scheduleMaintenanceReminder(nextVehicle, ns)));
        }
      })().catch(() => undefined);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      setKmSaved(true);
      setTimeout(() => setKmSaved(false), 2000);
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kmValue]);

  if (!hydratedVehicles || !hydratedMaintenance) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text style={{ color: t.textMuted, fontSize: 13, letterSpacing: 1 }}>LOADING</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
        <Text style={{ fontWeight: '800', marginBottom: 16, color: t.text, fontSize: 20, letterSpacing: -0.5 }}>
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
          }}
        >
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

  // Status badge styling
  let statusBadgeBg: string;
  let statusBadgeFg: string;
  let statusBadgeBorder: string;
  let statusLabel: string;
  
  if (worstStatus === 'overdue') {
    statusBadgeBg = 'rgba(220, 38, 38, 0.15)';
    statusBadgeFg = overdue;
    statusBadgeBorder = 'rgba(220, 38, 38, 0.30)';
    statusLabel = 'OVERDUE';
  } else if (worstStatus === 'soon') {
    statusBadgeBg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
    statusBadgeFg = t.text;
    statusBadgeBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
    statusLabel = 'DUE SOON';
  } else {
    statusBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    statusBadgeFg = t.textMuted;
    statusBadgeBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
    statusLabel = 'SAFE';
  }

  const kmLeft = oilStatus ? oilStatus.remainingKM : 0;
  const recentRecords = records.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 64, paddingBottom: 24 }}>
          {/* Top row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => ({
                width: 44, 
                height: 44, 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="arrow-back" size={22} color={t.text} />
            </Pressable>

            <View style={{ 
              backgroundColor: statusBadgeBg, 
              paddingVertical: 6, 
              paddingHorizontal: 12, 
              borderRadius: 999,
              borderWidth: 1,
              borderColor: statusBadgeBorder,
            }}>
              <Text style={{ 
                color: statusBadgeFg, 
                fontWeight: '700', 
                fontSize: 10, 
                letterSpacing: 1.2,
              }}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Vehicle name + plate */}
          <Text style={{ 
            color: t.textSubtle, 
            fontSize: 11, 
            fontWeight: '700',
            letterSpacing: 2,
            marginBottom: 6,
          }}>
            {vehicle.plate}
          </Text>
          <Text style={{ 
            color: t.text, 
            fontSize: 36, 
            fontWeight: '900', 
            letterSpacing: -1.5, 
            marginBottom: 6,
          }}>
            {vehicle.name}
          </Text>
          <Text style={{ 
            color: t.textMuted, 
            fontSize: 14,
            fontWeight: '500',
          }}>
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 28 }}>
            {[
              { label: 'MILEAGE', value: vehicle.currentKM.toLocaleString(), unit: 'KM' },
              { label: 'NEXT OIL', value: (oilStatus?.nextServiceKM ?? 0).toLocaleString(), unit: 'KM' },
              { label: 'REMAINING', value: Math.max(0, kmLeft).toLocaleString(), unit: 'KM' },
            ].map((item) => (
              <GlassCard key={item.label} style={{ flex: 1, padding: 14 }}>
                <Text style={{ 
                  color: t.textSubtle, 
                  fontSize: 9, 
                  marginBottom: 6, 
                  fontWeight: '700',
                  letterSpacing: 1.2,
                }}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                  <Text style={{ 
                    color: t.text, 
                    fontWeight: '800', 
                    fontSize: 16, 
                    letterSpacing: -0.5,
                    fontVariant: ['tabular-nums'],
                  }}>
                    {item.value}
                  </Text>
                  <Text style={{ 
                    color: t.textMuted, 
                    fontSize: 9, 
                    fontWeight: '700',
                    letterSpacing: 0.8,
                  }}>
                    {item.unit}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* KM Update */}
          <AnimatedListItem index={0}>
            <View style={{ marginBottom: 28 }}>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
                marginBottom: 12,
              }}>
                UPDATE MILEAGE
              </Text>
              <GlassCard style={{ padding: 20 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: t.inputBg,
                  borderRadius: borderRadius.input,
                  borderWidth: 1,
                  borderColor: kmFocused ? t.brand : t.inputBorder,
                  paddingHorizontal: 16,
                  height: 56,
                  marginBottom: 14,
                }}>
                  <TextInput
                    value={kmInput}
                    onChangeText={(val) => {
                      setKmInput(val.replace(/\D/g, ''));
                    }}
                    onFocus={() => setKmFocused(true)}
                    onBlur={() => setKmFocused(false)}
                    keyboardType="numeric"
                    placeholderTextColor={t.textSubtle}
                    accessibilityLabel="Vehicle KM"
                    style={{
                      flex: 1,
                      color: t.text, 
                      fontSize: 22, 
                      fontWeight: '800',
                      letterSpacing: -0.5,
                      fontVariant: ['tabular-nums'],
                    }}
                  />
                  <Text style={{ 
                    color: t.textMuted, 
                    fontSize: 14, 
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}>
                    KM
                  </Text>
                </View>

                {/* Status indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <View style={{ 
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: kmSaved ? '#22C55E' : t.textMuted,
                  }} />
                  <Text style={{ 
                    color: kmSaved ? '#22C55E' : t.textMuted, 
                    fontSize: 11, fontWeight: '500', letterSpacing: 0.3,
                  }}>
                    {kmSaved ? 'Saved!' : 'Auto-saves after 800ms'}
                  </Text>
                </View>
              </GlassCard>
            </View>
          </AnimatedListItem>

          {/* Maintenance Status */}
          <AnimatedListItem index={1}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                MAINTENANCE
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: t.textMuted,
                fontWeight: '500',
              }}>
                Tap + to log a new service
              </Text>
            </View>
          </AnimatedListItem>

          {/* Add Record CTA - Prominent card */}
          <AnimatedListItem index={2}>
            <Pressable
              onPress={() => router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicle.id)}`)}
              accessibilityRole="button"
              accessibilityLabel="Add maintenance record"
              style={({ pressed }) => ({
                marginBottom: 12,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: borderRadius.card,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  borderStyle: 'dashed',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: t.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <MaterialIcons 
                    name="add" 
                    size={24} 
                    color={isDark ? '#000000' : '#FFFFFF'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: t.text,
                    fontWeight: '800',
                    fontSize: 14,
                    letterSpacing: -0.3,
                    marginBottom: 2,
                  }}>
                    Add Service Record
                  </Text>
                  <Text style={{
                    color: t.textMuted,
                    fontSize: 12,
                    fontWeight: '500',
                  }}>
                    Log maintenance or service
                  </Text>
                </View>
                <MaterialIcons 
                  name="chevron-right" 
                  size={22} 
                  color={t.textMuted} 
                />
              </View>
            </Pressable>
          </AnimatedListItem>

          <View style={{ gap: 10, marginBottom: 28 }}>
            {statuses.map((s: MaintenanceStatus, i) => (
              <MaintenanceProgressRow key={s.type} status={s} index={i + 2} />
            ))}
          </View>

          {/* Recent History */}
          <AnimatedListItem index={statuses.length + 2}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
              }}>
                RECENT HISTORY
              </Text>
              <Pressable
                onPress={() => router.push(`/vehicle/${vehicle.id}/history`)}
                style={({ pressed }) => ({ 
                  paddingVertical: 6, 
                  paddingHorizontal: 10,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ 
                  color: t.text, 
                  fontWeight: '700', 
                  fontSize: 11,
                  letterSpacing: 1,
                }}>
                  VIEW ALL
                </Text>
              </Pressable>
            </View>
          </AnimatedListItem>

          {recentRecords.length === 0 ? (
            <AnimatedListItem index={statuses.length + 3}>
              <GlassCard style={{ padding: 20 }}>
                <Text style={{ 
                  fontWeight: '800', 
                  marginBottom: 6, 
                  color: t.text,
                  fontSize: 15,
                  letterSpacing: -0.3,
                }}>
                  No records yet
                </Text>
                <Text style={{ 
                  color: t.textMuted, 
                  fontSize: 13, 
                  marginBottom: 16,
                  fontWeight: '500',
                }}>
                  Start tracking your service history
                </Text>
                <Pressable
                  onPress={() => router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(vehicle.id)}`)}
                  style={({ pressed }) => ({ 
                    borderRadius: borderRadius.button, 
                    overflow: 'hidden', 
                    alignSelf: 'flex-start',
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{ 
                      height: 44, 
                      paddingHorizontal: 20, 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: t.brand,
                    }}
                  >
                    <Text style={{ 
                      color: isDark ? '#000000' : '#FFFFFF', 
                      fontWeight: '700', 
                      fontSize: 12,
                      letterSpacing: 1,
                    }}>
                      ADD RECORD
                    </Text>
                  </View>
                </Pressable>
              </GlassCard>
            </AnimatedListItem>
          ) : (
            <View style={{ gap: 10 }}>
              {recentRecords.map((r, i) => (
                <AnimatedListItem key={r.id} index={statuses.length + 3 + i}>
                  <GlassCard style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontWeight: '800', 
                          color: t.text, 
                          letterSpacing: -0.3,
                          fontSize: 14,
                          textTransform: 'capitalize',
                          marginBottom: 4,
                        }}>
                          {r.type.replaceAll('_', ' ')}
                        </Text>
                        <Text style={{ 
                          color: t.textMuted, 
                          fontSize: 12,
                          fontWeight: '500',
                          letterSpacing: 0.2,
                          fontVariant: ['tabular-nums'],
                        }}>
                          {r.serviceKM.toLocaleString()} KM · {new Date(r.date).toLocaleDateString()}
                        </Text>
                        {r.notes ? (
                          <Text style={{ 
                            color: t.textMuted, 
                            fontSize: 12, 
                            marginTop: 6,
                            fontWeight: '400',
                            lineHeight: 18,
                          }}>
                            {r.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </GlassCard>
                </AnimatedListItem>
              ))}
            </View>
          )}

          {/* Delete Vehicle Button */}
          <AnimatedListItem index={statuses.length + 10}>
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                  Alert.alert(
                    'Delete Vehicle?',
                    `This will permanently remove ${vehicle.name} and all its maintenance records. This action cannot be undone.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await cancelAllRemindersForVehicle(vehicle.id);
                          await deleteVehicle(vehicle.id);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
                          router.back();
                        },
                      },
                    ],
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete vehicle"
                style={({ pressed }) => ({
                  paddingHorizontal: 36,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(220,38,38,0.25)',
                  backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)',
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <Text style={{
                  color: overdue,
                  fontWeight: '800',
                  fontSize: 14,
                  letterSpacing: 1.2,
                }}>
                  DELETE VEHICLE
                </Text>
              </Pressable>
              
              <Text style={{
                color: t.textSubtle,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 10,
                fontWeight: '500',
                letterSpacing: -0.1,
                maxWidth: 280,
              }}>
                Permanently removes vehicle and all maintenance records
              </Text>
            </View>
          </AnimatedListItem>
        </View>
      </ScrollView>
    </View>
  );
}
