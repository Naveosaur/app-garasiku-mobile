import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { borderRadius, useAppTheme } from '@/constants/theme';

type Props = {
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  onCta?: () => void;
};

/**
 * Tesla-inspired empty state component
 * Minimal monochrome with subtle elevation
 */
export default function EmptyState({ emoji = '🏍️', title, subtitle, ctaText, onCta }: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <Text style={{ fontSize: 40 }}>{emoji}</Text>
      </View>
      
      <Text style={{ 
        fontSize: 24, 
        fontWeight: '900', 
        textAlign: 'center', 
        marginBottom: 10,
        color: t.text,
        letterSpacing: -0.8,
      }}>
        {title}
      </Text>
      
      {subtitle ? (
        <Text style={{ 
          color: t.textMuted, 
          textAlign: 'center', 
          marginBottom: ctaText ? 28 : 0,
          fontSize: 15,
          lineHeight: 22,
          fontWeight: '500',
          maxWidth: 280,
        }}>
          {subtitle}
        </Text>
      ) : null}
      
      {ctaText && onCta ? (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => ({
            borderRadius: borderRadius.button,
            overflow: 'hidden',
            minWidth: 220,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: isDark ? '#FFFFFF' : '#000000',
            shadowOpacity: isDark ? 0.15 : 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          })}>
          <View
            style={{
              height: 52,
              paddingHorizontal: 24,
              backgroundColor: t.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ 
              color: isDark ? '#000000' : '#FFFFFF', 
              fontWeight: '700',
              fontSize: 13,
              letterSpacing: 1,
            }}>
              {ctaText.toUpperCase()}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
