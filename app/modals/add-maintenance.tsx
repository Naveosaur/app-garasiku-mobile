import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceType } from '@/types';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

const MAINTENANCE_TYPES: MaintenanceType[] = ['oil_change', 'brake_pads', 'battery', 'general_service'];

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
    .replaceAll('_', ' ')
    .split(' ')
    .map((w) => (w.length ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
    .join(' ');
}

/**
 * Tesla-inspired Add Maintenance Modal
 */
export default function AddMaintenanceModalScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ vehicleId?: string }>();

  const vehicleIdParam = params.vehicleId;
  const vehicleId = Array.isArray(vehicleIdParam) ? vehicleIdParam[0] : vehicleIdParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const addRecord = useMaintenanceStore((s) => s.addRecord);

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const [selectedType, setSelectedType] = React.useState<MaintenanceType>('oil_change');
  const [serviceKM, setServiceKM] = React.useState<number>(vehicle?.currentKM ?? 0);
  const [serviceDate, setServiceDate] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [kmFocused, setKmFocused] = React.useState(false);
  const [notesFocused, setNotesFocused] = React.useState(false);

  React.useEffect(() => {
    if (vehicle?.id) setServiceKM(vehicle.currentKM);
  }, [vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spring entrance
  const scale = useSharedValue(0.94);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: animation.duration.normal, easing: animation.easing });
    scale.value = withSpring(1, animation.spring);
  }, []);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  async function onSave() {
    try {
      setError(null);
      if (!vehicle) return setError('Vehicle not found');
      if (!selectedType) return setError('Please select a service type');
      if (!Number.isFinite(serviceKM) || serviceKM <= 0) return setError('Service KM must be greater than 0');

      const record = {
        vehicleId: vehicle.id,
        type: selectedType,
        serviceKM: Math.round(serviceKM),
        date: serviceDate.toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      };

      await addRecord(record);
      const nextRecords = useMaintenanceStore.getState().getRecordsForVehicle(vehicle.id);
      const statuses = getMaintenanceStatuses(vehicle, nextRecords);

      await cancelAllRemindersForVehicle(vehicle.id);
      await Promise.all(statuses.map((s) => scheduleMaintenanceReminder(vehicle, s)));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch {
      setError('Failed to save maintenance record. Please try again.');
    }
  }

  const surfaceOverlay = isDark ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.85)';

  if (!vehicleId || !vehicle) {
    return (
      <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceOverlay }]} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontWeight: '800', marginBottom: 12, color: t.text, fontSize: 18, letterSpacing: -0.5 }}>
            Vehicle not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ borderRadius: borderRadius.button, overflow: 'hidden', alignSelf: 'flex-start' }}
          >
            <View
              style={{ 
                height: 48, 
                paddingHorizontal: 24, 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: t.brand,
              }}
            >
              <Text style={{ 
                color: isDark ? '#000000' : '#FFFFFF', 
                fontWeight: '700',
                letterSpacing: 1,
              }}>
                GO BACK
              </Text>
            </View>
          </Pressable>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceOverlay }]} />
      <Animated.View style={[{ flex: 1 }, sheetStyle]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
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
              }}>
                Add Service
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => ({
                width: 44, 
                height: 44, 
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="close" size={22} color={t.text} />
            </Pressable>
          </View>

          {/* Service Type Grid */}
          <Label text="SERVICE TYPE" t={t} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {MAINTENANCE_TYPES.map((type) => {
              const active = selectedType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  accessibilityRole="button"
                  accessibilityLabel={typeLabel(type)}
                  style={({ pressed }) => ({
                    width: '47%', 
                    borderRadius: borderRadius.card, 
                    padding: 18, 
                    minHeight: 100,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? t.brand : t.border,
                    backgroundColor: active 
                      ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                      : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 10,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <MaterialIcons 
                    name={typeIcon(type)} 
                    size={24} 
                    color={t.text} 
                  />
                  <Text style={{ 
                    fontWeight: '700', 
                    textAlign: 'center', 
                    color: t.text, 
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                  }}>
                    {typeLabel(type)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* KM at Service */}
          <Label text="MILEAGE AT SERVICE" t={t} />
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            height: 52,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: kmFocused ? t.brand : t.inputBorder,
            paddingHorizontal: 16,
            marginBottom: 16,
            backgroundColor: t.inputBg,
          }}>
            <TextInput
              value={String(serviceKM)}
              onChangeText={(v) => {
                const parsed = Number(v.replaceAll(/\D/g, ''));
                setServiceKM(Number.isFinite(parsed) ? parsed : 0);
              }}
              onFocus={() => setKmFocused(true)}
              onBlur={() => setKmFocused(false)}
              keyboardType="numeric"
              placeholderTextColor={t.textSubtle}
              accessibilityLabel="KM at service"
              style={{
                flex: 1,
                color: t.text, 
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: -0.3,
                fontVariant: ['tabular-nums'],
              }}
            />
            <Text style={{ 
              color: t.textMuted, 
              fontSize: 12, 
              fontWeight: '700',
              letterSpacing: 1,
            }}>
              KM
            </Text>
          </View>

          {/* Date */}
          <Label text="SERVICE DATE" t={t} />
          <Pressable
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 52, 
              borderRadius: borderRadius.input, 
              borderWidth: 1,
              borderColor: t.inputBorder, 
              paddingHorizontal: 16,
              marginBottom: 16, 
              backgroundColor: t.inputBg,
              flexDirection: 'row',
              alignItems: 'center', 
              justifyContent: 'space-between',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ 
              fontWeight: '600', 
              color: t.text,
              fontSize: 15,
              letterSpacing: -0.2,
            }}>
              {serviceDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <MaterialIcons name="calendar-today" size={18} color={t.textMuted} />
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={serviceDate}
              mode="date"
              display="default"
              onChange={(_event, date) => {
                setShowDatePicker(false);
                if (date) setServiceDate(date);
              }}
            />
          ) : null}

          {/* Notes */}
          <Label text="NOTES (OPTIONAL)" t={t} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
            placeholder="e.g. Changed oil and filter"
            placeholderTextColor={t.textSubtle}
            multiline
            numberOfLines={4}
            accessibilityLabel="Notes"
            style={{
              borderRadius: borderRadius.input, 
              borderWidth: 1, 
              borderColor: notesFocused ? t.brand : t.inputBorder,
              paddingHorizontal: 16, 
              paddingVertical: 14, 
              marginBottom: 20,
              backgroundColor: t.inputBg, 
              color: t.text, 
              minHeight: 100, 
              fontSize: 15,
              fontWeight: '500',
              letterSpacing: -0.2,
              textAlignVertical: 'top',
            }}
          />

          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'rgba(220, 38, 38, 0.10)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(220, 38, 38, 0.20)',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: overdue }} />
              <Text style={{ color: overdue, fontWeight: '600', fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            style={({ pressed }) => ({ 
              borderRadius: borderRadius.button, 
              overflow: 'hidden',
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              marginTop: 8,
              shadowColor: isDark ? '#FFFFFF' : '#000000',
              shadowOpacity: isDark ? 0.15 : 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            })}
          >
            <View
              style={{ 
                height: 58, 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: t.brand,
              }}
            >
              <Text style={{ 
                color: isDark ? '#000000' : '#FFFFFF', 
                fontWeight: '700', 
                fontSize: 15,
                letterSpacing: 1,
              }}>
                SAVE RECORD
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </BlurView>
  );
}

function Label({ text, t }: Readonly<{ text: string; t: ReturnType<typeof useAppTheme> }>) {
  return (
    <Text style={{ 
      fontWeight: '700', 
      marginBottom: 10, 
      color: t.textMuted, 
      fontSize: 11,
      letterSpacing: 1.5,
    }}>
      {text}
    </Text>
  );
}
