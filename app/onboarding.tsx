import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { borderRadius, useAppTheme } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const t = useAppTheme();

  async function onGetStarted() {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/(auth)/register');
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: 16, paddingTop: 60, justifyContent: 'space-between' }}>
        <View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 78, marginBottom: 8 }}>🏍️</Text>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
              VehiCare
            </Text>
            <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 10 }}>
              Never miss a service. Track KM and maintain your motorcycle effortlessly.
            </Text>
          </View>

          <View style={{ marginTop: 32 }}>
            <Text style={{ color: t.text, fontWeight: '900', marginBottom: 10 }}>Features</Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: t.brand,
                    marginTop: 6,
                  }}
                />
                <Text style={{ color: t.textMuted, flex: 1 }}>Auto maintenance status (Safe / Soon / Overdue)</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: t.brand,
                    marginTop: 6,
                  }}
                />
                <Text style={{ color: t.textMuted, flex: 1 }}>
                  Quick KM update with automatic saving and local reminders
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: t.brand,
                    marginTop: 6,
                  }}
                />
                <Text style={{ color: t.textMuted, flex: 1 }}>Maintenance history and service records</Text>
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
              backgroundColor: t.brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Get Started</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ color: t.brand }}>Already have an account? Sign In</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

