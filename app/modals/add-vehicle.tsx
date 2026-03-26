import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { brand, borderRadius, overdue } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { VehicleType } from '@/types';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

export default function AddVehicleModalScreen() {
  const router = useRouter();
  const addVehicle = useVehicleStore((s) => s.addVehicle);
  const records = useMaintenanceStore((s) => s.records);

  const [vehicleType, setVehicleType] = React.useState<VehicleType>('motorcycle');
  const [brandModel, setBrandModel] = React.useState('');
  const [plate, setPlate] = React.useState('');
  const [year, setYear] = React.useState(() => new Date().getFullYear());
  const [currentKM, setCurrentKM] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, i) => current - i);
  }, []);

  async function onSave() {
    try {
      setError(null);

      const trimmed = brandModel.trim();
      if (!trimmed) return setError('Brand & Model is required.');
      const plateTrimmed = plate.trim();
      if (!plateTrimmed) return setError('License plate is required.');
      if (!Number.isFinite(currentKM) || currentKM <= 0) return setError('Current KM must be greater than 0.');

      const now = new Date().toISOString();
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const vehicle = {
        id,
        name: trimmed,
        plate: plateTrimmed.toUpperCase(),
        type: vehicleType,
        year,
        currentKM: Math.round(currentKM),
        createdAt: now,
        updatedAt: now,
      };

      addVehicle(vehicle);

      const statuses = getMaintenanceStatuses(vehicle, records);
      await cancelAllRemindersForVehicle(vehicle.id);
      await Promise.all(statuses.map((s) => scheduleMaintenanceReminder(vehicle, s)));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch {
      setError('Failed to save vehicle. Please try again.');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 28 }}>
      <LinearGradient
        colors={[brand, '#7C3AED']}
        style={{
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
        }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Add Vehicle</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          Track KM and never miss a service again.
        </Text>
      </LinearGradient>

      <Text style={{ fontWeight: '900', marginBottom: 10 }}>Vehicle Type</Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        <Pressable
          onPress={() => setVehicleType('motorcycle')}
          style={{
            flex: 1,
            borderRadius: borderRadius.card,
            padding: 14,
            minHeight: 92,
            borderWidth: 1,
            borderColor: vehicleType === 'motorcycle' ? brand : '#E2E8F0',
            backgroundColor: vehicleType === 'motorcycle' ? `${brand}22` : 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 28 }}>🏍️</Text>
          <Text style={{ fontWeight: '900', marginTop: 6 }}>Motorcycle</Text>
        </Pressable>
        <Pressable
          onPress={() => setVehicleType('car')}
          style={{
            flex: 1,
            borderRadius: borderRadius.card,
            padding: 14,
            minHeight: 92,
            borderWidth: 1,
            borderColor: vehicleType === 'car' ? brand : '#E2E8F0',
            backgroundColor: vehicleType === 'car' ? `${brand}22` : 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 28 }}>🚗</Text>
          <Text style={{ fontWeight: '900', marginTop: 6 }}>Car</Text>
        </Pressable>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>Brand & Model</Text>
      <TextInput
        value={brandModel}
        onChangeText={setBrandModel}
        placeholder="e.g. Honda Beat"
        autoCapitalize="words"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: 'white',
        }}
      />

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>License Plate</Text>
      <TextInput
        value={plate}
        onChangeText={(t) => setPlate(t.toUpperCase())}
        placeholder="e.g. B 1234 ABC"
        autoCapitalize="characters"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: 'white',
        }}
      />

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>Year</Text>
      <View
        style={{
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginBottom: 14,
          backgroundColor: 'white',
          overflow: 'hidden',
        }}>
        <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))}>
          {years.map((y) => (
            <Picker.Item key={y} label={String(y)} value={y} />
          ))}
        </Picker>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>Current KM</Text>
      <TextInput
        value={String(currentKM)}
        onChangeText={(t) => {
          const parsed = Number(t.replace(/[^0-9]/g, ''));
          setCurrentKM(Number.isFinite(parsed) ? parsed : 0);
        }}
        keyboardType="numeric"
        placeholder="e.g. 12450"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: 'white',
        }}
      />

      {error ? (
        <Text style={{ color: overdue, fontWeight: '900', marginBottom: 12 }}>{error}</Text>
      ) : null}

      <Pressable
        onPress={onSave}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: brandModel.trim() && plate.trim() && currentKM > 0 ? 1 : 0.9,
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>Add Vehicle →</Text>
      </Pressable>
    </ScrollView>
  );
}

