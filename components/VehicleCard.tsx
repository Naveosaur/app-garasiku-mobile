import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Pressable, Text, View, useColorScheme } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import GlassCard from '@/components/ui/GlassCard';
import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useVehicleStore } from '@/store/vehicleStore';
import type { MaintenanceStatus, Vehicle } from '@/types';
import { getVehicleWorstStatus } from '@/utils/maintenanceCalc';

const rankStatus = (status: MaintenanceStatus['status']): number => {
  if (status === 'overdue') return 2;
  if (status === 'soon') return 1;
  return 0;
};

type Props = Readonly<{
  vehicle: Vehicle;
  statuses: MaintenanceStatus[];
  /** Index for staggered entrance animation */
  index?: number;
}>;

/**
 * Tesla-inspired minimal vehicle card
 * Monochrome, premium glass feel, subtle animations
 */
export default function VehicleCard({ vehicle, statuses, index = 0 }: Props) {
  const router = useRouter();
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';

  const worstStatus = getVehicleWorstStatus(statuses);

  const mostUrgent = React.useMemo(() => {
    const ranked = [...statuses].sort((a, b) => {
      const ra = rankStatus(a.status);
      const rb = rankStatus(b.status);
      if (rb !== ra) return rb - ra;
      return a.remainingKM - b.remainingKM;
    });
    return ranked[0];
  }, [statuses]);

  const intervalKM = mostUrgent.intervalKM || 1;
  const usedKM = Math.max(0, intervalKM - mostUrgent.remainingKM);
  const fillRatio = Math.min(1, Math.max(0, usedKM / intervalKM));

  // Progress bar fill animation
  const [animFill] = React.useState(() => new Animated.Value(fillRatio));

  React.useEffect(() => {
    Animated.timing(animFill, {
      toValue: fillRatio,
      duration: animation.duration.slow,
      useNativeDriver: false,
    }).start();
  }, [animFill, fillRatio]);

  // Progress bar color based on status
  const progressColor = worstStatus === 'overdue' 
    ? overdue 
    : isDark ? '#FFFFFF' : '#000000';

  // Reanimated for press scale
  const scale = useSharedValue(1);

  // Entrance animation
  const entryOpacity = useSharedValue(0);
  const entryY = useSharedValue(24);

  useEffect(() => {
    const delay = index * animation.staggerDelay;
    entryOpacity.value = withDelay(
      delay,
      withTiming(1, { duration: animation.duration.normal, easing: animation.easing }),
    );
    entryY.value = withDelay(
      delay,
      withTiming(0, { duration: animation.duration.normal, easing: animation.easing }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryY.value }, { scale: scale.value }],
  }));

  // Status badge config - minimal monochrome
  let badgeText = 'SAFE';
  let badgeBg: string;
  let badgeFg: string;
  let badgeBorder: string;
  
  if (worstStatus === 'overdue') {
    badgeText = 'OVERDUE';
    badgeBg = isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)';
    badgeFg = overdue;
    badgeBorder = isDark ? 'rgba(220, 38, 38, 0.30)' : 'rgba(220, 38, 38, 0.20)';
  } else if (worstStatus === 'soon') {
    badgeText = 'DUE SOON';
    badgeBg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
    badgeFg = t.text;
    badgeBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  } else {
    badgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    badgeFg = t.textMuted;
    badgeBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
  }

  return (
    <Reanimated.View style={[{ width: 320, marginVertical: 6 }, animStyle]}>
      <Pressable
        onPress={() => {
          setRecentVehicle(vehicle.id);
          router.push(`/vehicle/${vehicle.id}`);
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, animation.spring);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, animation.spring);
        }}
      >
        <GlassCard style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text 
                style={{ 
                  color: t.text, 
                  fontSize: 20, 
                  fontWeight: '800', 
                  letterSpacing: -0.5,
                  marginBottom: 4,
                }} 
                numberOfLines={1}
              >
                {vehicle.name}
              </Text>
              <Text 
                style={{ 
                  color: t.textMuted, 
                  fontSize: 13,
                  fontWeight: '500',
                  letterSpacing: 0.3,
                  fontVariant: ['tabular-nums'],
                }} 
                numberOfLines={1}
              >
                {vehicle.plate}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: badgeBg,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: borderRadius.badge,
                borderWidth: 1,
                borderColor: badgeBorder,
              }}
            >
              <Text style={{ 
                color: badgeFg, 
                fontWeight: '700', 
                fontSize: 10, 
                letterSpacing: 1.2,
              }}>
                {badgeText}
              </Text>
            </View>
          </View>

          {/* KM Display - Large & Prominent */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              color: t.textSubtle, 
              fontSize: 11, 
              fontWeight: '600', 
              letterSpacing: 1.5,
              marginBottom: 4,
            }}>
              CURRENT MILEAGE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ 
                color: t.text, 
                fontSize: 36, 
                fontWeight: '800', 
                letterSpacing: -1.5,
                fontVariant: ['tabular-nums'],
              }}>
                {vehicle.currentKM.toLocaleString()}
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 14, 
                fontWeight: '600',
                letterSpacing: 0.5,
              }}>
                KM
              </Text>
            </View>
          </View>

          {/* Service Info */}
          <View style={{ 
            gap: 8, 
            marginBottom: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }}>
            <Row 
              label="Next Service" 
              value={`${mostUrgent.nextServiceKM.toLocaleString()} km`} 
              t={t} 
            />
            <Row 
              label="Remaining" 
              value={`${Math.max(0, mostUrgent.remainingKM).toLocaleString()} km`} 
              t={t} 
              highlight={worstStatus === 'overdue'}
            />
          </View>

          {/* Progress Bar - Minimal */}
          <View>
            <View
              style={{
                height: 3,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  width: '100%',
                  backgroundColor: progressColor,
                  transform: [{ scaleX: animFill }],
                  transformOrigin: 'left',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ 
                color: t.textSubtle, 
                fontSize: 10, 
                fontWeight: '600',
                letterSpacing: 1,
              }}>
                SERVICE INTERVAL
              </Text>
              <Text style={{ 
                color: t.text, 
                fontSize: 10, 
                fontWeight: '700',
                letterSpacing: 0.5,
                fontVariant: ['tabular-nums'],
              }}>
                {Math.round(fillRatio * 100)}%
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Reanimated.View>
  );
}

function Row({
  label,
  value,
  t,
  highlight,
}: Readonly<{ 
  label: string; 
  value: string; 
  t: ReturnType<typeof useAppTheme>;
  highlight?: boolean;
}>) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ 
        color: t.textMuted, 
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
      <Text style={{ 
        color: highlight ? overdue : t.text, 
        fontSize: 13, 
        fontWeight: '700',
        letterSpacing: -0.2,
        fontVariant: ['tabular-nums'],
      }}>
        {value}
      </Text>
    </View>
  );
}
