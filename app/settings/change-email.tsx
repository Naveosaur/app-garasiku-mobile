import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const currentEmail = user?.email ?? '';

  const [emailDraft, setEmailDraft] = React.useState(currentEmail);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function onSave() {
    try {
      setError(null);
      setSuccess(false);

      const emailTrimmed = emailDraft.trim();
      if (!emailTrimmed) {
        return setError('Email cannot be empty.');
      }

      if (emailTrimmed === currentEmail) {
        return setError('Email is the same as before.');
      }

      if (user) {
        useAuthStore.getState().login({ ...user, email: emailTrimmed });
        setSuccess(true);
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch {
      setError('Failed to update email. Please try again.');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: insets.top + 16, paddingBottom: 28, backgroundColor: t.bg }}>
      {/* Header with Back Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: t.text }}>Change Email</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: borderRadius.button,
            backgroundColor: t.bgSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MaterialIcons name="close" size={20} color={t.text} />
        </Pressable>
      </View>

      {/* Current Email */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8, color: t.text, fontSize: 13 }}>Current Email</Text>
        <View
          style={{
            height: 44,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: t.inputBorder,
            paddingHorizontal: 12,
            backgroundColor: t.inputBg,
            justifyContent: 'center',
          }}>
          <Text style={{ color: t.textMuted, fontSize: 14 }}>{currentEmail}</Text>
        </View>
      </View>

      {/* New Email Input */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8, color: t.text, fontSize: 13 }}>New Email</Text>
        <TextInput
          value={emailDraft}
          onChangeText={setEmailDraft}
          placeholder="Enter your new email"
          placeholderTextColor={t.textSubtle}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
          style={{
            height: 44,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: t.inputBorder,
            paddingHorizontal: 12,
            backgroundColor: t.inputBg,
            color: t.text,
          }}
        />
      </View>

      {/* Error Message */}
      {error ? (
        <Text style={{ color: '#EF4444', fontWeight: '600', marginBottom: 16, fontSize: 13 }}>{error}</Text>
      ) : null}

      {/* Success Message */}
      {success ? (
        <Text style={{ color: '#22C55E', fontWeight: '600', marginBottom: 16, fontSize: 13 }}>Email updated successfully!</Text>
      ) : null}

      {/* Save Button */}
      <Pressable
        onPress={onSave}
        disabled={!emailDraft.trim() || emailDraft.trim() === currentEmail}
        style={{
          height: 48,
          borderRadius: borderRadius.button,
          backgroundColor: t.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: emailDraft.trim() && emailDraft.trim() !== currentEmail ? 1 : 0.5,
        }}>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Save Email</Text>
      </Pressable>
    </ScrollView>
  );
}
