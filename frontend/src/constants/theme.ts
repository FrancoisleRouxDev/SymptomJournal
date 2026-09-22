import '@/global.css';
import { Platform } from 'react-native';

// ── SymptomJournal Brand Colours ──────────────────────────────
export const Colors = {
  light: {
    text: '#3E2D1E',
    textSecondary: '#6A5A4E',
    background: '#F6F0E8',
    backgroundElement: '#FDFAF5',
    backgroundSelected: '#D4E7DC',
    tint: '#7B9E87',
    icon: '#6A5A4E',
    tabIconDefault: '#9A9088',
    tabIconSelected: '#7B9E87',
    border: '#C8BFB5',
  },
  dark: {
    text: '#F6F0E8',
    textSecondary: '#C8BFB5',
    background: '#1C1917',
    backgroundElement: '#292524',
    backgroundSelected: '#3E2D1E',
    tint: '#7B9E87',
    icon: '#C8BFB5',
    tabIconDefault: '#6A5A4E',
    tabIconSelected: '#A8C4B0',
    border: '#44403C',
  },
  // Primary — Sage
  sage: {
    dark: '#5A7D66',
    base: '#7B9E87',
    light: '#A8C4B0',
    tint: '#D4E7DC',
  },
  // Accent — Terracotta
  terracotta: {
    dark: '#A85A38',
    base: '#C4714F',
    light: '#E8A080',
    tint: '#F5D8CC',
  },
  // Neutrals
  neutral: {
    brown: '#3E2D1E',
    brownMid: '#6A5A4E',
    muted: '#9A9088',
    border: '#C8BFB5',
  },
  // Backgrounds
  background: {
    canvas: '#F6F0E8',
    card: '#FDFAF5',
    cream: '#EDE5D8',
    dark: '#D8CFC4',
  },
  // Semantic — symptom categories
  semantic: {
    pain: '#C4714F',
    fatigue: '#A8C4B0',
    mood: '#B8A0D0',
    digestion: '#E8B87A',
    breathing: '#7AAED0',
    skin: '#E8A0A0',
  },
  // Utility
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeColor = keyof typeof Colors.light;

// ── Typography ────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    display: 'DMSerifDisplay-Regular',
    sans: 'Nunito-Medium',
    sansBold: 'Nunito-Bold',
    mono: 'ui-monospace',
  },
  android: {
    display: 'DMSerifDisplay-Regular',
    sans: 'Nunito-Medium',
    sansBold: 'Nunito-Bold',
    mono: 'monospace',
  },
  default: {
    display: 'DMSerifDisplay-Regular',
    sans: 'Nunito-Medium',
    sansBold: 'Nunito-Bold',
    mono: 'monospace',
  },
});

// ── Font sizes ────────────────────────────────────────────────
export const FontSize = {
  display: 32,
  h1: 26,
  h2: 22,
  label: 11,
  bodyBold: 14,
  body: 14,
  caption: 12,
  micro: 10,
  button: 16,
} as const;

// ── Spacing ───────────────────────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
} as const;

// ── Border radius ─────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// ── Misc ──────────────────────────────────────────────────────
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;