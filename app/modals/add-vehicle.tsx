import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { borderRadius, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { VehicleType } from '@/types';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

export default function AddVehicleModalScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const addVehicle = useVehicleStore((s) => s.addVehicle);
  const records = useMaintenanceStore((s) => s.records);

  const [vehicleType, setVehicleType] = React.useState<VehicleType>('motorcycle');
  const [vehicleName, setVehicleName] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [model, setModel] = React.useState('');
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

      const nameTrimmed = vehicleName.trim();
      const brandTrimmed = brand.trim();
      const modelTrimmed = model.trim();
      const plateTrimmed = plate.trim();

      if (!brandTrimmed) return setError('Brand is required.');
      if (!modelTrimmed) return setError('Model is required.');
      if (!plateTrimmed) return setError('License plate is required.');
      if (!Number.isFinite(currentKM) || currentKM <= 0) return setError('Current KM must be greater than 0.');

      // Use provided name, or fall back to "Brand Model"
      const finalName = nameTrimmed || `${brandTrimmed} ${modelTrimmed}`;

      const now = new Date().toISOString();
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const vehicle = {
        id,
        name: finalName,
        brand: brandTrimmed,
        model: modelTrimmed,
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
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: insets.top + 16, paddingBottom: 28, backgroundColor: t.bg }}>
      {/* Header with Close Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: t.text }}>Add Vehicle</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: borderRadius.button,
            backgroundColor: t.bgSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MaterialIcons name="close" size={20} color={t.text} />
        </Pressable>
      </View>

      {/* Vehicle Type Selection */}
      <Text style={{ fontWeight: '900', marginBottom: 10, color: t.text, fontSize: 13 }}>Vehicle Type</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <Pressable
          onPress={() => setVehicleType('motorcycle')}
          style={{
            flex: 1,
            borderRadius: borderRadius.card,
            padding: 14,
            minHeight: 80,
            borderWidth: 2,
            borderColor: vehicleType === 'motorcycle' ? t.brand : t.border,
            backgroundColor: vehicleType === 'motorcycle' ? t.brandMuted : t.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 28, marginBottom: 6 }}>🏍️</Text>
          <Text style={{ fontWeight: '700', color: t.text, fontSize: 13 }}>Motorcycle</Text>
        </Pressable>
        <Pressable
          onPress={() => setVehicleType('car')}
          style={{
            flex: 1,
            borderRadius: borderRadius.card,
            padding: 14,
            minHeight: 80,
            borderWidth: 2,
            borderColor: vehicleType === 'car' ? t.brand : t.border,
            backgroundColor: vehicleType === 'car' ? t.brandMuted : t.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 28, marginBottom: 6 }}>🚗</Text>
          <Text style={{ fontWeight: '700', color: t.text, fontSize: 13 }}>Car</Text>
        </Pressable>
      </View>

      {/* Vehicle Name (Optional) */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>Name This Vehicle (Optional)</Text>
      <TextInput
        value={vehicleName}
        onChangeText={setVehicleName}
        placeholder="e.g. My Honda"
        placeholderTextColor={t.textSubtle}
        autoCapitalize="words"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      {/* Brand */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>Brand</Text>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. Honda"
        placeholderTextColor={t.textSubtle}
        autoCapitalize="words"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      {/* Model */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>Model</Text>
      <TextInput
        value={model}
        onChangeText={setModel}
        placeholder="e.g. Beat"
        placeholderTextColor={t.textSubtle}
        autoCapitalize="words"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      {/* License Plate */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>License Plate</Text>
      <TextInput
        value={plate}
        onChangeText={(t) => setPlate(t.toUpperCase())}
        placeholder="e.g. B 1234 ABC"
        placeholderTextColor={t.textSubtle}
        autoCapitalize="characters"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      {/* Year */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>Year</Text>
      <View
        style={{
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          overflow: 'hidden',
        }}>
        <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))}>
          {years.map((y) => (
            <Picker.Item key={y} label={String(y)} value={y} />
          ))}
        </Picker>
      </View>

      {/* Current KM */}
      <Text style={{ fontWeight: '700', marginBottom: 6, color: t.text, fontSize: 13 }}>Current KM</Text>
      <TextInput
        value={String(currentKM)}
        onChangeText={(t) => {
          const parsed = Number(t.replace(/[^0-9]/g, ''));
          setCurrentKM(Number.isFinite(parsed) ? parsed : 0);
        }}
        keyboardType="numeric"
        placeholder="e.g. 12450"
        placeholderTextColor={t.textSubtle}
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 16,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      {error ? (
        <Text style={{ color: '#EF4444', fontWeight: '700', marginBottom: 16, fontSize: 13 }}>{error}</Text>
      ) : null}

      <Pressable
        onPress={onSave}
        disabled={!brand.trim() || !model.trim() || !plate.trim() || currentKM <= 0}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: t.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: brand.trim() && model.trim() && plate.trim() && currentKM > 0 ? 1 : 0.5,
        }}>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Add Vehicle</Text>
      </Pressable>
    </ScrollView>
  );
}
