import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  Pressable, 
  ScrollView, 
  Text, 
  TextInput, 
  View, 
  useColorScheme, 
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import AmbientBackground from '@/components/ui/AmbientBackground';
import { animation, borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useVehicleStore } from '@/store/vehicleStore';

type AuthMode = 'login' | 'register';

/**
 * Tesla-inspired Auth Screen
 * Minimal monochrome with seamless tab switching
 */
export default function AuthScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // Tab indicator animation - actual pixel translation
  const tabIndicatorX = useSharedValue(0);
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  // Calculate indicator width (half of container minus padding)
  const indicatorWidth = tabContainerWidth > 0 ? (tabContainerWidth - 8) / 2 : 0;

  // Form animation - subtle fade only
  const formOpacity = useSharedValue(1);
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  useEffect(() => {
    opacity.value = withDelay(150, withTiming(1, { duration: animation.duration.slow, easing: animation.easing }));
    translateY.value = withDelay(150, withTiming(0, { duration: animation.duration.slow, easing: animation.easing }));
  }, []);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return;
    
    // Subtle fade transition for form
    formOpacity.value = withTiming(0, { duration: 120 }, () => {
      formOpacity.value = withTiming(1, { duration: 200 });
    });

    // Smooth indicator slide - no overshoot
    tabIndicatorX.value = withTiming(
      newMode === 'register' ? indicatorWidth : 0,
      { duration: 280, easing: animation.easing }
    );

    setMode(newMode);
    setError(null);
    Keyboard.dismiss();
  }

  async function onSubmit() {
    try {
      setError(null);
      const emailTrimmed = email.trim();
      
      if (mode === 'register') {
        const nameTrimmed = fullName.trim();
        if (!nameTrimmed) return setError('Full name is required');
        if (!emailTrimmed) return setError('Email is required');
        if (!password || password.length < 8) return setError('Password must be at least 8 characters');
        
        setLoading(true);
        await useAuthStore.getState().register(nameTrimmed, emailTrimmed, password);
        router.replace('/');
      } else {
        if (!emailTrimmed) return setError('Email is required');
        if (!password) return setError('Password is required');
        
        setLoading(true);
        await useAuthStore.getState().login(emailTrimmed, password);
        await useVehicleStore.getState().loadVehicles();
        router.replace('/');
      }
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: {
            error?: {
              message?: string;
              fields?: Record<string, string>;
            };
          };
        };
        message?: string;
        code?: string;
      };

      // Extract field validation errors
      const fields = error.response?.data?.error?.fields;
      if (fields && Object.keys(fields).length > 0) {
        const firstError = Object.values(fields)[0];
        return setError(firstError);
      }

      // Extract backend error message
      const msg = error.response?.data?.error?.message;
      if (msg) return setError(msg);

      // Network errors
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        return setError('Cannot connect to server. Please check your connection.');
      }

      // Timeout
      if (error.code === 'ECONNABORTED') {
        return setError('Request timeout. Please try again.');
      }

      setError(`Failed to ${mode}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (focused: boolean) => ({
    height: 56,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: focused ? t.brand : t.inputBorder,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: t.inputBg,
    color: t.text,
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 100, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={contentStyle}>
            {/* Brand - Minimal Tesla-style */}
            <View style={{ marginBottom: 48 }}>
              <Text style={{ 
                color: t.text, 
                fontSize: 40, 
                fontWeight: '900', 
                letterSpacing: -1.5, 
                marginBottom: 8,
              }}>
                VehiCare
              </Text>
              <Text style={{ 
                color: t.text, 
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 2,
                marginBottom: 16,
                opacity: 0.7,
              }}>
                TRACK · MAINTAIN · DRIVE
              </Text>
              <Text style={{ 
                color: t.textMuted, 
                fontSize: 16, 
                lineHeight: 24,
                fontWeight: '500',
                letterSpacing: -0.2,
              }}>
                {mode === 'login' 
                  ? 'Sign in to continue' 
                  : 'Create your account'}
              </Text>
            </View>

            {/* Tab switcher - Minimal */}
            <View style={{ marginBottom: 32 }}>
              <View
                onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width)}
                style={{
                  flexDirection: 'row',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  borderRadius: borderRadius.button,
                  padding: 4,
                  position: 'relative',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }}
              >
                {/* Animated indicator */}
                {indicatorWidth > 0 && (
                  <Animated.View
                    style={[
                      tabIndicatorStyle,
                      {
                        position: 'absolute',
                        left: 4,
                        top: 4,
                        bottom: 4,
                        width: indicatorWidth,
                        backgroundColor: t.brand,
                        borderRadius: borderRadius.button - 4,
                      },
                    ]}
                  />
                )}
                
                <Pressable
                  onPress={() => switchMode('login')}
                  accessibilityRole="button"
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, zIndex: 1 }}
                >
                  <Text 
                    style={{ 
                      fontWeight: '700', 
                      color: mode === 'login' ? (isDark ? '#000000' : '#FFFFFF') : t.textMuted, 
                      fontSize: 14,
                      letterSpacing: 0.5,
                    }}
                  >
                    SIGN IN
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => switchMode('register')}
                  accessibilityRole="button"
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, zIndex: 1 }}
                >
                  <Text 
                    style={{ 
                      fontWeight: '700', 
                      color: mode === 'register' ? (isDark ? '#000000' : '#FFFFFF') : t.textMuted, 
                      fontSize: 14,
                      letterSpacing: 0.5,
                    }}
                  >
                    REGISTER
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Form */}
            <Animated.View style={formStyle}>
              {mode === 'register' && (
                <>
                  <Label text="FULL NAME" t={t} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your name"
                    placeholderTextColor={t.textSubtle}
                    autoCapitalize="words"
                    autoComplete="name"
                    accessibilityLabel="Full Name"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    style={inputStyle(nameFocused)}
                  />
                </>
              )}

              <Label text="EMAIL" t={t} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={t.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessibilityLabel="Email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={inputStyle(emailFocused)}
              />

              <Label text="PASSWORD" t={t} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={t.textSubtle}
                secureTextEntry
                autoComplete={mode === 'register' ? 'new-password' : 'password'}
                accessibilityLabel="Password"
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                style={inputStyle(passFocused)}
              />

              {error ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: 'rgba(220, 38, 38, 0.10)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(220, 38, 38, 0.20)',
                  }}
                >
                  <View style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: 3, 
                    backgroundColor: overdue,
                  }} />
                  <Text style={{ 
                    color: overdue, 
                    fontWeight: '600', 
                    fontSize: 13, 
                    flex: 1,
                    letterSpacing: -0.1,
                  }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Primary CTA - Tesla-style button */}
              <Pressable
                onPress={onSubmit}
                disabled={loading}
                accessibilityRole="button"
                style={({ pressed }) => ({ 
                  borderRadius: borderRadius.button, 
                  overflow: 'hidden', 
                  opacity: loading ? 0.7 : pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  marginTop: 8,
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
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: t.brand,
                  }}
                >
                  <Text style={{ 
                    color: isDark ? '#000000' : '#FFFFFF', 
                    fontWeight: '700', 
                    fontSize: 15, 
                    letterSpacing: 1,
                  }}>
                    {loading 
                      ? (mode === 'login' ? 'SIGNING IN...' : 'CREATING ACCOUNT...') 
                      : (mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT')
                    }
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Label({ text, t }: Readonly<{ text: string; t: ReturnType<typeof useAppTheme> }>) {
  return (
    <Text style={{ 
      fontWeight: '700', 
      marginBottom: 10, 
      color: t.textMuted, 
      fontSize: 11,
      letterSpacing: 1.5,
    }}>
      {text}
    </Text>
  );
}
