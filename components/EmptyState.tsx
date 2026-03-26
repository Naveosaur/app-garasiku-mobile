import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { brand, borderRadius } from '@/constants/theme';

type Props = {
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  onCta?: () => void;
};

export default function EmptyState({ emoji = '🏍️', title, subtitle, ctaText, onCta }: Props) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 70, marginBottom: 16 }}>{emoji}</Text>
      <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: ctaText ? 22 : 0 }}>{subtitle}</Text>
      ) : null}
      {ctaText && onCta ? (
        <Pressable
          onPress={onCta}
          style={{
            height: 44,
            paddingHorizontal: 18,
            borderRadius: borderRadius.button,
            backgroundColor: brand,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 220,
          }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>{ctaText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

