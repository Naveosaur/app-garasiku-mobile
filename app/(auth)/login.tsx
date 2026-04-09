import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';

import { borderRadius, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const t = useAppTheme();

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
        email: 'budi@vehicare.local',
      });
      router.replace('/');
    } catch {
      setError('Failed to login with dummy account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 60, backgroundColor: t.bg }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '900' }}>VehiCare</Text>
        <Text style={{ color: t.textMuted, marginTop: 6 }}>
          Sign in to manage your motorcycle maintenance
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: borderRadius.button,
            backgroundColor: t.bgSecondary,
          }}>
          <Text style={{ fontWeight: '900', color: t.text }}>Register</Text>
        </Pressable>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: borderRadius.button,
            backgroundColor: t.brandMuted,
            borderBottomWidth: 2,
            borderBottomColor: t.brand,
          }}>
          <Text style={{ fontWeight: '900', color: t.brand }}>Login</Text>
        </View>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={t.textSubtle}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={t.textSubtle}
        secureTextEntry
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: t.inputBorder,
          paddingHorizontal: 12,
          marginBottom: 14,
          backgroundColor: t.inputBg,
          color: t.text,
        }}
      />

      <Pressable
        onPress={loginWithDummyAccount}
        style={{
          height: 44,
          borderRadius: borderRadius.button,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}>
        <Text style={{ color: t.text, fontWeight: '900' }}>Use Dummy Account (Quick Login)</Text>
      </Pressable>

      {error ? <Text style={{ color: '#EF4444', fontWeight: '900', marginBottom: 12 }}>{error}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: t.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: loading ? 0.7 : 1,
        }}>
        <Text style={{ color: 'white', fontWeight: '900' }}>{loading ? 'Signing in...' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

