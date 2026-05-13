import { MaterialIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import GlassCard from '@/components/ui/GlassCard';
import { animation, overdue, useAppTheme } from '@/constants/theme';
import type { MaintenanceStatus } from '@/types';

type Props = Readonly<{
  status: MaintenanceStatus;
  /** Index for staggered entrance */
  index?: number;
}>;

function typeLabel(status: MaintenanceStatus): string {
  // Use dynamic name if available, else fallback to legacy
  if (status.serviceTypeName) return status.serviceTypeName;
  switch (status.type) {
    case 'oil_change': return 'Oil Change';
    case 'brake_pads': return 'Brake Pads';
    case 'battery': return 'Battery';
    case 'general_service': return 'General Service';
    default: return status.type;
  }
}

function typeIcon(status: MaintenanceStatus): React.ComponentProps<typeof MaterialIcons>['name'] {
  // Use icon from backend if available
  if (status.serviceTypeIcon) return status.serviceTypeIcon as React.ComponentProps<typeof MaterialIcons>['name'];
  // Auto-detect from name
  const name = status.serviceTypeName?.toLowerCase() ?? '';
  if (name.includes('oil')) return 'opacity';
  if (name.includes('brake')) return 'build';
  if (name.includes('battery')) return 'battery-charging-full';
  if (name.includes('cvt') || name.includes('transmission')) return 'settings';
  if (name.includes('air') || name.includes('filter')) return 'air';
  if (name.includes('tire') || name.includes('tyre')) return 'tire-repair';
  switch (status.type) {
    case 'oil_change': return 'opacity';
    case 'brake_pads': return 'build';
    case 'battery': return 'battery-charging-full';
    case 'general_service': return 'construction';
    default: return 'build';
  }
}

function statusLabel(s: MaintenanceStatus['status']) {
  if (s === 'safe') return 'SAFE';
  if (s === 'soon') return 'DUE SOON';
  return 'OVERDUE';
}

/**
 * Tesla-inspired maintenance progress row
 * Minimal monochrome with critical accent only
 */
export default function MaintenanceProgressRow({ status, index = 0 }: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  
  const intervalKM = status.intervalKM || 1;
  const usedKM = Math.max(0, intervalKM - status.remainingKM);
  const fillRatio = Math.min(1, Math.max(0, usedKM / intervalKM));

  // Status colors - monochrome with red for overdue only
  const isOverdue = status.status === 'overdue';
  const progressColor = isOverdue ? overdue : (isDark ? '#FFFFFF' : '#000000');
  const statusTextColor = isOverdue ? overdue : t.text;

  const badgeText = isOverdue
    ? `${Math.abs(status.remainingKM).toLocaleString()} KM OVER`
    : `${Math.max(0, status.remainingKM).toLocaleString()} KM LEFT`;

  // Reanimated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const delay = index * animation.staggerDelay;
    progressWidth.value = withDelay(
      delay + 80,
      withTiming(fillRatio, { duration: animation.duration.slow, easing: animation.easing }),
    );
  }, []);

  useEffect(() => {
    progressWidth.value = withTiming(fillRatio, {
      duration: animation.duration.normal,
      easing: animation.easing,
    });
  }, [fillRatio]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progressWidth.value * 100)}%`,
    backgroundColor: progressColor,
    height: '100%',
    borderRadius: 999,
  }));

  const iconBg = isOverdue
    ? 'rgba(220, 38, 38, 0.12)'
    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)');
  
  const iconBorder = isOverdue
    ? 'rgba(220, 38, 38, 0.25)'
    : (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)');

  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const badgeBg = isOverdue 
    ? 'rgba(220, 38, 38, 0.12)' 
    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)');

  const badgeBorder = isOverdue
    ? 'rgba(220, 38, 38, 0.25)'
    : (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)');

  return (
    <GlassCard 
      enterDelay={index * animation.staggerDelay}
      style={{ padding: 18 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: iconBorder,
            }}
          >
            <MaterialIcons 
              name={typeIcon(status)} 
              size={20} 
              color={isOverdue ? overdue : t.text} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontWeight: '800', 
              marginBottom: 3, 
              color: t.text, 
              letterSpacing: -0.3,
              fontSize: 15,
            }}>
              {typeLabel(status)}
            </Text>
            <Text style={{ 
              color: t.textMuted, 
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 0.3,
              fontVariant: ['tabular-nums'],
            }}>
              LAST: {status.lastServiceKM.toLocaleString()} KM
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: badgeBg,
            borderWidth: 1,
            borderColor: badgeBorder,
          }}
        >
          <Text style={{ 
            color: statusTextColor, 
            fontWeight: '700', 
            fontSize: 10,
            letterSpacing: 0.8,
            fontVariant: ['tabular-nums'],
          }}>
            {badgeText}
          </Text>
        </View>
      </View>

      <View style={{ height: 14 }} />

      {/* Progress bar */}
      <View style={{ height: 3, borderRadius: 999, backgroundColor: trackBg, overflow: 'hidden' }}>
        <Animated.View style={barStyle} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ 
          color: t.textMuted, 
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
          fontVariant: ['tabular-nums'],
        }}>
          NEXT: {status.nextServiceKM.toLocaleString()} KM
        </Text>
        <Text style={{ 
          color: statusTextColor, 
          fontSize: 10, 
          fontWeight: '700',
          letterSpacing: 1.2,
        }}>
          {statusLabel(status.status)}
        </Text>
      </View>
    </GlassCard>
  );
}
