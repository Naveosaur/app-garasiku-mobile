import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme, View, Text } from 'react-native';

import { overdue, safe, soon, useAppTheme } from '@/constants/theme';
import type { MaintenanceStatus } from '@/types';

type Props = {
  status: MaintenanceStatus;
};

function statusColor(status: MaintenanceStatus['status']) {
  if (status === 'overdue') return overdue;
  if (status === 'soon') return soon;
  return safe;
}

function typeLabel(type: MaintenanceStatus['type']) {
  switch (type) {
    case 'oil_change':
      return 'Oil Change';
    case 'brake_pads':
      return 'Brake Pads';
    case 'battery':
      return 'Battery';
    case 'general_service':
      return 'General Service';
    default:
      return type;
  }
}

function typeIcon(type: MaintenanceStatus['type']) {
  switch (type) {
    case 'oil_change':
      return 'oil_barrel';
    case 'brake_pads':
      return 'directions_bike';
    case 'battery':
      return 'battery_charging_full';
    case 'general_service':
      return 'build';
    default:
      return 'build';
  }
}

export default function MaintenanceProgressRow({ status }: Props) {
  const t = useAppTheme();
  const color = statusColor(status.status);
  const intervalKM = status.intervalKM || 1;

  const usedKM = Math.max(0, intervalKM - status.remainingKM);
  const fillRatio = Math.min(1, Math.max(0, usedKM / intervalKM));

  const badgeText = status.status === 'overdue' ? 'Overdue!' : `${Math.max(0, status.remainingKM).toLocaleString()} km`;

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.surface,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: `${color}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MaterialIcons name={typeIcon(status.type) as any} size={18} color={color} />
          </View>
          <View>
            <Text style={{ fontWeight: '800', marginBottom: 2, color: t.text }}>{typeLabel(status.type)}</Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>Last: {status.lastServiceKM.toLocaleString()} km</Text>
          </View>
        </View>

        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 20,
            backgroundColor: `${color}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color, fontWeight: '900', fontSize: 12 }}>{badgeText}</Text>
        </View>
      </View>

      <View style={{ height: 10 }} />

      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: t.border,
          overflow: 'hidden',
        }}>
        <View style={{ height: '100%', width: `${Math.round(fillRatio * 100)}%`, backgroundColor: color }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ color: t.textMuted, fontSize: 12 }}>Next: {status.nextServiceKM.toLocaleString()} km</Text>
        <Text style={{ color: color, fontSize: 12, fontWeight: '800' }}>{status.status === 'safe' ? 'Safe' : status.status === 'soon' ? 'Soon' : 'Overdue'}</Text>
      </View>
    </View>
  );
}

