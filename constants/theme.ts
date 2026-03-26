import { Platform } from 'react-native';

import type { ServiceStatus } from '@/types';

// Design-system palette for the VehicleTracker MVP (indonesian motorcycle maintenance).
export const brand = '#6366F1'; // Indigo
export const brandLight = '#EEF2FF';

export const safe = '#22C55E';
export const safeLight = '#DCFCE7';
export const safeDark = '#166534';

export const soon = '#EAB308';
export const soonLight = '#FEF9C3';
export const soonDark = '#713F12';

export const overdue = '#EF4444';
export const overdueLight = '#FEE2E2';
export const overdueDark = '#7F1D1D';

export const text = '#0F172A';
export const muted = '#64748B';
export const border = '#E2E8F0';
export const bg = '#F8F9FC';
export const card = '#FFFFFF';

export const cardGradients: Record<ServiceStatus, [string, string]> = {
  safe: [safeDark, safe],
  soon: [soonDark, soon],
  overdue: [overdueDark, overdue],
};

export const borderRadius = {
  card: 14,
  button: 12,
  input: 10,
  badge: 20,
} as const;

export const Typography = {
  boldWeight: '600',
  // Mono font family differs by platform.
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
    web: 'monospace',
  }),
} as const;

/**
 * Template compatibility: `useThemeColor` expects `Colors.light`/`Colors.dark` with
 * `text`, `background`, and `tint` keys.
 */
export const Colors = {
  light: {
    text,
    background: bg,
    tint: brand,
    icon: muted,
    tabIconDefault: muted,
    tabIconSelected: brand,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    tint: brand,
    icon: muted,
    tabIconDefault: muted,
    tabIconSelected: brandLight,
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
