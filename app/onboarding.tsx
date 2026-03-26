import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { brand, borderRadius } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();

  async function onGetStarted() {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/(auth)/register');
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        colors={['#4F46E5', '#1E1B4B']}
        style={{ flex: 1, padding: 16, paddingTop: 60, justifyContent: 'space-between' }}>
        <View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 78, marginBottom: 8 }}>🏍️</Text>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
              Never Miss a Service Again
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 10 }}>
              Track KM and keep your motorcycle maintenance on time.
            </Text>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ color: 'white', fontWeight: '900', marginBottom: 10 }}>What you get</Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>•</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Auto maintenance status (Safe / Soon / Overdue).</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>•</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Quick KM update with debounced saving and local reminders.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ color: 'white', fontWeight: '900' }}>•</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Maintenance history grouped by month.</Text>
              </View>
            </View>
          </View>
        </View>

        <View>
          <Pressable
            onPress={onGetStarted}
            style={{
              height: 50,
              borderRadius: borderRadius.button,
              backgroundColor: brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Get Started Free</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Already have an account? Sign In</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

