import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { overdue, useAppTheme } from '@/constants/theme';
import type { ServiceStatus } from '@/types';

type Props = {
  status: ServiceStatus;
  onPress?: () => void;
};

/**
 * Tesla-inspired minimal status badge
 * Monochrome with only critical states highlighted
 */
export default function StatusBadge({ status, onPress }: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  
  const label = status === 'overdue' ? 'OVERDUE' : status === 'soon' ? 'DUE SOON' : 'SAFE';
  
  // Monochrome design - only overdue uses red accent
  let bg: string;
  let fg: string;
  let borderColor: string;
  
  if (status === 'overdue') {
    bg = isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)';
    fg = overdue;
    borderColor = isDark ? 'rgba(220, 38, 38, 0.30)' : 'rgba(220, 38, 38, 0.20)';
  } else if (status === 'soon') {
    bg = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
    fg = t.text;
    borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
  } else {
    bg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
    fg = t.textMuted;
    borderColor = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
  }

  const content = (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor,
      }}>
      <Text style={{ 
        color: fg, 
        fontWeight: '700', 
        fontSize: 10,
        letterSpacing: 1.2,
      }}>
        {label}
      </Text>
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
        style={{ minHeight: 44, justifyContent: 'center' }}>
        {content}
      </Pressable>
    );
  }

  return content;
}
