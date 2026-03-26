import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { overdue, safe, safeLight, soon, soonLight } from '@/constants/theme';
import type { ServiceStatus } from '@/types';

type Props = {
  status: ServiceStatus;
  onPress?: () => void;
};

export default function StatusBadge({ status, onPress }: Props) {
  const label = status === 'overdue' ? 'OVERDUE' : status === 'soon' ? 'SERVICE SOON' : 'SAFE';
  const bg =
    status === 'overdue' ? 'rgba(239, 68, 68, 0.14)' : status === 'soon' ? `${soonLight}CC` : `${safeLight}CC`;
  const fg = status === 'overdue' ? overdue : status === 'soon' ? soon : safe;

  const content = (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: fg, fontWeight: '900', fontSize: 12 }}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          onPress();
        }}
        style={{ minHeight: 44 }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

