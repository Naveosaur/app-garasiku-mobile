import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { animation } from '@/constants/theme';

/**
 * Tesla-inspired ambient background
 * Subtle monochrome glow blobs with cinematic feel
 */
export default function AmbientBackground() {
  const isDark = useColorScheme() === 'dark';

  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3Opacity = useSharedValue(0.3);

  useEffect(() => {
    blob1X.value = withRepeat(
      withSequence(
        withTiming(40, { duration: animation.duration.blob }),
        withTiming(-30, { duration: animation.duration.blob }),
        withTiming(0, { duration: animation.duration.blob }),
      ),
      -1,
      true,
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: animation.duration.blob * 1.2 }),
        withTiming(35, { duration: animation.duration.blob * 1.2 }),
        withTiming(0, { duration: animation.duration.blob * 1.2 }),
      ),
      -1,
      true,
    );
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: animation.duration.blob * 1.3 }),
        withTiming(30, { duration: animation.duration.blob * 1.3 }),
        withTiming(0, { duration: animation.duration.blob * 1.3 }),
      ),
      -1,
      true,
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(40, { duration: animation.duration.blob }),
        withTiming(-25, { duration: animation.duration.blob }),
        withTiming(0, { duration: animation.duration.blob }),
      ),
      -1,
      true,
    );
    blob3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: animation.duration.blob * 0.8 }),
        withTiming(0.2, { duration: animation.duration.blob * 0.8 }),
      ),
      -1,
      true,
    );
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    opacity: blob3Opacity.value,
  }));

  // Color palette based on theme
  const blob1Color = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
  const blob2Color = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const blob3Color = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)';
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Top-left ambient glow */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1, 
          blob1Style,
          { 
            backgroundColor: blob1Color,
            shadowColor,
          }
        ]} 
      />
      {/* Bottom-right ambient glow */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob2, 
          blob2Style,
          { 
            backgroundColor: blob2Color,
            shadowColor,
          }
        ]} 
      />
      {/* Center subtle pulse */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob3, 
          blob3Style,
          { 
            backgroundColor: blob3Color,
            shadowColor,
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 320,
    height: 320,
    top: -100,
    left: -80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 80,
    elevation: 0,
  },
  blob2: {
    width: 280,
    height: 280,
    bottom: 60,
    right: -80,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 0,
  },
  blob3: {
    width: 200,
    height: 200,
    top: '40%',
    left: '30%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 0,
  },
});
