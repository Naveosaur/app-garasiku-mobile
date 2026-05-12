import { Platform, useColorScheme } from 'react-native';
import { Easing } from 'react-native-reanimated';

import type { ServiceStatus } from '@/types';

/**
 * Tesla-inspired Minimal Monochrome Theme
 * - Pure black & white with subtle grays
 * - Glass morphism for premium feel
 * - Minimal, seamless, animated
 */

// ============================================
// STATUS COLORS (Monochrome with subtle accents)
// ============================================
// Using grayscale with minimal hints of color for status indication
export const safe = '#FFFFFF';        // White - good
export const safeLight = '#F5F5F5';
export const safeDark = '#E5E5E5';

export const soon = '#A1A1AA';        // Medium gray - warning
export const soonLight = '#D4D4D8';
export const soonDark = '#71717A';

export const overdue = '#DC2626';     // Only red for critical (subtle accent)
export const overdueLight = '#FEE2E2';
export const overdueDark = '#991B1B';

// Legacy exports
export const brand = '#FFFFFF';
export const brandLight = '#FAFAFA';
export const text = '#000000';
export const muted = '#737373';
export const border = '#E5E5E5';
export const bg = '#FFFFFF';
export const card = '#FFFFFF';

export const cardGradients: Record<ServiceStatus, [string, string]> = {
  safe: ['#262626', '#000000'],
  soon: ['#404040', '#171717'],
  overdue: ['#991B1B', '#450A0A'],
};

// ============================================
// DESIGN TOKENS
// ============================================
export const borderRadius = {
  card: 24,
  button: 16,
  input: 14,
  badge: 999,
  modal: 32,
  sheet: 32,
  small: 8,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Typography = {
  // Tesla uses Gotham/Inter-like fonts - we use system for native feel
  boldWeight: '600' as const,
  heavyWeight: '800' as const,
  blackWeight: '900' as const,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
    web: 'monospace',
  }),
  // Letter spacing for premium feel
  tight: -1.2,
  normal: -0.4,
  wide: 0.5,
  extraWide: 2,
} as const;

// ============================================
// ANIMATION TOKENS (Cinematic & Smooth)
// ============================================
export const animation = {
  // Expo-out easing — smooth entry, natural stop
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  // Smooth spring for UI interactions
  spring: { damping: 20, stiffness: 180 },
  // Slower spring for modal/sheet
  springSlow: { damping: 25, stiffness: 120 },
  duration: {
    instant: 100,
    fast: 180,
    normal: 320,
    slow: 500,
    blob: 6000,
  },
  staggerDelay: 50,
} as const;

// ============================================
// THEME TOKENS (Tesla Monochrome)
// ============================================
export const theme = {
  light: {
    // Backgrounds - pure whites with subtle warmth
    bg: '#FFFFFF',
    bgSecondary: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Text - pure blacks for strong contrast
    text: '#000000',
    textMuted: '#525252',
    textSubtle: '#A3A3A3',

    // Brand - pure monochrome
    brand: '#000000',
    brandAlt: '#171717',
    brandMuted: '#F5F5F5',
    brandGlow: 'rgba(0, 0, 0, 0.08)',

    // Borders - hairline separators
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    borderSubtle: '#F5F5F5',

    // Tab bar
    tabBar: 'rgba(255, 255, 255, 0.85)',
    tabBarBorder: 'rgba(0, 0, 0, 0.06)',

    // Input
    inputBg: '#FAFAFA',
    inputBorder: '#E5E5E5',
    inputFocus: '#000000',

    // Status badges - minimal monochrome
    safeBadgeBg: 'rgba(0, 0, 0, 0.06)',
    soonBadgeBg: 'rgba(0, 0, 0, 0.08)',
    overdueBadgeBg: 'rgba(220, 38, 38, 0.10)',

    // Glass morphism - pristine white frost
    glass: {
      surface: 'rgba(255, 255, 255, 0.72)',
      surfaceStrong: 'rgba(255, 255, 255, 0.90)',
      border: 'rgba(0, 0, 0, 0.06)',
      innerBorder: 'rgba(255, 255, 255, 0.80)',
      topHighlight: 'rgba(255, 255, 255, 0.90)',
      blurTint: 'light' as const,
      blurIntensity: 60,
      shadow: 'rgba(0, 0, 0, 0.06)',
      shadowOpacity: 0.06,
    },

    // Accent gradient (monochrome)
    gradientPrimary: ['#000000', '#262626'] as [string, string],
    gradientSubtle: ['#FAFAFA', '#FFFFFF'] as [string, string],
  },
  dark: {
    // Backgrounds - Tesla's signature deep black
    bg: '#000000',
    bgSecondary: '#0A0A0A',
    surface: '#0F0F0F',
    surfaceElevated: '#171717',

    // Text - pure white for OLED
    text: '#FFFFFF',
    textMuted: '#A3A3A3',
    textSubtle: '#525252',

    // Brand - inverted monochrome
    brand: '#FFFFFF',
    brandAlt: '#E5E5E5',
    brandMuted: '#1A1A1A',
    brandGlow: 'rgba(255, 255, 255, 0.06)',

    // Borders - subtle white lines
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',

    // Tab bar
    tabBar: 'rgba(0, 0, 0, 0.80)',
    tabBarBorder: 'rgba(255, 255, 255, 0.06)',

    // Input
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    inputFocus: '#FFFFFF',

    // Status badges - minimal with glow
    safeBadgeBg: 'rgba(255, 255, 255, 0.08)',
    soonBadgeBg: 'rgba(255, 255, 255, 0.12)',
    overdueBadgeBg: 'rgba(220, 38, 38, 0.15)',

    // Glass morphism - dark frosted premium
    glass: {
      surface: 'rgba(20, 20, 20, 0.60)',
      surfaceStrong: 'rgba(20, 20, 20, 0.85)',
      border: 'rgba(255, 255, 255, 0.08)',
      innerBorder: 'rgba(255, 255, 255, 0.04)',
      topHighlight: 'rgba(255, 255, 255, 0.10)',
      blurTint: 'dark' as const,
      blurIntensity: 30,
      shadow: 'rgba(0, 0, 0, 0.60)',
      shadowOpacity: 0.60,
    },

    // Accent gradient (monochrome)
    gradientPrimary: ['#FFFFFF', '#E5E5E5'] as [string, string],
    gradientSubtle: ['#0A0A0A', '#000000'] as [string, string],
  },
} as const;

// ============================================
// HOOKS & UTILITIES
// ============================================
export function useAppTheme() {
  const colorScheme = useColorScheme();
  return theme[colorScheme ?? 'dark'];
}

// Minimal shadow - Tesla uses very subtle shadows
export function cardShadowStyle(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.5 : 0.04,
    shadowRadius: 6,
    elevation: 2,
  };
}

// Glass card shadow - deeper for premium feel
export function glassShadowStyle(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.6 : 0.06,
    shadowRadius: 20,
    elevation: 6,
  };
}

// Accent button shadow - for CTA buttons
export function accentGlowStyle(isDark: boolean) {
  return isDark
    ? {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
      }
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      };
}

// Deep shadow for modals and overlays
export function modalShadowStyle(isDark: boolean) {
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.8 : 0.15,
    shadowRadius: 40,
    elevation: 20,
  };
}

// ============================================
// TEMPLATE COMPATIBILITY
// ============================================
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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
    serif: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    rounded: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', sans-serif",
    mono: "'SF Mono', Menlo, Monaco, Consolas, monospace",
  },
});
