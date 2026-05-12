import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { animation, borderRadius, glassShadowStyle, useAppTheme } from '@/constants/theme';

type Props = Readonly<{
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  noShadow?: boolean;
  /** Animate entrance on mount. Pass item index for stagger. */
  enterDelay?: number;
  /** Strong glass variant for elevated surfaces */
  strong?: boolean;
}>;

/**
 * Tesla-inspired glass morphism card
 * Premium frosted glass with subtle border highlights
 */
export default function GlassCard({ 
  children, 
  style, 
  intensity, 
  noShadow, 
  enterDelay,
  strong,
}: Props) {
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const g = t.glass;

  const hasEntrance = enterDelay !== undefined;
  const opacity = useSharedValue(hasEntrance ? 0 : 1);
  const translateY = useSharedValue(hasEntrance ? 20 : 0);
  const scale = useSharedValue(hasEntrance ? 0.96 : 1);

  useEffect(() => {
    if (enterDelay !== undefined) {
      opacity.value = withDelay(
        enterDelay,
        withTiming(1, { duration: animation.duration.normal, easing: animation.easing }),
      );
      translateY.value = withDelay(
        enterDelay,
        withTiming(0, { duration: animation.duration.normal, easing: animation.easing }),
      );
      scale.value = withDelay(
        enterDelay,
        withTiming(1, { duration: animation.duration.normal, easing: animation.easing }),
      );
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const surfaceColor = strong ? g.surfaceStrong : g.surface;
  const blurIntensity = intensity ?? g.blurIntensity;

  return (
    <Animated.View
      style={[
        { borderRadius: borderRadius.card, overflow: 'hidden' },
        noShadow ? undefined : glassShadowStyle(isDark),
        style,
        animStyle,
      ]}
    >
      {/* Blur layer */}
      <BlurView
        intensity={blurIntensity}
        tint={g.blurTint}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Base surface tint */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: surfaceColor }]} />
      
      {/* Subtle gradient overlay for depth */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']
          : ['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.00)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Outer hairline border */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: borderRadius.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: g.border,
          },
        ]}
      />
      
      {/* Top-edge highlight for depth */}
      <View
        style={[
          styles.topHighlight,
          {
            borderTopColor: g.topHighlight,
            borderRadius: borderRadius.card,
          },
        ]}
      />
      
      {/* Content */}
      <View style={{ position: 'relative' }}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
});
