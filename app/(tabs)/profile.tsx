import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { 
  Alert, 
  Pressable, 
  ScrollView, 
  Text, 
  View, 
  useColorScheme,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import GlassCard from '@/components/ui/GlassCard';
import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useProfileStore } from '@/store/profileStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { cancelAllRemindersForVehicle, clearAllUnreadReminders } from '@/utils/notifications';

/**
 * Tesla-inspired Profile Screen
 * Clean centered layout with photo, name, email, and settings
 */
export default function ProfileScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const name = user?.name ?? '';
  const email = user?.email ?? '';

  const photoUri = useProfileStore((s) => s.photoUri);
  const setPhoto = useProfileStore((s) => s.setPhoto);
  const photoHydrated = useProfileStore((s) => s.hydrated);

  const vehicleCount = useVehicleStore((s) => s.vehicles.length);
  const recordCount = useMaintenanceStore((s) => s.records.length);

  // Hydrate photo store on mount
  React.useEffect(() => {
    if (!photoHydrated) {
      useProfileStore.getState().hydrate();
    }
  }, [photoHydrated]);

  // Avatar entrance
  const avatarScale = useSharedValue(0.8);
  const avatarOpacity = useSharedValue(0);
  useEffect(() => {
    avatarOpacity.value = withTiming(1, { duration: animation.duration.normal, easing: animation.easing });
    avatarScale.value = withDelay(60, withSpring(1, animation.spring));
  }, []);
  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));

  async function onPickImage() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your photos to set a profile picture.',
        );
        return;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await setPhoto(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to update profile photo');
    }
  }

  function onRemovePhoto() {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setPhoto(null),
        },
      ],
    );
  }

  async function onLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const vehicles = useVehicleStore.getState().vehicles;
            try {
              await Promise.all(vehicles.map((v) => cancelAllRemindersForVehicle(v.id)));
            } catch {
              // ignore
            }
            await clearAllUnreadReminders().catch(() => undefined);
            await useAuthStore.getState().logout().catch(() => undefined);
            useVehicleStore.setState({ vehicles: [], recentVehicleId: null, hydrated: true });
            useMaintenanceStore.setState({ records: [], hydrated: true });
            router.replace('/(auth)/auth');
          },
        },
      ],
    );
  }

  if (!authHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, backgroundColor: t.bg }}>
        <Text style={{ color: t.textMuted, fontSize: 13, letterSpacing: 1 }}>LOADING</Text>
      </View>
    );
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: '700', 
              color: t.textSubtle, 
              letterSpacing: 2,
              marginBottom: 6,
            }}>
              ACCOUNT
            </Text>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: '900', 
              color: t.text, 
              letterSpacing: -1.2,
            }}>
              Profile
            </Text>
          </View>
        </AnimatedListItem>

        {/* Profile Card - Centered */}
        <AnimatedListItem index={1}>
          <GlassCard style={{ padding: 32, marginBottom: 20, alignItems: 'center' }}>
            {/* Avatar with upload button - CENTERED */}
            <Animated.View style={[avatarStyle, { marginBottom: 24, alignItems: 'center' }]}>
              <Pressable
                onPress={onPickImage}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  position: 'relative',
                })}
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 55,
                      borderWidth: 2,
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 55,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 40, 
                      fontWeight: '800', 
                      color: t.text,
                      letterSpacing: -0.5,
                    }}>
                      {initials || '?'}
                    </Text>
                  </View>
                )}
                
                {/* Camera icon overlay */}
                <View style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: t.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: t.bg,
                }}>
                  <MaterialIcons 
                    name="camera-alt" 
                    size={15} 
                    color={isDark ? '#000000' : '#FFFFFF'} 
                  />
                </View>
              </Pressable>
            </Animated.View>

            {/* Photo action buttons */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
              <Pressable
                onPress={onPickImage}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ 
                  color: t.text, 
                  fontSize: 11, 
                  fontWeight: '700',
                  letterSpacing: 0.8,
                }}>
                  {photoUri ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}
                </Text>
              </Pressable>
              
              {photoUri && (
                <Pressable
                  onPress={onRemovePhoto}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: 'rgba(220,38,38,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(220,38,38,0.20)',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ 
                    color: overdue, 
                    fontSize: 11, 
                    fontWeight: '700',
                    letterSpacing: 0.8,
                  }}>
                    REMOVE
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Name - CENTERED */}
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '800', 
              color: t.text, 
              marginBottom: 6, 
              letterSpacing: -0.5,
              textAlign: 'center',
            }}>
              {name || 'User'}
            </Text>
            {/* Email - CENTERED */}
            <Text style={{ 
              fontSize: 14, 
              color: t.textMuted,
              fontWeight: '500',
              letterSpacing: -0.2,
              textAlign: 'center',
            }}>
              {email || '—'}
            </Text>
          </GlassCard>
        </AnimatedListItem>

        {/* Personal Information Section */}
        <AnimatedListItem index={2}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '700', 
            marginBottom: 12, 
            color: t.textSubtle, 
            letterSpacing: 2,
          }}>
            PERSONAL INFORMATION
          </Text>

          {/* Name field - Separate GlassCard */}
          <View style={{ marginBottom: 12 }}>
            <Pressable
              onPress={() => router.push('/settings/change-name')}
              accessibilityRole="button"
              style={({ pressed }) => ({ 
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <GlassCard style={{ paddingHorizontal: 20, paddingVertical: 18 }}>
                <Text style={{ 
                  color: t.textMuted, 
                  fontSize: 11, 
                  fontWeight: '600',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}>
                  FULL NAME
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: t.text,
                    letterSpacing: -0.3,
                    flex: 1,
                    marginRight: 12,
                  }} numberOfLines={1}>
                    {name || 'Not set'}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
                </View>
              </GlassCard>
            </Pressable>
          </View>

          {/* Email field - Separate GlassCard */}
          <View style={{ marginBottom: 24 }}>
            <Pressable
              onPress={() => router.push('/settings/change-email')}
              accessibilityRole="button"
              style={({ pressed }) => ({ 
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <GlassCard style={{ paddingHorizontal: 20, paddingVertical: 18 }}>
                <Text style={{ 
                  color: t.textMuted, 
                  fontSize: 11, 
                  fontWeight: '600',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}>
                  EMAIL ADDRESS
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: t.text,
                    letterSpacing: -0.3,
                    flex: 1,
                    marginRight: 12,
                  }} numberOfLines={1}>
                    {email || 'Not set'}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
                </View>
              </GlassCard>
            </Pressable>
          </View>
        </AnimatedListItem>

        {/* Stats Row */}
        <AnimatedListItem index={3}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '700', 
            marginBottom: 12, 
            color: t.textSubtle, 
            letterSpacing: 2,
          }}>
            STATISTICS
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <StatCard label="Vehicles" value={vehicleCount} t={t} />
            <StatCard label="Records" value={recordCount} t={t} />
          </View>
        </AnimatedListItem>

        {/* Settings Section */}
        <AnimatedListItem index={4}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '700', 
            marginBottom: 12, 
            color: t.textSubtle, 
            letterSpacing: 2,
          }}>
            SETTINGS
          </Text>
          <View style={{ marginBottom: 24 }}>
            <Pressable
              onPress={() => router.push('/settings/service-types')}
              accessibilityRole="button"
              style={({ pressed }) => ({ 
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <GlassCard style={{ paddingHorizontal: 20, paddingVertical: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 11,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    }}>
                      <MaterialIcons name="build-circle" size={20} color={t.text} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, letterSpacing: -0.3, marginBottom: 2 }}>
                        Service Types
                      </Text>
                      <Text style={{ fontSize: 12, color: t.textMuted, fontWeight: '500' }}>
                        Manage maintenance catalogue
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={t.textMuted} />
                </View>
              </GlassCard>
            </Pressable>
          </View>
        </AnimatedListItem>

        {/* Sign Out - Text only button */}
        <AnimatedListItem index={5}>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Pressable
              onPress={onLogout}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingHorizontal: 36,
                height: 48,
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1, 
                borderColor: 'rgba(220,38,38,0.25)',
                backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text style={{ 
                color: overdue, 
                fontWeight: '800', 
                fontSize: 14,
                letterSpacing: 1.2,
              }}>
                SIGN OUT
              </Text>
            </Pressable>
          </View>
        </AnimatedListItem>
      </ScrollView>
    </View>
  );
}

type StatCardProps = Readonly<{
  label: string;
  value: number;
  t: ReturnType<typeof useAppTheme>;
}>;

function StatCard({ label, value, t }: StatCardProps) {
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    const start = Date.now();
    const dur = animation.duration.slow;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / dur, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => clearTimeout(delay);
  }, [value]);

  return (
    <GlassCard style={{ flex: 1, padding: 20, alignItems: 'center' }}>
      <Text style={{ 
        fontSize: 36, 
        fontWeight: '900', 
        color: t.text, 
        letterSpacing: -1.5,
        fontVariant: ['tabular-nums'],
        marginBottom: 6,
      }}>
        {display}
      </Text>
      <Text style={{ 
        fontSize: 10, 
        color: t.textMuted,
        fontWeight: '700',
        letterSpacing: 1.5,
      }}>
        {label.toUpperCase()}
      </Text>
    </GlassCard>
  );
}
