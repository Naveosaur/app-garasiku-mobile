import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { 
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

import AmbientBackground from '@/components/ui/AmbientBackground';
import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { VehicleType } from '@/types';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { cancelAllRemindersForVehicle, scheduleMaintenanceReminder } from '@/utils/notifications';

/**
 * Tesla-inspired Add Vehicle Modal
 * Premium form with grouped sections and smooth interactions
 */
export default function AddVehicleModalScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const addVehicle = useVehicleStore((s) => s.addVehicle);
  const records = useMaintenanceStore((s) => s.records);

  const [vehicleType, setVehicleType] = React.useState<VehicleType>('motorcycle');
  const [vehicleName, setVehicleName] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [model, setModel] = React.useState('');
  const [plate, setPlate] = React.useState('');
  const [year, setYear] = React.useState(() => new Date().getFullYear());
  const [currentKM, setCurrentKM] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Focus states
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, i) => current - i);
  }, []);

  // Spring entrance
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
      const nameTrimmed = vehicleName.trim();
      const brandTrimmed = brand.trim();
      const modelTrimmed = model.trim();
      const plateTrimmed = plate.trim();
      const kmValue = Number(currentKM.replace(/\D/g, ''));

      if (!brandTrimmed) return setError('Brand is required');
      if (!modelTrimmed) return setError('Model is required');
      if (!plateTrimmed) return setError('License plate is required');
      if (!Number.isFinite(kmValue) || kmValue <= 0) return setError('Current mileage must be greater than 0');

      setLoading(true);
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
        currentKM: Math.round(kmValue),
        createdAt: now,
        updatedAt: now,
      };

      await addVehicle(vehicle);
      const statuses = getMaintenanceStatuses(vehicle, records);
      await cancelAllRemindersForVehicle(vehicle.id);
      await Promise.all(statuses.map((s) => scheduleMaintenanceReminder(vehicle, s)));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch {
      setError('Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isValid = brand.trim() && model.trim() && plate.trim() && Number(currentKM.replace(/\D/g, '')) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View style={[{ flex: 1 }, sheetStyle]}>
          <ScrollView
            contentContainerStyle={{ 
              flexGrow: 1, 
              paddingHorizontal: 20, 
              paddingTop: insets.top + 20, 
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: 32,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: '700', 
                  color: t.textSubtle, 
                  letterSpacing: 2,
                  marginBottom: 6,
                }}>
                  NEW VEHICLE
                </Text>
                <Text style={{ 
                  fontSize: 32, 
                  fontWeight: '900', 
                  color: t.text, 
                  letterSpacing: -1.2,
                }}>
                  Add Vehicle
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
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <MaterialIcons name="close" size={22} color={t.text} />
              </Pressable>
            </View>

            {/* SECTION 1: Vehicle Type Selector */}
            <SectionLabel text="CHOOSE TYPE" t={t} />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              {(['motorcycle', 'car'] as VehicleType[]).map((type) => {
                const active = vehicleType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      setVehicleType(type);
                      Haptics.selectionAsync().catch(() => undefined);
                    }}
                    style={({ pressed }) => ({
                      flex: 1,
                      borderRadius: 20,
                      paddingVertical: 28,
                      paddingHorizontal: 16,
                      // Fixed border width to prevent layout shift
                      borderWidth: 2,
                      borderColor: active ? t.brand : t.inputBorder,
                      backgroundColor: active
                        ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)')
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    {/* Icon Container */}
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: active
                        ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)')
                        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                    }}>
                      <MaterialIcons
                        name={type === 'motorcycle' ? 'two-wheeler' : 'directions-car'}
                        size={32}
                        color={active ? t.text : t.textMuted}
                      />
                    </View>

                    {/* Label */}
                    <Text style={{
                      fontWeight: '800',
                      color: active ? t.text : t.textMuted,
                      fontSize: 15,
                      letterSpacing: -0.3,
                      marginBottom: 3,
                    }}>
                      {type === 'motorcycle' ? 'Motorcycle' : 'Car'}
                    </Text>
                    
                    {/* Subtitle */}
                    <Text style={{
                      fontWeight: '500',
                      color: t.textSubtle,
                      fontSize: 11,
                      letterSpacing: 0.2,
                    }}>
                      {type === 'motorcycle' ? '2 wheels' : '4 wheels'}
                    </Text>

                    {/* Active indicator - bottom center dot */}
                    {active && (
                      <View style={{
                        marginTop: 12,
                        width: 28,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: t.brand,
                      }} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* SECTION 2: Vehicle Identity */}
            <SectionLabel text="VEHICLE DETAILS" t={t} />
            
            <InputField
              label="Brand"
              value={brand}
              onChangeText={setBrand}
              placeholder="Honda, Yamaha, Toyota..."
              autoCapitalize="words"
              focused={focusedField === 'brand'}
              onFocus={() => setFocusedField('brand')}
              onBlur={() => setFocusedField(null)}
              t={t}
              isDark={isDark}
              required
            />

            <InputField
              label="Model"
              value={model}
              onChangeText={setModel}
              placeholder="Beat, Vario, Camry..."
              autoCapitalize="words"
              focused={focusedField === 'model'}
              onFocus={() => setFocusedField('model')}
              onBlur={() => setFocusedField(null)}
              t={t}
              isDark={isDark}
              required
            />

            <InputField
              label="Nickname (Optional)"
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="My Daily Ride"
              autoCapitalize="words"
              focused={focusedField === 'name'}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              t={t}
              isDark={isDark}
            />

            {/* SECTION 3: Registration & Specs */}
            <View style={{ height: 16 }} />
            <SectionLabel text="REGISTRATION" t={t} />

            <InputField
              label="License Plate"
              value={plate}
              onChangeText={(v) => setPlate(v.toUpperCase())}
              placeholder="B 1234 ABC"
              autoCapitalize="characters"
              focused={focusedField === 'plate'}
              onFocus={() => setFocusedField('plate')}
              onBlur={() => setFocusedField(null)}
              t={t}
              isDark={isDark}
              required
            />

            {/* Year Picker - Custom dropdown */}
            <View style={{ marginBottom: 16 }}>
              <FieldLabel text="Year" t={t} />
              <Pressable
                onPress={() => setShowYearPicker(!showYearPicker)}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: borderRadius.input,
                  borderWidth: 1,
                  borderColor: showYearPicker ? t.brand : t.inputBorder,
                  paddingHorizontal: 18,
                  backgroundColor: t.inputBg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{
                  color: t.text,
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: -0.3,
                  fontVariant: ['tabular-nums'],
                }}>
                  {year}
                </Text>
                <MaterialIcons 
                  name={showYearPicker ? 'expand-less' : 'expand-more'} 
                  size={24} 
                  color={t.textMuted} 
                />
              </Pressable>
              
              {showYearPicker && (
                <View style={{
                  marginTop: 8,
                  borderRadius: borderRadius.input,
                  borderWidth: 1,
                  borderColor: t.inputBorder,
                  backgroundColor: t.inputBg,
                  overflow: 'hidden',
                }}>
                  <Picker 
                    selectedValue={year} 
                    onValueChange={(v) => {
                      setYear(Number(v));
                      Haptics.selectionAsync().catch(() => undefined);
                    }}
                    itemStyle={{ color: t.text, fontSize: 18 }}
                  >
                    {years.map((y) => (
                      <Picker.Item 
                        key={y} 
                        label={String(y)} 
                        value={y}
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Current Mileage with custom suffix */}
            <View style={{ marginBottom: 16 }}>
              <FieldLabel text="Current Mileage" t={t} required />
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 56,
                borderRadius: borderRadius.input,
                borderWidth: 1,
                borderColor: focusedField === 'km' ? t.brand : t.inputBorder,
                paddingLeft: 18,
                paddingRight: 14,
                backgroundColor: t.inputBg,
              }}>
                <TextInput
                  value={currentKM}
                  onChangeText={(v) => setCurrentKM(v.replace(/\D/g, ''))}
                  onFocus={() => setFocusedField('km')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={t.textSubtle}
                  accessibilityLabel="Current mileage"
                  style={{
                    flex: 1,
                    color: t.text,
                    fontSize: 16,
                    fontWeight: '600',
                    letterSpacing: -0.3,
                    fontVariant: ['tabular-nums'],
                  }}
                />
                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                }}>
                  <Text style={{
                    color: t.text,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}>
                    KM
                  </Text>
                </View>
              </View>
            </View>

            {/* Error message */}
            {error ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: 'rgba(220, 38, 38, 0.10)',
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(220, 38, 38, 0.20)',
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: overdue }} />
                <Text style={{ color: overdue, fontWeight: '600', fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ height: 16 }} />

            {/* Submit Button */}
            <Pressable
              onPress={onSave}
              disabled={!isValid || loading}
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderRadius: borderRadius.button,
                overflow: 'hidden',
                opacity: (!isValid || loading) ? 0.5 : (pressed ? 0.95 : 1),
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: isDark ? '#FFFFFF' : '#000000',
                shadowOpacity: isDark ? 0.15 : 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              })}
            >
              <View style={{
                height: 58,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.brand,
              }}>
                <Text style={{
                  color: isDark ? '#000000' : '#FFFFFF',
                  fontWeight: '700',
                  fontSize: 15,
                  letterSpacing: 1,
                }}>
                  {loading ? 'ADDING...' : 'ADD VEHICLE'}
                </Text>
              </View>
            </Pressable>

            {/* Helper text */}
            <Text style={{ 
              color: t.textSubtle, 
              fontSize: 12,
              textAlign: 'center',
              marginTop: 16,
              fontWeight: '500',
              letterSpacing: -0.1,
            }}>
              Maintenance reminders will be set automatically
            </Text>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================
