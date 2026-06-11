import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { radiusToPower, powerToRadius, formatNumber } from '../utils/conversions';

type Mode = 'radiusToPower' | 'powerToRadius';

const INDEX_PRESETS = [
  { value: 1.3375, label: 'Keratometric (1.3375)' },
  { value: 1.336, label: 'Tear / aqueous (1.336)' },
  { value: 1.376, label: 'Cornea (1.376)' },
];

export default function CurvatureView() {
  const [mode, setMode] = useState<Mode>('radiusToPower');
  const [value, setValue] = useState('');
  const [index, setIndex] = useState('1.3375');

  const result = useMemo(() => {
    const v = parseFloat(value);
    const n = parseFloat(index);
    if (isNaN(v) || v === 0 || isNaN(n) || n <= 1) return null;
    if (mode === 'radiusToPower') {
      return { out: radiusToPower(v, n), unit: 'D', label: 'Surface Power' };
    }
    return { out: powerToRadius(v, n), unit: 'mm', label: 'Radius of Curvature' };
  }, [mode, value, index]);

  const inUnit = mode === 'radiusToPower' ? 'mm' : 'D';
  const inLabel = mode === 'radiusToPower' ? 'RADIUS OF CURVATURE' : 'SURFACE POWER';

  return (
    <View style={styles.container}>
      {/* Direction toggle */}
      <View style={styles.segment}>
        {([
          { key: 'radiusToPower' as Mode, label: 'Radius → Power' },
          { key: 'powerToRadius' as Mode, label: 'Power → Radius' },
        ]).map((o) => {
          const active = o.key === mode;
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setMode(o.key);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Value */}
      <Text style={styles.label}>{inLabel} ({inUnit})</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={mode === 'radiusToPower' ? '7.80' : '43.25'}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
        />
        <Text style={styles.suffix}>{inUnit}</Text>
      </View>

      {/* Index */}
      <Text style={styles.label}>REFRACTIVE INDEX (n)</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={index}
          onChangeText={setIndex}
          keyboardType="decimal-pad"
          placeholder="1.3375"
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
        />
      </View>
      <View style={styles.chipRow}>
        {INDEX_PRESETS.map((p) => {
          const active = Math.abs(parseFloat(index) - p.value) < 0.0005;
          return (
            <TouchableOpacity
              key={p.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setIndex(String(p.value));
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {result ? (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{result.label.toUpperCase()}</Text>
          <Text style={styles.heroValue}>
            {formatNumber(result.out, mode === 'radiusToPower' ? 2 : 2)} {result.unit}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter a value to convert</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Surface power F = (n − 1) ÷ r, with r in meters. Using the keratometric index n = 1.3375,
        F (D) = 337.5 ÷ r (mm) — the basis for K-readings and base-curve selection.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    ...Typography.chip,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textOnPrimary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  input: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  suffix: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  heroLabel: {
    ...Typography.caption,
    color: Colors.accentLight,
    marginBottom: Spacing.xs,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footer: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
});
