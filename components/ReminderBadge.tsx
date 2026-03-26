import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  count: number;
  showDot?: boolean;
};

export default function ReminderBadge({ count, showDot }: Props) {
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
            backgroundColor: 'red',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{Math.min(99, count)}</Text>
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
            backgroundColor: '#10B981',
          }}
        />
      ) : null}
    </View>
  );
}

