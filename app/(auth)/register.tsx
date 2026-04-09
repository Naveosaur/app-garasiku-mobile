import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { borderRadius, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const t = useAppTheme();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit() {
    try {
      setError(null);
      const nameTrimmed = fullName.trim();
      const emailTrimmed = email.trim();
      if (!nameTrimmed) return setError('Full Name is required.');
      if (!emailTrimmed) return setError('Email is required.');
      if (!password) return setError('Password is required.');

      setLoading(true);
      await useAuthStore.getState().login({ name: nameTrimmed, email: emailTrimmed });
      router.replace('/');
    } catch {
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function registerWithDummyAccount() {
    try {
      setLoading(true);
      setError(null);
      await useAuthStore.getState().login({
        name: 'Budi Santoso',
        email: 'budi@vehicare.local',
      });
      router.replace('/');
    } catch {
      setError('Failed to register with dummy account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 60, backgroundColor: t.bg }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: t.text, fontSize: 28, fontWeight: '900' }}>VehiCare</Text>
        <Text style={{ color: t.textMuted, marginTop: 6 }}>
          Create an account to get started
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
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
          <Text style={{ fontWeight: '900', color: t.brand }}>Register</Text>
        </View>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            borderRadius: borderRadius.button,
            backgroundColor: t.bgSecondary,
          }}>
          <Text style={{ fontWeight: '900', color: t.text }}>Login</Text>
        </Pressable>
      </View>

      <Text style={{ fontWeight: '900', marginBottom: 6, color: t.text }}>Full Name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="e.g. Budi Santoso"
        placeholderTextColor={t.textSubtle}
        autoCapitalize="words"
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
        onPress={registerWithDummyAccount}
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
        <Text style={{ color: t.text, fontWeight: '900' }}>Use Dummy Account (Quick Start)</Text>
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
        <Text style={{ color: 'white', fontWeight: '900' }}>{loading ? 'Registering...' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

