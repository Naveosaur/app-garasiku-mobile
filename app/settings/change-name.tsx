import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedListItem from '@/components/ui/AnimatedListItem';
import { borderRadius, overdue, useAppTheme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

/**
 * Tesla-inspired Change Name Screen
 */
export default function ChangeNameScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const currentName = user?.name ?? '';

  const [nameDraft, setNameDraft] = React.useState(currentName);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [nameFocused, setNameFocused] = React.useState(false);

  async function onSave() {
    try {
      setError(null);
      const trimmed = nameDraft.trim();
      
      if (!trimmed) return setError('Name cannot be empty');
      if (trimmed === currentName) return setError('Name is the same as before');
      if (trimmed.length < 2) return setError('Name must be at least 2 characters');

      if (user) {
        try {
          setLoading(true);
          const { apiClient } = await import('@/utils/apiClient');
          const { data } = await apiClient.patch<{ 
            success: boolean; 
            data: { id: string; name: string; email: string };
          }>('/users/me', { name: trimmed });
          useAuthStore.setState({ user: data.data });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          router.back();
        } catch {
          setError('Failed to update name. Please try again.');
          Alert.alert('Error', 'Failed to update name');
        } finally {
          setLoading(false);
        }
      }
    } catch {
      setError('Failed to update name. Please try again.');
      setLoading(false);
    }
  }

  const isValid = nameDraft.trim().length >= 2 && nameDraft.trim() !== currentName;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AmbientBackground />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '700', 
                color: t.textSubtle, 
                letterSpacing: 2,
                marginBottom: 6,
              }}>
                SETTINGS
              </Text>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '900', 
                color: t.text, 
                letterSpacing: -1.2,
              }}>
                Change Name
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.7 : 1,
              })}>
              <MaterialIcons name="close" size={22} color={t.text} />
            </Pressable>
          </View>
        </AnimatedListItem>

        {/* Current Name */}
        <AnimatedListItem index={1}>
          <Text style={{ 
            fontWeight: '700', 
            marginBottom: 10, 
            color: t.textMuted, 
            fontSize: 11,
            letterSpacing: 1.5,
          }}>
            CURRENT NAME
          </Text>
          <View
            style={{
              height: 56,
              borderRadius: borderRadius.input,
              borderWidth: 1,
              borderColor: t.inputBorder,
              paddingHorizontal: 18,
              backgroundColor: t.inputBg,
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ 
              color: t.textMuted, 
              fontSize: 15,
              fontWeight: '500',
              letterSpacing: -0.2,
            }}>
              {currentName || 'Not set'}
            </Text>
          </View>
        </AnimatedListItem>

        {/* New Name Input */}
        <AnimatedListItem index={2}>
          <Text style={{ 
            fontWeight: '700', 
            marginBottom: 10, 
            color: t.textMuted, 
            fontSize: 11,
            letterSpacing: 1.5,
          }}>
            NEW NAME
          </Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholder="Enter your full name"
            placeholderTextColor={t.textSubtle}
            autoCapitalize="words"
            autoComplete="name"
            autoFocus
            style={{
              height: 56,
              borderRadius: borderRadius.input,
              borderWidth: 1,
              borderColor: nameFocused ? t.brand : t.inputBorder,
              paddingHorizontal: 18,
              marginBottom: 20,
              backgroundColor: t.inputBg,
              color: t.text,
              fontSize: 15,
              fontWeight: '500',
              letterSpacing: -0.2,
            }}
          />
        </AnimatedListItem>

        {/* Error Message */}
        {error ? (
          <AnimatedListItem index={3}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'rgba(220, 38, 38, 0.10)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(220, 38, 38, 0.20)',
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: overdue }} />
              <Text style={{ color: overdue, fontWeight: '600', fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          </AnimatedListItem>
        ) : null}

        {/* Save Button */}
        <AnimatedListItem index={4}>
          <Pressable
            onPress={onSave}
            disabled={!isValid || loading}
            style={({ pressed }) => ({
              borderRadius: borderRadius.button,
              overflow: 'hidden',
              opacity: (!isValid || loading) ? 0.5 : (pressed ? 0.95 : 1),
              transform: [{ scale: pressed ? 0.98 : 1 }],
              marginTop: 8,
              shadowColor: isDark ? '#FFFFFF' : '#000000',
              shadowOpacity: isDark ? 0.15 : 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            })}>
            <View style={{
              height: 58,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.brand,
            }}>
              <Text style={{ 
                color: isDark ? '#000000' : '#FFFFFF', 
                fontWeight: '700', 
                fontSize: 15,
                letterSpacing: 1,
              }}>
                {loading ? 'SAVING...' : 'SAVE NAME'}
              </Text>
            </View>
          </Pressable>
        </AnimatedListItem>
      </ScrollView>
    </View>
  );
}
