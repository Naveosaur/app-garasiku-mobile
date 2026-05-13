import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animation, overdue } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useServiceTypeStore } from '@/store/serviceTypeStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { ServiceType } from '@/types';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

// Design tokens - consistent throughout the form
const COLORS = {
  text: '#111111',
  textMuted: '#666666',
  textSubtle: '#999999',
  border: 'rgba(0,0,0,0.10)',
  borderFocus: '#111111',
  surface: '#FFFFFF',
  surfaceSubtle: '#FAFAFA',
  surfaceSelected: '#F5F5F5',
  primary: '#111111',
  primaryText: '#FFFFFF',
};

// Consistent vertical rhythm between form fields
const FIELD_GAP = 28;
const LABEL_GAP = 12;

export default function AddMaintenanceModalScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ vehicleId?: string }>();

  const vehicleIdParam = params.vehicleId;
  const vehicleId = Array.isArray(vehicleIdParam) ? vehicleIdParam[0] : vehicleIdParam;

  const vehicles = useVehicleStore((s) => s.vehicles);
  const addRecord = useMaintenanceStore((s) => s.addRecord);
  const { catalogue, loading: catalogueLoading, error: catalogueError, fetchCatalogue } =
    useServiceTypeStore();

  const vehicle = React.useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  const serviceTypes = vehicle ? (catalogue[vehicle.type] ?? []) : [];

  const [selectedType, setSelectedType] = React.useState<ServiceType | null>(null);
  const [showTypePicker, setShowTypePicker] = React.useState(false);
  const [serviceKM, setServiceKM] = React.useState<number>(vehicle?.currentKM ?? 0);
  const [serviceDate, setServiceDate] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [kmFocused, setKmFocused] = React.useState(false);
  const [notesFocused, setNotesFocused] = React.useState(false);

  useEffect(() => {
    if (vehicle?.type) {
      fetchCatalogue(vehicle.type).catch(() => undefined);
    }
  }, [vehicle?.type]);

  useEffect(() => {
    if (serviceTypes.length > 0 && !selectedType) {
      setSelectedType(serviceTypes[0]);
    }
  }, [serviceTypes]);

  React.useEffect(() => {
    if (vehicle?.id) setServiceKM(vehicle.currentKM);
  }, [vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Entrance animation
  const scale = useSharedValue(0.96);
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

      setSaving(true);
      const record = {
        vehicleId: vehicle.id,
        type: 'general_service' as const,
        serviceTypeId: selectedType.id,
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
    } finally {
      setSaving(false);
    }
  }

  const surfaceOverlay = isDark ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.92)';

  if (!vehicleId || !vehicle) {
    return (
      <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceOverlay }]} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontWeight: '800', marginBottom: 12, color: COLORS.text, fontSize: 18 }}>
            Vehicle not found
          </Text>
          <Pressable onPress={() => router.back()}>
            <View style={{
              height: 48, paddingHorizontal: 24, borderRadius: 12,
              backgroundColor: COLORS.primary,
              alignItems: 'center', justifyContent: 'center',
              alignSelf: 'flex-start',
            }}>
              <Text style={{ color: COLORS.primaryText, fontWeight: '700' }}>Go Back</Text>
            </View>
          </Pressable>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceOverlay }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View style={[{ flex: 1 }, sheetStyle]}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: insets.top + 20,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
            }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textSubtle, letterSpacing: 2, marginBottom: 6 }}>
                  {vehicle.plate}
                </Text>
                <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.text, letterSpacing: -1 }}>
                  Add Service
                </Text>
              </View>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                hitSlop={8}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  borderWidth: 1, borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <MaterialIcons name="close" size={20} color={COLORS.text} />
                </View>
              </Pressable>
            </View>

            {/* Service Type - Selector Button */}
            <View style={{ marginBottom: FIELD_GAP }}>
              <FormLabel text="SERVICE TYPE" />
              {catalogueLoading && serviceTypes.length === 0 ? (
                <View style={{
                  height: 60, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: COLORS.surface,
                }}>
                  <ActivityIndicator color={COLORS.text} size="small" />
                </View>
              ) : catalogueError ? (
                <View style={{
                  padding: 14, borderRadius: 14,
                  backgroundColor: 'rgba(220,38,38,0.06)',
                  borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Text style={{ color: overdue, fontWeight: '600', fontSize: 13 }}>Failed to load</Text>
                  <Pressable onPress={() => fetchCatalogue(vehicle.type)}>
                    <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 }}>RETRY</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowTypePicker(true)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{
                    height: 60,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.surface,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    {selectedType ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: 'rgba(0,0,0,0.06)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <MaterialIcons
                            name={(selectedType.icon || 'construction') as React.ComponentProps<typeof MaterialIcons>['name']}
                            size={18}
                            color={COLORS.text}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 }}
                          >
                            {selectedType.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 }}>
                            Every {selectedType.intervalKM.toLocaleString()} KM
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ color: COLORS.textSubtle, fontSize: 15, flex: 1 }}>Select service type</Text>
                    )}
                    <MaterialIcons name="chevron-right" size={22} color={COLORS.textSubtle} style={{ marginLeft: 8 }} />
                  </View>
                </Pressable>
              )}
            </View>

            {/* Mileage */}
            <View style={{ marginBottom: FIELD_GAP }}>
              <FormLabel text="MILEAGE AT SERVICE" />
              <View style={{
                height: 52, borderRadius: 14, borderWidth: 1,
                borderColor: kmFocused ? COLORS.borderFocus : COLORS.border,
                paddingHorizontal: 16,
                backgroundColor: COLORS.surface,
                flexDirection: 'row', alignItems: 'center',
              }}>
                <TextInput
                  value={String(serviceKM)}
                  onChangeText={(v) => {
                    const parsed = Number(v.replace(/\D/g, ''));
                    setServiceKM(Number.isFinite(parsed) ? parsed : 0);
                  }}
                  onFocus={() => setKmFocused(true)}
                  onBlur={() => setKmFocused(false)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSubtle}
                  style={{
                    flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '600',
                    fontVariant: ['tabular-nums'],
                  }}
                />
                <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>KM</Text>
              </View>
            </View>

            {/* Date */}
            <View style={{ marginBottom: FIELD_GAP }}>
              <FormLabel text="SERVICE DATE" />
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{
                  height: 52, borderRadius: 14, borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: 16,
                  backgroundColor: COLORS.surface,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    <MaterialIcons name="calendar-today" size={17} color={COLORS.textMuted} />
                    <Text
                      numberOfLines={1}
                      style={{ fontWeight: '600', color: COLORS.text, fontSize: 15, flex: 1 }}
                    >
                      {serviceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.textSubtle} style={{ marginLeft: 8 }} />
                </View>
              </Pressable>
            </View>

            {/* Notes */}
            <View style={{ marginBottom: FIELD_GAP }}>
              <FormLabel text="NOTES (OPTIONAL)" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
                placeholder="e.g. Changed oil and filter"
                placeholderTextColor={COLORS.textSubtle}
                multiline
                numberOfLines={3}
                style={{
                  borderRadius: 14, borderWidth: 1,
                  borderColor: notesFocused ? COLORS.borderFocus : COLORS.border,
                  paddingHorizontal: 16, paddingVertical: 14,
                  backgroundColor: COLORS.surface, color: COLORS.text, minHeight: 92,
                  fontSize: 15, fontWeight: '500',
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {error && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 12,
                padding: 14, marginBottom: 20,
                borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: overdue }} />
                <Text style={{ color: overdue, fontWeight: '600', fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            )}

            {/* Save Button */}
            <Pressable
              onPress={onSave}
              disabled={!selectedType || saving}
            >
              <View style={{
                height: 54,
                borderRadius: 14,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!selectedType || saving) ? 0.4 : 1,
              }}>
                <Text style={{ color: COLORS.primaryText, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
                  {saving ? 'Saving...' : 'Save Record'}
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Service Type Picker - absolute overlay (avoids nested Modal issues) */}
      {showTypePicker && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, elevation: 100 }]}>
          <Pressable
            onPress={() => setShowTypePicker(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
          <View style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            maxHeight: '70%',
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 20,
          }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' }} />
            </View>

            <Text style={{
              fontSize: 18, fontWeight: '800', color: COLORS.text,
              paddingHorizontal: 24, paddingVertical: 12, letterSpacing: -0.3,
            }}>
              Select Service Type
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {serviceTypes.map((st) => {
                const active = selectedType?.id === st.id;
                const iconName = (st.icon || 'construction') as React.ComponentProps<typeof MaterialIcons>['name'];
                return (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setSelectedType(st);
                      setShowTypePicker(false);
                      Haptics.selectionAsync().catch(() => undefined);
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      backgroundColor: active ? COLORS.surfaceSelected : 'transparent',
                    }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: active ? COLORS.primary : 'rgba(0,0,0,0.06)',
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 14,
                      }}>
                        <MaterialIcons name={iconName} size={20} color={active ? COLORS.primaryText : COLORS.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2, marginBottom: 2 }}>
                          {st.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '500' }}>
                          Every {st.intervalKM.toLocaleString()} KM
                        </Text>
                      </View>
                      {active && <MaterialIcons name="check" size={22} color={COLORS.primary} />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Date Picker - absolute overlay */}
      {showDatePicker && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 100, elevation: 100 }]}>
          <Pressable
            onPress={() => setShowDatePicker(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          />
          <View style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
          }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' }} />
            </View>

            <Text style={{
              fontSize: 18, fontWeight: '800', color: COLORS.text,
              paddingHorizontal: 24, paddingVertical: 12, letterSpacing: -0.3,
            }}>
              Select Date
            </Text>

            <View style={{ height: 216, justifyContent: 'center' }}>
              <DateTimePicker
                value={serviceDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant="light"
                onChange={(_event, date) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (date) setServiceDate(date);
                }}
                style={{ height: 216 }}
              />
            </View>

            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View style={{
                  marginHorizontal: 24,
                  marginTop: 8,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: COLORS.primaryText, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>
                    Done
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </BlurView>
  );
}

function FormLabel({ text }: Readonly<{ text: string }>) {
  return (
    <Text style={{
      fontWeight: '700',
      marginBottom: LABEL_GAP,
      color: COLORS.textMuted,
      fontSize: 11,
      letterSpacing: 1.5,
    }}>
      {text}
    </Text>
  );
}
