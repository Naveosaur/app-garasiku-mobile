import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import GlassCard from '@/components/ui/GlassCard';
import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { getMaintenanceStatuses, getVehicleWorstStatus } from '@/utils/maintenanceCalc';

export default function VehiclesScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const vehicles = useVehicleStore((s) => s.vehicles);
  const hydratedVehicles = useVehicleStore((s) => s.hydrated);
  const records = useMaintenanceStore((s) => s.records);
  const hydratedMaintenance = useMaintenanceStore((s) => s.hydrated);
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);

  if (!hydratedVehicles || !hydratedMaintenance) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text style={{ color: t.textMuted, fontSize: 13, letterSpacing: 1 }}>LOADING</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />

      {/* Fixed Header */}
      <View style={{
        paddingTop: insets.top + 24,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'transparent',
      }}>
        <View>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            color: t.textSubtle,
            letterSpacing: 2,
            marginBottom: 4,
          }}>
            FLEET
          </Text>
          <Text style={{
            fontSize: 32,
            fontWeight: '900',
            color: t.text,
            letterSpacing: -1.2,
          }}>
            Vehicles
          </Text>
        </View>
      </View>

      {/* Content */}
      {vehicles.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 88,
              height: 88,
              borderRadius: 26,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            }}>
              <MaterialIcons name="directions-car" size={40} color={t.text} />
            </View>
            <Text style={{
              fontSize: 24,
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: 10,
              color: t.text,
              letterSpacing: -0.8,
            }}>
              No Vehicles Yet
            </Text>
            <Text style={{
              color: t.textMuted,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24,
              fontSize: 15,
            }}>
              Tap ADD above to add your first vehicle
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 140, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View style={{ height: 0 }} />}
          ListFooterComponent={
            <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
              <Pressable
                onPress={() => router.push('/modals/add-vehicle')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  borderRadius: borderRadius.card,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                  gap: 10,
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: t.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialIcons name="add" size={18} color={isDark ? '#000000' : '#FFFFFF'} />
                </View>
                <Text style={{
                  color: t.text,
                  fontWeight: '700',
                  fontSize: 14,
                  letterSpacing: -0.2,
                }}>
                  Add Vehicle
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const statuses = getMaintenanceStatuses(item, records);
            const worst = getVehicleWorstStatus(statuses);

            let badgeText = 'SAFE';
            let badgeBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
            let badgeFg = t.textMuted;
            let badgeBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

            if (worst === 'overdue') {
              badgeText = 'OVERDUE';
              badgeBg = isDark ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)';
              badgeFg = overdue;
              badgeBorder = isDark ? 'rgba(220,38,38,0.30)' : 'rgba(220,38,38,0.20)';
            } else if (worst === 'soon') {
              badgeText = 'DUE SOON';
              badgeBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
              badgeFg = t.text;
              badgeBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)';
            }

            return (
              <Pressable
                onPress={() => {
                  setRecentVehicle(item.id);
                  router.push(`/vehicle/${item.id}`);
                }}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <GlassCard style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: t.text,
                        fontWeight: '800',
                        fontSize: 18,
                        letterSpacing: -0.5,
                        marginBottom: 4,
                      }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{
                        color: t.textMuted,
                        fontSize: 13,
                        fontWeight: '500',
                        marginBottom: 12,
                        fontVariant: ['tabular-nums'],
                      }} numberOfLines={1}>
                        {item.plate} · {item.currentKM.toLocaleString()} KM
                      </Text>
                      <View style={{
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: badgeBg,
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: badgeBorder,
                      }}>
                        <Text style={{
                          color: badgeFg,
                          fontSize: 10,
                          fontWeight: '700',
                          letterSpacing: 1.2,
                        }}>
                          {badgeText}
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    }}>
                      <MaterialIcons name="chevron-right" size={22} color={t.textMuted} />
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
