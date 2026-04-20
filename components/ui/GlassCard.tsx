import { BlurView } from 'expo-blur';
import { View, useColorScheme, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, useAppTheme, glassShadowStyle } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noShadow?: boolean;
};

export default function GlassCard({ children, style, intensity, noShadow }: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const g = t.glass;

  return (
    <View
      style={[
        { borderRadius: borderRadius.card, overflow: 'hidden' },
        !noShadow && glassShadowStyle(isDark),
        style,
      ]}
    >
      <BlurView
        intensity={intensity ?? g.blurIntensity}
        tint={g.blurTint}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: g.surface },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: borderRadius.card,
            borderWidth: 1,
            borderColor: g.border,
          },
        ]}
      />
      <View style={{ position: 'relative' }}>
        {children}
      </View>
    </View>
  );
}
