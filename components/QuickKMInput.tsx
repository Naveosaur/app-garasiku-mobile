import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { borderRadius } from '@/constants/theme';

type Props = {
  value: number;
  onSave: (nextKM: number) => Promise<void> | void;
  debounceMs?: number;
  placeholder?: string;
  helperText?: string;
};

export default function QuickKMInput({
  value,
  onSave,
  debounceMs = 800,
  placeholder,
  helperText,
}: Props) {
  const [draft, setDraft] = React.useState<string>(String(value));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  React.useEffect(() => {
    const parsed = Number(draft.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(parsed) || parsed === value) return;

    const t = setTimeout(() => {
      setSaving(true);
      Promise.resolve(onSave(parsed))
        .catch(() => undefined)
        .finally(() => {
          setSaving(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        });
    }, debounceMs);

    return () => clearTimeout(t);
  }, [debounceMs, draft, onSave, value]);

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        keyboardType="numeric"
        placeholder={placeholder}
        style={{
          height: 44,
          borderRadius: borderRadius.input,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 12,
          backgroundColor: 'white',
        }}
      />
      {helperText ? (
        <Text style={{ color: '#64748B', fontSize: 12 }}>
          {saving ? 'Saving...' : helperText}
        </Text>
      ) : null}
    </View>
  );
}

