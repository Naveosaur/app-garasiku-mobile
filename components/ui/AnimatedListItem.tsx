import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { animation } from '@/constants/theme';

type Props = Readonly<{
  index: number;
  children: React.ReactNode;
}>;

/**
 * Wraps list items with a staggered fade+slide entrance.
 * Pass `index` for sequential delay.
 */
export default function AnimatedListItem({ index, children }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = index * animation.staggerDelay;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: animation.duration.normal, easing: animation.easing }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: animation.duration.normal, easing: animation.easing }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}
