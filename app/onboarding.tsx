import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import AmbientBackground from "@/components/ui/AmbientBackground";
import { animation, borderRadius, useAppTheme } from "@/constants/theme";
import { useOnboardingStore } from "@/store/onboardingStore";

/**
 * Tesla-inspired Onboarding Screen
 * Minimal, clean, premium feel
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  // Entrance animations
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const featuresOpacity = useSharedValue(0);
  const featuresY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonY = useSharedValue(20);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: animation.duration.slow, easing: animation.easing });
    titleY.value = withTiming(0, { duration: animation.duration.slow, easing: animation.easing });
    
    featuresOpacity.value = withDelay(300, withTiming(1, { duration: animation.duration.normal, easing: animation.easing }));
    featuresY.value = withDelay(300, withTiming(0, { duration: animation.duration.normal, easing: animation.easing }));
    
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: animation.duration.normal, easing: animation.easing }));
    buttonY.value = withDelay(500, withTiming(0, { duration: animation.duration.normal, easing: animation.easing }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonY.value }],
  }));

  async function onGetStarted() {
    await completeOnboarding();
    router.replace('/(auth)/auth');
  }

  const features = [
    { icon: '◉', text: 'Automatic maintenance tracking' },
    { icon: '◈', text: 'Smart KM-based reminders' },
    { icon: '◇', text: 'Complete service history' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 24, paddingTop: 120, paddingBottom: 48, justifyContent: 'space-between' }}>
          {/* Hero Section */}
          <View>
            <Animated.View style={titleStyle}>
              <Text style={{ 
                color: t.text, 
                fontSize: 56, 
                fontWeight: '900',
                letterSpacing: -2.5,
                marginBottom: 12,
                lineHeight: 60,
              }}>
                VehiCare
              </Text>
              <Text style={{ 
                color: t.text, 
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 2,
                marginBottom: 20,
              }}>
                TRACK · MAINTAIN · DRIVE
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 17,
                fontWeight: '500',
                letterSpacing: -0.3,
                lineHeight: 26,
                maxWidth: 340,
              }}>
                Premium vehicle maintenance tracking. Never miss a service again.
              </Text>
            </Animated.View>

            {/* Features */}
            <Animated.View style={[featuresStyle, { marginTop: 56 }]}>
              <Text style={{ 
                color: t.textSubtle, 
                fontSize: 11, 
                fontWeight: '700',
                letterSpacing: 2,
                marginBottom: 20,
              }}>
                FEATURES
              </Text>
              <View style={{ gap: 20 }}>
                {features.map((feature, index) => (
                  <View 
                    key={index}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>
                        {feature.icon}
                      </Text>
                    </View>
                    <Text style={{ 
                      color: t.text, 
                      fontSize: 15,
                      fontWeight: '500',
                      letterSpacing: -0.2,
                      flex: 1,
                    }}>
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>

          {/* CTA Section */}
          <Animated.View style={[buttonStyle, { marginTop: 40 }]}>
            <Pressable
              onPress={onGetStarted}
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderRadius: borderRadius.button,
                overflow: 'hidden',
                opacity: pressed ? 0.95 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                marginBottom: 16,
                shadowColor: isDark ? '#FFFFFF' : '#000000',
                shadowOpacity: isDark ? 0.15 : 0.12,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              })}
            >
              <View
                style={{
                  height: 58,
                  backgroundColor: t.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ 
                  color: isDark ? '#000000' : '#FFFFFF', 
                  fontWeight: "700", 
                  fontSize: 15,
                  letterSpacing: 1.2,
                }}>
                  GET STARTED
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.replace("/(auth)/auth")}
              style={{ paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ 
                color: t.textMuted, 
                fontWeight: "500", 
                fontSize: 14,
                letterSpacing: -0.2,
              }}>
                Already have an account? <Text style={{ color: t.text, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
