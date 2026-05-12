import React from 'react';
import { Text, View, useColorScheme } from 'react-native';

import { overdue, useAppTheme } from '@/constants/theme';

type Props = {
  count: number;
  showDot?: boolean;
};

/**
 * Tesla-inspired reminder badge
 * Minimal with red accent for critical counts
 */
export default function ReminderBadge({ count, showDot }: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';

  if (!count && !showDot) return null;

  return (
    <View style={{ position: 'absolute', right: -6, top: -8 }}>
      {count > 0 ? (
        <View
          style={{
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: overdue,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: t.bg,
          }}>
          <Text style={{ 
            color: 'white', 
            fontSize: 10, 
            fontWeight: '800',
            letterSpacing: 0.2,
            fontVariant: ['tabular-nums'],
          }}>
            {Math.min(99, count)}
          </Text>
        </View>
      ) : null}

      {showDot ? (
        <View
          style={{
            position: 'absolute',
            right: count > 0 ? 0 : -2,
            top: count > 0 ? 16 : 0,
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: t.text,
            borderWidth: 2,
            borderColor: t.bg,
          }}
        />
      ) : null}
    </View>
  );
}
