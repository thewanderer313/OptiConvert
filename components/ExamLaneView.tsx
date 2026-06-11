import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { optotypeSize, formatNumber } from '../utils/conversions';

type DistUnit = 'ft' | 'm';

export default function ExamLaneView() {
  const [distance, setDistance] = useState('20');
  const [unit, setUnit] = useState<DistUnit>('ft');
  const [num, setNum] = useState('20');
  const [den, setDen] = useState('20');

  const result = useMemo(() => {
    const d = parseFloat(distance);
    const n = parseFloat(num);
    const de = parseFloat(den);
    if (isNaN(d) || d <= 0 || isNaN(n) || n <= 0 || isNaN(de) || de <= 0) return null;
    const distanceMm = d * (unit === 'ft' ? 304.8 : 1000);
    return optotypeSize(distanceMm, n, de);
  }, [distance, unit, num, den]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHint}>How large a letter must be at the chart distance to test a target acuity</Text>

      {/* Distance */}
      <Text style={styles.label}>TEST DISTANCE</Text>
      <View style={styles.row}>
        <View style={[styles.inputBox, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholder="20"
            placeholderTextColor={Colors.border}
            selectionColor={Colors.accent}
          />
        </View>
        <View style={styles.segment}>
          {(['ft', 'm'] as DistUnit[]).map((u) => {
            const active = u === unit;
            return (
              <TouchableOpacity
                key={u}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setUnit(u);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{u}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Acuity */}
      <Text style={styles.label}>TARGET ACUITY (Snellen)</Text>
      <View style={styles.acuityRow}>
        <View style={[styles.inputBox, styles.acuityInput]}>
          <TextInput
            style={styles.input}
            value={num}
            onChangeText={setNum}
            keyboardType="number-pad"
            placeholder="20"
            placeholderTextColor={Colors.border}
            selectionColor={Colors.accent}
          />
        </View>
        <Text style={styles.slash}>/</Text>
        <View style={[styles.inputBox, styles.acuityInput]}>
          <TextInput
            style={styles.input}
            value={den}
            onChangeText={setDen}
            keyboardType="number-pad"
            placeholder="20"
            placeholderTextColor={Colors.border}
            selectionColor={Colors.accent}
          />
        </View>
      </View>

      {result ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>LETTER HEIGHT</Text>
            <Text style={styles.heroValue}>{formatNumber(result.letterHeightMm, 2)} mm</Text>
            <Text style={styles.heroSub}>
              {formatNumber(result.letterHeightMm / 25.4, 3)} in · stroke {formatNumber(result.strokeMm, 2)} mm
            </Text>
          </View>

          <View style={styles.card}>
            <Row label="Letter visual angle" value={`${formatNumber(result.letterArcmin, 2)} ′`} hint="5 arcmin at the acuity line" />
            <Row label="In arcseconds" value={`${formatNumber(result.letterArcmin * 60, 0)} ″`} border />
            <Row label="In radians" value={`${formatNumber(result.letterRad, 6)} rad`} border />
            <Row label="MAR (one stroke)" value={`${formatNumber(result.mar, 2)} ′`} hint="minimum angle of resolution" border />
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter distance and a Snellen acuity</Text>
        </View>
      )}

      <Text style={styles.footer}>
        A Snellen letter subtends 5 arcmin (1 arcmin per stroke) on its line, so a 20/{den || 'D'} letter
        subtends 5 × ({den || 'D'} ÷ {num || 'N'}) arcmin. Height = 2 × distance × tan(angle ÷ 2).
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  hint,
  border,
}: {
  label: string;
  value: string;
  hint?: string;
  border?: boolean;
}) {
  return (
    <View style={[styles.resultRow, border && styles.resultRowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultLabel}>{label}</Text>
        {hint && <Text style={styles.resultHint}>{hint}</Text>}
      </View>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  inputBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  input: {
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    minWidth: 44,
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
  acuityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  acuityInput: {
    flex: 1,
  },
  slash: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
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
  heroSub: {
    ...Typography.label,
    color: Colors.accentLight,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  resultRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  resultLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  resultHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  resultValue: {
    ...Typography.result,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
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
