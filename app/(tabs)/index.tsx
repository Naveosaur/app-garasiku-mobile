import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import VehicleCard from '@/components/VehicleCard';
import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

/**
 * Tesla-inspired Dashboard
 * Minimal, monochrome, premium feel
 */
export default function DashboardScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

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

  // Header entrance
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-10);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: animation.duration.normal, easing: animation.easing });
    headerY.value = withDelay(40, withTiming(0, { duration: animation.duration.normal, easing: animation.easing }));
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  // KM input focus
  const [kmFocused, setKmFocused] = React.useState(false);

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

  const [kmDraft, setKmDraft] = React.useState<number>(targetVehicle?.currentKM ?? 0);
  
  // Sync kmDraft when vehicle changes (different vehicle or external update)
  React.useEffect(() => {
    setKmDraft(targetVehicle?.currentKM ?? 0);
  }, [targetVehicle?.id, targetVehicle?.currentKM]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!targetVehicle) return;
    if (!vehicleHydrated || !maintenanceHydrated) return;

    const timer = setTimeout(() => {
      if (kmDraft === targetVehicle.currentKM) return;

      const prevVehicle = targetVehicle;
      const prevStatuses = getMaintenanceStatuses(prevVehicle, records);
      const nextVehicle = { ...prevVehicle, currentKM: kmDraft, updatedAt: new Date().toISOString() };
      const nextStatuses = getMaintenanceStatuses(nextVehicle, records);
      const prevByType = Object.fromEntries(prevStatuses.map((s) => [s.type, s]));

      const transitionsToSafe = nextStatuses.some(
        (ns) => ns.status === 'safe' && prevByType[ns.type]?.status !== 'safe',
      );
      const shouldSchedule = nextStatuses.filter((ns) => {
        const ps = prevByType[ns.type];
        if (!ps) return false;
        return (ps.status === 'safe' && ns.status !== 'safe') ||
          (ns.status === 'overdue' && ps.status !== 'overdue');
      });

      useVehicleStore.getState().updateKM(prevVehicle.id, kmDraft);

      (async () => {
        if (transitionsToSafe) await cancelAllRemindersForVehicle(prevVehicle.id);
        if (shouldSchedule.length > 0) {
          await Promise.all(shouldSchedule.map((ns) => scheduleMaintenanceReminder(nextVehicle, ns)));
        }
      })().catch(() => undefined);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }, 800);

    return () => clearTimeout(timer);
  }, [kmDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!vehicleHydrated || !maintenanceHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, paddingTop: insets.top }}>
        <Text style={{ color: t.textMuted, fontSize: 13, letterSpacing: 1 }}>LOADING</Text>
      </View>
    );
  }

  // Empty State
  if (vehicles.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <AmbientBackground />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 24 }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 88, 
                height: 88, 
                borderRadius: 26,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 28,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <MaterialIcons name="directions-car" size={40} color={t.text} />
            </View>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '900', 
              textAlign: 'center', 
              marginBottom: 10, 
              color: t.text, 
              letterSpacing: -1,
            }}>
              Add Your First Vehicle
            </Text>
            <Text style={{ 
              color: t.textMuted, 
              textAlign: 'center', 
              marginBottom: 36, 
              lineHeight: 24,
              fontSize: 15,
              maxWidth: 280,
            }}>
              Track mileage and never miss a service again
            </Text>
            <Pressable
              onPress={() => router.push('/modals/add-vehicle')}
              style={({ pressed }) => ({ 
                borderRadius: borderRadius.button, 
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: isDark ? '#FFFFFF' : '#000000',
                shadowOpacity: isDark ? 0.15 : 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              })}
            >
              <View
                style={{ 
                  height: 52, 
                  paddingHorizontal: 32, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: t.brand,
                }}
              >
                <Text style={{ 
                  color: isDark ? '#000000' : '#FFFFFF', 
                  fontWeight: '700', 
                  fontSize: 14,
                  letterSpacing: 1,
                }}>
                  ADD VEHICLE
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const showVerticalList = vehicles.length <= 2;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Tesla style */}
        <Animated.View style={[{ marginBottom: 32 }, headerStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: t.textSubtle, 
                fontSize: 11, 
                letterSpacing: 2,
                fontWeight: '700',
                marginBottom: 6,
              }}>
                {greeting.toUpperCase()}
              </Text>
              <Text style={{ 
                color: t.text, 
                fontSize: 32, 
                fontWeight: '900', 
                letterSpacing: -1.2,
              }}>
                {userName || 'Welcome'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/reminders')}
              accessibilityRole="button"
              accessibilityLabel="Reminders"
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
              <MaterialIcons name="notifications-none" size={22} color={t.text} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Vehicles section */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: '700', 
              color: t.textSubtle, 
              letterSpacing: 2,
            }}>
              YOUR VEHICLES
            </Text>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: '700', 
              color: t.textMuted, 
              letterSpacing: 1,
              fontVariant: ['tabular-nums'],
            }}>
              {vehicles.length} {vehicles.length === 1 ? 'VEHICLE' : 'VEHICLES'}
            </Text>
          </View>
        </AnimatedListItem>

        <AnimatedListItem index={1}>
          <FlatList
            data={vehicles}
            horizontal={!showVerticalList}
            scrollEnabled={!showVerticalList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const statuses = getMaintenanceStatuses(item, records);
              return <VehicleCard vehicle={item} statuses={statuses} index={index} />;
            }}
          />
        </AnimatedListItem>

        {/* Quick KM Update */}
        <AnimatedListItem index={2}>
          <View style={{ marginTop: 32 }}>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: '700', 
              marginBottom: 16, 
              color: t.textSubtle, 
              letterSpacing: 2,
            }}>
              QUICK UPDATE
            </Text>
            {targetVehicle ? (
              <GlassCard style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '800', 
                      color: t.text, 
                      letterSpacing: -0.3,
                      marginBottom: 2,
                    }}>
                      {targetVehicle.name}
                    </Text>
                    <Text style={{ 
                      color: t.textMuted, 
                      fontSize: 12,
                      fontWeight: '500',
                      letterSpacing: 0.2,
                    }}>
                      Current: {targetVehicle.currentKM.toLocaleString()} km
                    </Text>
                  </View>
                  <MaterialIcons name="speed" size={24} color={t.textMuted} />
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: t.inputBg,
                  borderRadius: borderRadius.input,
                  borderWidth: 1,
                  borderColor: kmFocused ? t.brand : t.inputBorder,
                  paddingHorizontal: 16,
                  height: 56,
                }}>
                  <TextInput
                    value={String(kmDraft)}
                    onChangeText={(val) => {
                      const parsed = Number(val.replaceAll(/\D/g, ''));
                      setKmDraft(Number.isFinite(parsed) ? parsed : 0);
                    }}
                    onFocus={() => setKmFocused(true)}
                    onBlur={() => setKmFocused(false)}
                    keyboardType="numeric"
                    placeholderTextColor={t.textSubtle}
                    accessibilityLabel="Update KM"
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
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <View style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: 3, 
                    backgroundColor: t.textMuted,
                  }} />
                  <Text style={{ 
                    color: t.textMuted, 
                    fontSize: 11, 
                    fontWeight: '500',
                    letterSpacing: 0.3,
                  }}>
                    Auto-saves after 800ms
                  </Text>
                </View>
              </GlassCard>
            ) : null}
          </View>
        </AnimatedListItem>

        {/* Reminders */}
        <AnimatedListItem index={3}>
          <View style={{ marginTop: 32 }}>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: '700', 
              marginBottom: 16, 
              color: t.textSubtle, 
              letterSpacing: 2,
            }}>
              ATTENTION REQUIRED
            </Text>
            {urgentReminders.length === 0 ? (
              <GlassCard style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <MaterialIcons name="check" size={22} color={t.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontWeight: '800', 
                      color: t.text, 
                      marginBottom: 2,
                      fontSize: 15,
                      letterSpacing: -0.3,
                    }}>
                      All Systems Normal
                    </Text>
                    <Text style={{ 
                      color: t.textMuted, 
                      fontSize: 12,
                      fontWeight: '500',
                    }}>
                      No pending maintenance tasks
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ) : (
              <View style={{ gap: 10 }}>
                {urgentReminders.map((r, i) => {
                  const isOverdue = r.status === 'overdue';
                  return (
                    <AnimatedListItem key={r.key} index={4 + i}>
                      <Pressable
                        onPress={() => router.push(`/vehicle/${r.vehicleId}`)}
                        style={({ pressed }) => ({ 
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.99 : 1 }],
                        })}
                      >
                        <GlassCard style={{ padding: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: 12, 
                              backgroundColor: isOverdue 
                                ? 'rgba(220, 38, 38, 0.12)' 
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                              alignItems: 'center', 
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: isOverdue
                                ? 'rgba(220, 38, 38, 0.25)'
                                : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
                            }}>
                              <MaterialIcons 
                                name={isOverdue ? 'warning' : 'schedule'} 
                                size={20} 
                                color={isOverdue ? overdue : t.text} 
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text style={{ 
                                  fontWeight: '800', 
                                  color: t.text,
                                  fontSize: 14,
                                  letterSpacing: -0.3,
                                }}>
                                  {r.vehicleName}
                                </Text>
                                <Text style={{ 
                                  color: isOverdue ? overdue : t.textMuted, 
                                  fontSize: 10, 
                                  fontWeight: '700', 
                                  letterSpacing: 1.2,
                                }}>
                                  {isOverdue ? 'OVERDUE' : 'DUE SOON'}
                                </Text>
                              </View>
                              <Text style={{ 
                                color: t.textMuted, 
                                fontSize: 12,
                                fontWeight: '500',
                                textTransform: 'capitalize',
                              }}>
                                {r.type.replaceAll('_', ' ')} · {Math.max(0, r.remainingKM).toLocaleString()} km left
                              </Text>
                            </View>
                          </View>
                        </GlassCard>
                      </Pressable>
                    </AnimatedListItem>
                  );
                })}
              </View>
            )}
          </View>
        </AnimatedListItem>
      </ScrollView>
    </View>
  );
}
