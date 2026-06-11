export const Colors = {
  primary: '#1B2A4A',
  primaryLight: '#2A3F6E',
  primaryDark: '#111D33',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FA',
  accent: '#C9A84C',
  accentLight: '#E8D9A0',
  text: '#1B2A4A',
  textSecondary: '#6B7A99',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1B2A4A',
  border: '#DDE2EB',
  borderFocus: '#1B2A4A',
  success: '#2E7D5B',
  error: '#C0392B',
  shadow: 'rgba(27, 42, 74, 0.08)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  header: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  input: {
    fontSize: 28,
    fontWeight: '300' as const,
    letterSpacing: -0.5,
  },
  result: {
    fontSize: 20,
    fontWeight: '500' as const,
  },
  resultUnit: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  chip: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  learning: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  formula: {
    fontSize: 16,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
};

export const Shadow = {
  card: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chipActive: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
};
