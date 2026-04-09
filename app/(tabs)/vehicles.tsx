import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import React from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { borderRadius, useAppTheme, safe, soon, overdue, cardShadowStyle } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle } from '@/utils/notifications';
import { getMaintenanceStatuses, getVehicleWorstStatus } from '@/utils/maintenanceCalc';

const statusColor = (status: 'safe' | 'soon' | 'overdue') => {
  if (status === 'overdue') return overdue;
  if (status === 'soon') return soon;
  return safe;
};

export default function VehiclesScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const vehicles = useVehicleStore((s) => s.vehicles);
  const hydratedVehicles = useVehicleStore((s) => s.hydrated);
  const records = useMaintenanceStore((s) => s.records);
  const hydratedMaintenance = useMaintenanceStore((s) => s.hydrated);
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);
  const deleteVehicle = useVehicleStore((s) => s.deleteVehicle);

  if (!hydratedVehicles || !hydratedMaintenance) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 70, marginBottom: 16 }}>🏍️</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 8, color: t.text }}>
            Add Your First Vehicle
          </Text>
          <Text style={{ color: t.textMuted, textAlign: 'center', marginBottom: 22 }}>
            Track KM and never miss a service again
          </Text>
          <Pressable
            onPress={() => router.push('/modals/add-vehicle')}
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: borderRadius.button,
              backgroundColor: t.brand,
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

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: t.bg }}>
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: t.text }}>Vehicles</Text>
        <Pressable
          onPress={() => router.push('/modals/add-vehicle')}
          style={{
            height: 44,
            width: 44,
            borderRadius: borderRadius.button,
            backgroundColor: t.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MaterialIcons name="add" size={22} color="white" />
        </Pressable>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const statuses = getMaintenanceStatuses(item, records);
          const worst = getVehicleWorstStatus(statuses);
          const badgeText = worst === 'overdue' ? 'OVERDUE' : worst === 'soon' ? 'SERVICE SOON' : 'SAFE';
          const badgeBg =
            worst === 'overdue' ? t.overdueBadgeBg : worst === 'soon' ? t.soonBadgeBg : t.safeBadgeBg;
          const badgeColor = statusColor(worst);

          return (
            <View
              style={{
                borderRadius: borderRadius.card,
                padding: 14,
                overflow: 'hidden',
                backgroundColor: t.surface,
                borderWidth: 1,
                borderColor: t.border,
                ...cardShadowStyle(isDark),
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: t.textMuted, marginTop: 4 }} numberOfLines={1}>
                    {item.plate}
                  </Text>
                  <View
                    style={{
                      marginTop: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      backgroundColor: badgeBg,
                      alignSelf: 'flex-start',
                    }}>
                    <Text style={{ color: badgeColor, fontSize: 11, fontWeight: '900' }}>
                      {badgeText}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      setRecentVehicle(item.id);
                      router.push(`/vehicle/${item.id}`);
                    }}
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: 14,
                      backgroundColor: t.bgSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons name="chevron-right" size={22} color={t.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Alert.alert('Delete vehicle?', 'This will remove the vehicle and its history.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await cancelAllRemindersForVehicle(item.id);
                            deleteVehicle(item.id);
                          },
                        },
                      ]);
                    }}
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: 14,
                      backgroundColor: t.bgSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons name="delete" size={20} color={overdue} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

