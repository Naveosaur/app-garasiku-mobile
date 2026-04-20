import { Platform, useColorScheme } from 'react-native';

import type { ServiceStatus } from '@/types';

// Status colors (same across light/dark)
export const safe = '#22C55E';
export const safeLight = '#DCFCE7';
export const safeDark = '#166534';

export const soon = '#EAB308';
export const soonLight = '#FEF9C3';
export const soonDark = '#713F12';

export const overdue = '#EF4444';
export const overdueLight = '#FEE2E2';
export const overdueDark = '#7F1D1D';

// Legacy exports for backward compatibility
export const brand = '#111827';
export const brandLight = '#EEF2FF';
export const text = '#111827';
export const muted = '#6B7280';
export const border = '#F3F4F6';
export const bg = '#FFFFFF';
export const card = '#FFFFFF';

export const cardGradients: Record<ServiceStatus, [string, string]> = {
  safe: [safeDark, safe],
  soon: [soonDark, soon],
  overdue: [overdueDark, overdue],
};

export const borderRadius = {
  card: 20,
  button: 14,
  input: 12,
  badge: 999,
  modal: 28,
  sheet: 32,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Typography = {
  boldWeight: '600',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
    web: 'monospace',
  }),
} as const;

// New premium light/dark theme token system
export const theme = {
  light: {
    // Backgrounds
    bg: '#FFFFFF',
    bgSecondary: '#FAFAFA',
    surface: '#FFFFFF',

    // Text
    text: '#111827',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',

    // Brand
    brand: '#111827',
    brandMuted: '#F3F4F6',

    // Borders & dividers
    border: '#F3F4F6',
    borderStrong: '#E5E7EB',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#F3F4F6',

    // Input
    inputBg: '#F9FAFB',
    inputBorder: '#E5E7EB',

    // Status badge backgrounds
    safeBadgeBg: 'rgba(34, 197, 94, 0.12)',
    soonBadgeBg: 'rgba(234, 179, 8, 0.12)',
    overdueBadgeBg: 'rgba(239, 68, 68, 0.12)',

    // Glass morphism
    glass: {
      surface: 'rgba(255, 255, 255, 0.72)',
      surfaceStrong: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(255, 255, 255, 0.55)',
      innerBorder: 'rgba(0, 0, 0, 0.06)',
      blurTint: 'light' as const,
      blurIntensity: 60,
      shadow: 'rgba(0, 0, 0, 0.10)',
      shadowOpacity: 0.10,
    },
  },
  dark: {
    bg: '#0A0A0F',
    bgSecondary: '#111118',
    surface: '#16161F',

    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    textSubtle: '#6B7280',

    brand: '#F9FAFB',
    brandMuted: '#252535',

    border: '#252535',
    borderStrong: '#2E2E40',

    tabBar: '#16161F',
    tabBarBorder: '#252535',

    inputBg: '#1C1C27',
    inputBorder: '#252535',

    safeBadgeBg: 'rgba(34, 197, 94, 0.15)',
    soonBadgeBg: 'rgba(234, 179, 8, 0.15)',
    overdueBadgeBg: 'rgba(239, 68, 68, 0.15)',

    // Glass morphism
    glass: {
      surface: 'rgba(28, 28, 40, 0.75)',
      surfaceStrong: 'rgba(28, 28, 40, 0.92)',
      border: 'rgba(255, 255, 255, 0.12)',
      innerBorder: 'rgba(255, 255, 255, 0.06)',
      blurTint: 'dark' as const,
      blurIntensity: 70,
      shadow: 'rgba(0, 0, 0, 0.40)',
      shadowOpacity: 0.40,
    },
  },
} as const;

// Convenience hook for accessing current theme
export function useAppTheme() {
  const colorScheme = useColorScheme();
  return theme[colorScheme ?? 'light'];
}

// Shadow utility for cards
export function cardShadowStyle(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 6,
    elevation: 2,
  };
}

// Shadow utility for glass cards
export function glassShadowStyle(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.1,
    shadowRadius: 24,
    elevation: 8,
  };
}

/**
 * Template compatibility: `useThemeColor` expects `Colors.light`/`Colors.dark` with
 * `text`, `background`, and `tint` keys.
 */
export const Colors = {
  light: {
    text: theme.light.text,
    background: theme.light.bg,
    tint: theme.light.brand,
    icon: theme.light.textMuted,
    tabIconDefault: theme.light.textMuted,
    tabIconSelected: theme.light.brand,
    tabBar: theme.light.tabBar,
    tabBarBorder: theme.light.tabBarBorder,
  },
  dark: {
    text: theme.dark.text,
    background: theme.dark.bg,
    tint: theme.dark.brand,
    icon: theme.dark.textMuted,
    tabIconDefault: theme.dark.textMuted,
    tabIconSelected: theme.dark.brand,
    tabBar: theme.dark.tabBar,
    tabBarBorder: theme.dark.tabBarBorder,
  },
};

// Keep original `Fonts` export so existing template screens don't break.
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'system-ui',
    rounded: 'system-ui',
    mono: Typography.mono,
  },
  default: {
    sans: 'system-ui',
    serif: 'system-ui',
    rounded: 'system-ui',
    mono: Typography.mono,
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    rounded: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
