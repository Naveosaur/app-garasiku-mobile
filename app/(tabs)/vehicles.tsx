import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { borderRadius, brand, cardGradients } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle } from '@/utils/notifications';
import { getMaintenanceStatuses, getVehicleWorstStatus } from '@/utils/maintenanceCalc';

export default function VehiclesScreen() {
  const router = useRouter();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const hydratedVehicles = useVehicleStore((s) => s.hydrated);
  const records = useMaintenanceStore((s) => s.records);
  const hydratedMaintenance = useMaintenanceStore((s) => s.hydrated);
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);
  const deleteVehicle = useVehicleStore((s) => s.deleteVehicle);

  if (!hydratedVehicles || !hydratedMaintenance) {
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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>Vehicles</Text>
        <Pressable
          onPress={() => router.push('/modals/add-vehicle')}
          style={{
            height: 44,
            width: 44,
            borderRadius: borderRadius.button,
            backgroundColor: brand,
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

          return (
            <LinearGradient
              colors={cardGradients[worst]}
              style={{
                borderRadius: borderRadius.card,
                padding: 14,
                overflow: 'hidden',
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }} numberOfLines={1}>
                    {item.plate}
                  </Text>
                  <Text style={{ color: 'white', fontSize: 12, marginTop: 10, fontWeight: '900' }}>
                    {badgeText}
                  </Text>
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
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons name="chevron-right" size={22} color="white" />
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
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons name="delete" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          );
        }}
      />
    </View>
  );
}

