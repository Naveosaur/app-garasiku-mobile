import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { cardGradients, borderRadius, muted, safe, soon, overdue } from '@/constants/theme';
import type { MaintenanceStatus, Vehicle } from '@/types';
import { getVehicleWorstStatus } from '@/utils/maintenanceCalc';
import { useVehicleStore } from '@/store/vehicleStore';

type Props = {
  vehicle: Vehicle;
  statuses: MaintenanceStatus[];
};

const rankStatus = (status: MaintenanceStatus['status']): number => {
  if (status === 'overdue') return 2;
  if (status === 'soon') return 1;
  return 0;
};

export default function VehicleCard({ vehicle, statuses }: Props) {
  const router = useRouter();
  const setRecentVehicle = useVehicleStore((s) => s.setRecentVehicle);

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

  const [animFill] = React.useState(() => new Animated.Value(fillRatio));
  const [animColor] = React.useState(() => new Animated.Value(rankStatus(worstStatus)));

  React.useEffect(() => {
    Animated.timing(animFill, {
      toValue: fillRatio,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [animFill, fillRatio]);

  React.useEffect(() => {
    const nextRank = rankStatus(worstStatus);
    Animated.timing(animColor, {
      toValue: nextRank,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [animColor, worstStatus]);

  const animatedColor = animColor.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [safe, soon, overdue],
  });

  const badgeText = worstStatus === 'overdue' ? 'OVERDUE' : worstStatus === 'soon' ? 'SERVICE SOON' : 'SAFE';

  const badgeBg =
    worstStatus === 'overdue'
      ? 'rgba(239, 68, 68, 0.14)'
      : worstStatus === 'soon'
        ? 'rgba(234, 179, 8, 0.16)'
        : 'rgba(34, 197, 94, 0.14)';

  const badgeFg =
    worstStatus === 'overdue' ? overdue : worstStatus === 'soon' ? soon : safe;

  return (
    <Pressable
      onPress={() => {
        setRecentVehicle(vehicle.id);
        router.push(`/vehicle/${vehicle.id}`);
      }}
      style={{ width: 320, marginVertical: 4 }}>
      <LinearGradient
        colors={cardGradients[worstStatus]}
        style={{
          borderRadius: borderRadius.card,
          padding: 14,
          overflow: 'hidden',
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
              {vehicle.name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }} numberOfLines={1}>
              {vehicle.plate}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined)}
            style={{
              backgroundColor: badgeBg,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 999,
            }}>
            <Text style={{ color: badgeFg, fontWeight: '900', fontSize: 12 }}>{badgeText}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12 }}>
              Current KM
            </Text>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>
              {vehicle.currentKM.toLocaleString()}
            </Text>
          </View>
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12 }}>
              Next Service
            </Text>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>
              {mostUrgent.nextServiceKM.toLocaleString()}
            </Text>
          </View>
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12 }}>
              Remaining
            </Text>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>
              {Math.max(0, mostUrgent.remainingKM).toLocaleString()} km
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <View
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.18)',
              overflow: 'hidden',
            }}>
            <Animated.View
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: animatedColor,
                transform: [{ scaleX: animFill }],
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: muted, fontSize: 11, opacity: 0.9 }}>Used</Text>
            <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: '700' }}>
              {Math.round(fillRatio * 100)}%
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

