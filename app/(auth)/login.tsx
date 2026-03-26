import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { brand, borderRadius } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit() {
    try {
      setError(null);
      const emailTrimmed = email.trim();
      if (!emailTrimmed) return setError('Email is required.');
      if (!password) return setError('Password is required.');

      setLoading(true);

      // For MVP: local auth means we just store email (name derived from email prefix).
      const nameFromEmail = emailTrimmed.split('@')[0].replace(/[._-]+/g, ' ');
      const name = nameFromEmail
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(' ');

      await useAuthStore.getState().login({ name, email: emailTrimmed });
      router.replace('/');
    } catch {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loginWithDummyAccount() {
    try {
      setLoading(true);
      setError(null);
      await useAuthStore.getState().login({
        name: 'Budi Santoso',
        email: 'budi@vehicletracker.local',
      });
      router.replace('/');
    } catch {
      setError('Failed to login with dummy account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 60 }}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={{ borderRadius: 16, padding: 14, marginBottom: 16 }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Login</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
          Local-only authentication (MVP).
        </Text>
      </LinearGradient>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: borderRadius.button,
            backgroundColor: '#EEF2FF',
          }}>
          <Text style={{ fontWeight: '900', color: '#4338CA' }}>Register</Text>
        </Pressable>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: borderRadius.button,
            backgroundColor: 'rgba(99,102,241,0.16)',
          }}>
          <Text style={{ fontWeight: '900', color: brand }}>Login</Text>
        </View>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: 'white',
        }}
      />

      <Text style={{ fontWeight: '900', marginBottom: 6 }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: 'white',
        }}
      />

      <Pressable
        onPress={loginWithDummyAccount}
        style={{
          height: 44,
          borderRadius: borderRadius.button,
          backgroundColor: '#111827',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>Use Dummy Account (Quick Login)</Text>
      </Pressable>

      {error ? <Text style={{ color: '#EF4444', fontWeight: '900', marginBottom: 12 }}>{error}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>{loading ? 'Signing in...' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

