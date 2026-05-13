import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useServiceTypeStore } from '@/store/serviceTypeStore';
import type { ServiceType, VehicleType } from '@/types';
import {
  SERVICE_ICON_OPTIONS,
  getIconForServiceType,
  type ServiceIconName,
} from '@/utils/serviceTypeIcons';

type FormMode = 'add' | 'edit' | null;

export default function ServiceTypesSettingsScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('motorcycle');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingItem, setEditingItem] = useState<ServiceType | null>(null);
  const [formName, setFormName] = useState('');
  const [formInterval, setFormInterval] = useState('');
  const [formIcon, setFormIcon] = useState<ServiceIconName>('construction');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [intervalFocused, setIntervalFocused] = useState(false);

  const { catalogue, loading, error, fetchCatalogue, createServiceType, updateServiceType, deleteServiceType } =
    useServiceTypeStore();

  const scrollRef = useRef<ScrollView>(null);

  const items = catalogue[selectedVehicleType] ?? [];

  useEffect(() => {
    fetchCatalogue(selectedVehicleType).catch(() => undefined);
  }, [selectedVehicleType]);

  function openAdd() {
    setFormMode('add');
    setEditingItem(null);
    setFormName('');
    setFormInterval('');
    setFormIcon('construction');
    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function openEdit(item: ServiceType) {
    setFormMode('edit');
    setEditingItem(item);
    setFormName(item.name);
    setFormInterval(String(item.intervalKM));
    setFormIcon(getIconForServiceType(item.name));
    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function closeForm() {
    setFormMode(null);
    setEditingItem(null);
    setFormName('');
    setFormInterval('');
    setFormIcon('construction');
    setFormError(null);
  }

  async function onSubmitForm() {
    const nameTrimmed = formName.trim();
    const intervalValue = Number(formInterval.replace(/\D/g, ''));

    if (!nameTrimmed) return setFormError('Name is required');
    if (!intervalValue || intervalValue <= 0) return setFormError('Interval must be greater than 0');

    try {
      setFormLoading(true);
      setFormError(null);

      if (formMode === 'add') {
        await createServiceType({
          name: nameTrimmed,
          intervalKM: intervalValue,
          vehicleType: selectedVehicleType,
          icon: formIcon,
        });
      } else if (formMode === 'edit' && editingItem) {
        // Both default and custom types can now update name, interval, and icon
        await updateServiceType(editingItem.id, {
          name: nameTrimmed,
          intervalKM: intervalValue,
          icon: formIcon,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      closeForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      if (msg?.includes('already exists')) {
        setFormError('A service type with this name already exists for this vehicle type');
      } else {
        setFormError(msg ?? 'Failed to save. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  }

  function onDeleteItem(item: ServiceType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    Alert.alert(
      'Delete Service Type',
      `Remove "${item.name}" from your catalogue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServiceType(item.id, selectedVehicleType);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            } catch {
              Alert.alert('Error', 'Failed to delete service type. Please try again.');
            }
          },
        },
      ],
    );
  }

  const vehicleTypes: { value: VehicleType; label: string; icon: string }[] = [
    { value: 'motorcycle', label: 'Motorcycle', icon: 'two-wheeler' },
    { value: 'car', label: 'Car', icon: 'directions-car' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSubtle, letterSpacing: 2, marginBottom: 6 }}>
                SETTINGS
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: t.text, letterSpacing: -1.2 }}>
                Service Types
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="arrow-back" size={22} color={t.text} />
            </Pressable>
          </View>
        </AnimatedListItem>

        {/* Vehicle Type Selector */}
        <AnimatedListItem index={1}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSubtle, letterSpacing: 2, marginBottom: 12 }}>
            VEHICLE TYPE
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
            {vehicleTypes.map((vt) => {
              const active = selectedVehicleType === vt.value;
              return (
                <Pressable
                  key={vt.value}
                  onPress={() => {
                    setSelectedVehicleType(vt.value);
                    closeForm();
                    Haptics.selectionAsync().catch(() => undefined);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: 20,
                    paddingVertical: 28,
                    paddingHorizontal: 12,
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
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: active
                      ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)')
                      : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}>
                    <MaterialIcons
                      name={vt.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                      size={32}
                      color={active ? t.text : t.textMuted}
                    />
                  </View>

                  <Text style={{
                    fontWeight: '800',
                    color: active ? t.text : t.textMuted,
                    fontSize: 13,
                    letterSpacing: -0.2,
                    marginBottom: 2,
                    textAlign: 'center',
                  }}>
                    {vt.label}
                  </Text>

                  {/* Active indicator bar */}
                  {active && (
                    <View style={{
                      marginTop: 10,
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: t.brand,
                    }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </AnimatedListItem>

        {/* Catalogue List */}
        <AnimatedListItem index={2}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSubtle, letterSpacing: 2, marginBottom: 12 }}>
            CATALOGUE
          </Text>

          {loading && items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator color={t.text} />
              <Text style={{ color: t.textMuted, marginTop: 12, fontSize: 13 }}>Loading...</Text>
            </View>
          ) : error ? (
            <GlassCard style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: overdue, fontWeight: '600', marginBottom: 12 }}>{error}</Text>
              <Pressable onPress={() => fetchCatalogue(selectedVehicleType)}>
                <Text style={{ color: t.text, fontWeight: '700', letterSpacing: 0.5 }}>RETRY</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {items.map((item, idx) => (
                <AnimatedListItem key={item.id} index={3 + idx}>
                  <GlassCard style={{ padding: 18 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      {/* Icon - from backend */}
                      <View style={{
                        width: 44, height: 44, borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      }}>
                        <MaterialIcons
                          name={(item.icon || getIconForServiceType(item.name)) as React.ComponentProps<typeof MaterialIcons>['name']}
                          size={22}
                          color={t.text}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: t.text, letterSpacing: -0.3 }}>
                            {item.name}
                          </Text>
                          {item.isDefault && (
                            <View style={{
                              paddingHorizontal: 8, paddingVertical: 3,
                              borderRadius: 999,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                            }}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: t.textMuted, letterSpacing: 1 }}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                          Every {item.intervalKM.toLocaleString()} KM
                        </Text>
                      </View>

                      {/* Actions - edit for all, delete only for custom */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={() => openEdit(item)}
                          style={({ pressed }) => ({
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <MaterialIcons name="edit" size={16} color={t.textMuted} />
                        </Pressable>
                        {!item.isDefault && (
                          <Pressable
                            onPress={() => onDeleteItem(item)}
                            style={({ pressed }) => ({
                              width: 36, height: 36, borderRadius: 10,
                              backgroundColor: isDark ? 'rgba(220,38,38,0.10)' : 'rgba(220,38,38,0.06)',
                              alignItems: 'center', justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(220,38,38,0.20)' : 'rgba(220,38,38,0.15)',
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <MaterialIcons name="delete-outline" size={16} color={overdue} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </AnimatedListItem>
              ))}

              {/* ADD button - below list, always visible */}
              {formMode === null && (
                <Pressable
                  onPress={openAdd}
                  style={({ pressed }) => ({
                    marginTop: 4,
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  })}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    borderRadius: borderRadius.card,
                    borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
                    borderStyle: 'dashed',
                    gap: 8,
                  }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: t.brand,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MaterialIcons name="add" size={18} color={isDark ? '#000000' : '#FFFFFF'} />
                    </View>
                    <Text style={{
                      color: t.text,
                      fontWeight: '700',
                      fontSize: 14,
                      letterSpacing: -0.2,
                    }}>
                      Add Custom Service Type
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </AnimatedListItem>

        {/* Add / Edit Form */}
        {formMode !== null && (
          <AnimatedListItem index={items.length + 4}>
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: t.textSubtle, letterSpacing: 2, marginBottom: 12 }}>
                {formMode === 'add' ? 'NEW SERVICE TYPE' : 'EDIT SERVICE TYPE'}
              </Text>
              <View style={{
                padding: 20,
                borderRadius: borderRadius.card,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              }}>
                {/* Form title */}
                <Text style={{ fontSize: 16, fontWeight: '800', color: t.text, letterSpacing: -0.3, marginBottom: 4 }}>
                  {formMode === 'add' ? 'Add Custom Service' : `Edit "${editingItem?.name}"`}
                </Text>
                <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '500', marginBottom: 20 }}>
                  {formMode === 'add'
                    ? `For ${selectedVehicleType === 'motorcycle' ? 'Motorcycle' : 'Car'}`
                    : editingItem?.isDefault
                      ? 'Default type — you can customize name, interval, and icon'
                      : `For ${selectedVehicleType === 'motorcycle' ? 'Motorcycle' : 'Car'}`}
                </Text>

                {/* Name - editable for all types */}
                <Text style={{ fontSize: 11, fontWeight: '600', color: t.textMuted, letterSpacing: 1, marginBottom: 8 }}>
                  NAME
                </Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Gear Oil"
                  placeholderTextColor={t.textSubtle}
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  style={{
                    height: 52, borderRadius: borderRadius.input, borderWidth: 1,
                    borderColor: nameFocused ? '#111111' : 'rgba(0,0,0,0.12)',
                    paddingHorizontal: 16, marginBottom: 16,
                    backgroundColor: t.inputBg, color: t.text,
                    fontSize: 15, fontWeight: '500',
                  }}
                />

                {/* Icon Picker */}
                <Text style={{ fontSize: 11, fontWeight: '600', color: t.textMuted, letterSpacing: 1, marginBottom: 10 }}>
                  ICON
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {SERVICE_ICON_OPTIONS.map((opt) => {
                    const active = formIcon === opt.icon;
                    return (
                      <Pressable
                        key={opt.icon}
                        onPress={() => {
                          setFormIcon(opt.icon);
                          Haptics.selectionAsync().catch(() => undefined);
                        }}
                      >
                        <View style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 999,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? '#111111' : 'rgba(0,0,0,0.12)',
                          backgroundColor: active ? '#111111' : 'transparent',
                          flexDirection: 'row',
                          gap: 6,
                        }}>
                          <MaterialIcons
                            name={opt.icon}
                            size={18}
                            color={active ? '#FFFFFF' : '#888888'}
                          />
                          <Text style={{
                            fontSize: 12,
                            fontWeight: active ? '700' : '500',
                            color: active ? '#FFFFFF' : '#888888',
                          }}>
                            {opt.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Interval */}
                <Text style={{ fontSize: 11, fontWeight: '600', color: t.textMuted, letterSpacing: 1, marginBottom: 8 }}>
                  INTERVAL (KM)
                </Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  height: 52, borderRadius: borderRadius.input, borderWidth: 1,
                  borderColor: intervalFocused ? t.brand : t.inputBorder,
                  paddingHorizontal: 16, marginBottom: 16,
                  backgroundColor: t.inputBg,
                }}>
                  <TextInput
                    value={formInterval}
                    onChangeText={(v) => setFormInterval(v.replace(/\D/g, ''))}
                    placeholder="5000"
                    placeholderTextColor={t.textSubtle}
                    keyboardType="numeric"
                    onFocus={() => setIntervalFocused(true)}
                    onBlur={() => setIntervalFocused(false)}
                    style={{
                      flex: 1, color: t.text, fontSize: 15, fontWeight: '600',
                      fontVariant: ['tabular-nums'],
                    }}
                  />
                  <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>KM</Text>
                </View>

                {/* Error */}
                {formError && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: 'rgba(220,38,38,0.10)', borderRadius: 10,
                    padding: 12, marginBottom: 14,
                    borderWidth: 1, borderColor: 'rgba(220,38,38,0.20)',
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: overdue }} />
                    <Text style={{ color: overdue, fontWeight: '600', fontSize: 12, flex: 1 }}>{formError}</Text>
                  </View>
                )}

                {/* Buttons - centered horizontal */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'center' }}>
                  <Pressable onPress={closeForm}>
                    <View style={{
                      paddingHorizontal: 28,
                      height: 48,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: '#AAAAAA',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: '#888888', fontWeight: '600', fontSize: 14 }}>
                        Cancel
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={onSubmitForm} disabled={formLoading}>
                    <View style={{
                      paddingHorizontal: 36,
                      height: 48,
                      borderRadius: 999,
                      backgroundColor: '#111111',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: formLoading ? 0.5 : 1,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        {formLoading ? 'Saving...' : formMode === 'add' ? 'Add' : 'Save'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </AnimatedListItem>
        )}
      </ScrollView>
    </View>
  );
}
