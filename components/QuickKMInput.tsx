import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TextInput, View, useColorScheme } from 'react-native';

import { borderRadius, useAppTheme } from '@/constants/theme';

type Props = {
  value: number;
  onSave: (nextKM: number) => Promise<void> | void;
  debounceMs?: number;
  placeholder?: string;
  helperText?: string;
};

/**
 * Tesla-inspired Quick KM Input
 * Minimal monochrome with auto-save
 */
export default function QuickKMInput({
  value,
  onSave,
  debounceMs = 800,
  placeholder,
  helperText,
}: Props) {
  const theme = useAppTheme();
  const isDark = useColorScheme() === 'dark';
  
  const [draft, setDraft] = React.useState<string>(String(value));
  const [saving, setSaving] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  React.useEffect(() => {
    const parsed = Number(draft.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(parsed) || parsed === value) return;

    const timer = setTimeout(() => {
      setSaving(true);
      Promise.resolve(onSave(parsed))
        .catch(() => undefined)
        .finally(() => {
          setSaving(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, draft, onSave, value]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        height: 56,
        borderRadius: borderRadius.input,
        borderWidth: 1,
        borderColor: focused ? theme.brand : theme.inputBorder,
        paddingHorizontal: 16,
        backgroundColor: theme.inputBg,
      }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={theme.textSubtle}
          style={{
            flex: 1,
            color: theme.text,
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: -0.4,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text style={{ 
          color: theme.textMuted, 
          fontSize: 12, 
          fontWeight: '700',
          letterSpacing: 1,
        }}>
          KM
        </Text>
      </View>
      
      {helperText || saving ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ 
            width: 6, 
            height: 6, 
            borderRadius: 3, 
            backgroundColor: saving ? theme.text : theme.textMuted,
          }} />
          <Text style={{ 
            color: theme.textMuted, 
            fontSize: 11,
            fontWeight: '500',
            letterSpacing: 0.3,
          }}>
            {saving ? 'Saving...' : helperText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
