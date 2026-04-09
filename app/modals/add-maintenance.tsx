import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';

import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceType } from '@/types';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';

const MAINTENANCE_TYPES: MaintenanceType[] = ['oil_change', 'brake_pads', 'battery', 'general_service'];

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

function maintenanceTypePretty(type: MaintenanceType) {
  return type.replace(/_/g, ' ');
}

function typeLabel(type: MaintenanceType) {
  const pretty = maintenanceTypePretty(type);
  return pretty
    .split(' ')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function typeCardColor(type: MaintenanceType) {
  if (type === 'oil_change') return 'rgba(99,102,241,0.14)';
  if (type === 'brake_pads') return 'rgba(234,179,8,0.14)';
  if (type === 'battery') return 'rgba(34,197,94,0.14)';
  return 'rgba(239,68,68,0.14)';
}

export default function AddMaintenanceModalScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ vehicleId?: string }>();

  const vehicleIdParam = params.vehicleId;
  const vehicleId = Array.isArray(vehicleIdParam) ? vehicleIdParam[0] : vehicleIdParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const addRecord = useMaintenanceStore((s) => s.addRecord);
  const records = useMaintenanceStore((s) => s.records);

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const [selectedType, setSelectedType] = React.useState<MaintenanceType>('oil_change');
  const [serviceKM, setServiceKM] = React.useState<number>(vehicle?.currentKM ?? 0);
  const [serviceDate, setServiceDate] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (vehicle?.id) setServiceKM(vehicle.currentKM);
  }, [vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSave() {
    try {
      setError(null);
      if (!vehicle) return setError('Vehicle not found.');
      if (!selectedType) return setError('Please select a service type.');
      if (!Number.isFinite(serviceKM) || serviceKM <= 0) return setError('Service KM must be greater than 0.');

      const record = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        vehicleId: vehicle.id,
        type: selectedType,
        serviceKM: Math.round(serviceKM),
        date: serviceDate.toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const nextRecords = [...records, record];
      addRecord(record);

      const statuses = getMaintenanceStatuses(vehicle, nextRecords);

      await cancelAllRemindersForVehicle(vehicle.id);
      await Promise.all(statuses.map((s) => scheduleMaintenanceReminder(vehicle, s)));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch {
      setError('Failed to save maintenance record. Please try again.');
    }
  }

  if (!vehicleId || !vehicle) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, backgroundColor: t.bg }}>
        <Text style={{ fontWeight: '900', marginBottom: 12, color: t.text }}>Vehicle not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            height: 44,
            borderRadius: borderRadius.button,
            backgroundColor: t.brand,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 18,
          }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 28, backgroundColor: t.bg }}>
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
        }}>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: '900' }}>Add Maintenance</Text>
        <Text style={{ color: t.textMuted, marginTop: 6 }}>
          {vehicle.name} • {vehicle.plate}
        </Text>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 10, color: t.text }}>Service Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {MAINTENANCE_TYPES.map((type) => {
          const active = selectedType === type;
          return (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={{
                width: '47%',
                borderRadius: borderRadius.card,
                padding: 14,
                minHeight: 92,
                borderWidth: 1,
                borderColor: active ? t.brand : t.border,
                backgroundColor: active ? t.brandMuted : typeCardColor(type),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialIcons name={typeIcon(type) as any} size={22} color={active ? t.brand : t.textMuted} />
              <Text style={{ fontWeight: '900', marginTop: 8, textAlign: 'center', color: t.text }}>{typeLabel(type)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>KM at Service</Text>
      <TextInput
        value={String(serviceKM)}
        onChangeText={(v) => {
          const parsed = Number(v.replace(/[^0-9]/g, ''));
          setServiceKM(Number.isFinite(parsed) ? parsed : 0);
        }}
        keyboardType="numeric"
        placeholderTextColor={t.textSubtle}
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>Date</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: t.inputBg,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Text style={{ fontWeight: '800', color: t.text }}>{serviceDate.toLocaleDateString()}</Text>
        <MaterialIcons name="calendar-today" size={18} color={t.brand} />
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={serviceDate}
          mode="date"
          display="default"
          onChange={(_event: unknown, date?: Date) => {
            setShowDatePicker(false);
            if (date) setServiceDate(date);
          }}
        />
      ) : null}

      <Text style={{ fontWeight: '900', marginBottom: 6, marginTop: 8, color: t.text }}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Changed oil and filter"
        placeholderTextColor={t.textSubtle}
        multiline
        numberOfLines={4}
        style={{
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 14,
          backgroundColor: t.inputBg,
          color: t.text,
          minHeight: 92,
        }}
      />

      {error ? <Text style={{ color: overdue, fontWeight: '900', marginBottom: 12 }}>{error}</Text> : null}

      <Pressable
        onPress={onSave}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: t.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: selectedType ? 1 : 0.9,
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>Save Record ✓</Text>
      </Pressable>
    </ScrollView>
  );
}