// SUB COMPONENTS
// ============================================

function SectionLabel({ text, t }: Readonly<{ text: string; t: ReturnType<typeof useAppTheme> }>) {
  return (
    <Text style={{
      fontWeight: '700',
      marginBottom: 14,
      color: t.textSubtle,
      fontSize: 11,
      letterSpacing: 2,
    }}>
      {text}
    </Text>
  );
}

function FieldLabel({ 
  text, 
  t, 
  required,
}: Readonly<{ 
  text: string; 
  t: ReturnType<typeof useAppTheme>;
  required?: boolean;
}>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{
        fontWeight: '600',
        color: t.textMuted,
        fontSize: 12,
        letterSpacing: 0.5,
      }}>
        {text}
      </Text>
      {required && (
        <Text style={{ 
          color: overdue, 
          fontSize: 12, 
          marginLeft: 4,
          fontWeight: '700',
        }}>
          *
        </Text>
      )}
    </View>
  );
}

type InputFieldProps = Readonly<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'words' | 'characters';
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  t: ReturnType<typeof useAppTheme>;
  isDark: boolean;
  required?: boolean;
}>;

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  focused,
  onFocus,
  onBlur,
  t,
  required,
}: InputFieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <FieldLabel text={label} t={t} required={required} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.textSubtle}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={label}
        style={{
          height: 56,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: focused ? t.brand : t.inputBorder,
          paddingHorizontal: 18,
          backgroundColor: t.inputBg,
          color: t.text,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        }}
      />
    </View>
  );
}
