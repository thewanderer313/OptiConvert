import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { compoundPrism, resolvePrism, formatNumber } from '../utils/conversions';
import PrismFrameDiagram from '../diagrams/PrismFrameDiagram';

type Mode = 'combine' | 'resolve';
type HBase = 'BI' | 'BO';
type VBase = 'BU' | 'BD';

const BASE_NAMES: Record<string, string> = {
  BI: 'Base In',
  BO: 'Base Out',
  BU: 'Base Up',
  BD: 'Base Down',
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(o.key);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PrismToolsView() {
  const { width: screenWidth } = useWindowDimensions();
  const diagramWidth = screenWidth - Spacing.md * 2;
  const [mode, setMode] = useState<Mode>('combine');

  // Combine inputs
  const [hMag, setHMag] = useState('');
  const [hBase, setHBase] = useState<HBase>('BO');
  const [vMag, setVMag] = useState('');
  const [vBase, setVBase] = useState<VBase>('BU');

  // Resolve inputs
  const [resMag, setResMag] = useState('');
  const [angle, setAngle] = useState('');
  const [rHBase, setRHBase] = useState<HBase>('BO');
  const [rVBase, setRVBase] = useState<VBase>('BU');

  const combineResult = useMemo(() => {
    const h = parseFloat(hMag);
    const v = parseFloat(vMag);
    const hh = isNaN(h) ? 0 : Math.abs(h);
    const vv = isNaN(v) ? 0 : Math.abs(v);
    if (hh === 0 && vv === 0) return null;
    const { resultant, angle } = compoundPrism(hh, vv);
    const baseParts: string[] = [];
    if (vv > 0) baseParts.push(vBase);
    if (hh > 0) baseParts.push(hBase);
    return { resultant, angle, base: baseParts.join(' & '), hh, vv };
  }, [hMag, vMag, hBase, vBase]);

  const resolveResult = useMemo(() => {
    const r = parseFloat(resMag);
    const a = parseFloat(angle);
    if (isNaN(r) || r <= 0 || isNaN(a)) return null;
    const { horizontal, vertical } = resolvePrism(r, a);
    return { horizontal: Math.abs(horizontal), vertical: Math.abs(vertical) };
  }, [resMag, angle]);

  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <Segmented
        options={[
          { key: 'combine' as Mode, label: 'Compound' },
          { key: 'resolve' as Mode, label: 'Resolve' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'combine' ? (
        <>
          <Text style={styles.sectionHint}>Combine horizontal + vertical prism into one resultant</Text>

          <View style={styles.field}>
            <Text style={styles.label}>HORIZONTAL PRISM (Δ)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={hMag}
                onChangeText={setHMag}
                keyboardType="decimal-pad"
                placeholder="3"
                placeholderTextColor={Colors.border}
                selectionColor={Colors.accent}
              />
            </View>
            <Segmented
              options={[
                { key: 'BI' as HBase, label: 'Base In' },
                { key: 'BO' as HBase, label: 'Base Out' },
              ]}
              value={hBase}
              onChange={setHBase}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>VERTICAL PRISM (Δ)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={vMag}
                onChangeText={setVMag}
                keyboardType="decimal-pad"
                placeholder="2"
                placeholderTextColor={Colors.border}
                selectionColor={Colors.accent}
              />
            </View>
            <Segmented
              options={[
                { key: 'BU' as VBase, label: 'Base Up' },
                { key: 'BD' as VBase, label: 'Base Down' },
              ]}
              value={vBase}
              onChange={setVBase}
            />
          </View>

          {combineResult ? (
            <>
              <View style={styles.diagramCard}>
                <PrismFrameDiagram
                  width={diagramWidth}
                  hMag={combineResult.hh}
                  hBase={hBase}
                  vMag={combineResult.vv}
                  vBase={vBase}
                  resultant={combineResult.resultant}
                  baseLabel={combineResult.base}
                />
              </View>
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>RESULTANT PRISM</Text>
                <Text style={styles.resultValue}>
                  {formatNumber(combineResult.resultant, 2)}Δ
                </Text>
                <Text style={styles.resultBase}>{combineResult.base}</Text>
                <Text style={styles.resultAngle}>
                  {formatNumber(combineResult.angle, 1)}° from horizontal
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Enter a prism magnitude to combine</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionHint}>Split a resultant prism into horizontal + vertical components</Text>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>RESULTANT (Δ)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={resMag}
                  onChangeText={setResMag}
                  keyboardType="decimal-pad"
                  placeholder="3.6"
                  placeholderTextColor={Colors.border}
                  selectionColor={Colors.accent}
                />
              </View>
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>ANGLE (° from horiz)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={angle}
                  onChangeText={setAngle}
                  keyboardType="decimal-pad"
                  placeholder="34"
                  placeholderTextColor={Colors.border}
                  selectionColor={Colors.accent}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>HORIZONTAL DIRECTION</Text>
          <Segmented
            options={[
              { key: 'BI' as HBase, label: 'Base In' },
              { key: 'BO' as HBase, label: 'Base Out' },
            ]}
            value={rHBase}
            onChange={setRHBase}
          />
          <Text style={styles.label}>VERTICAL DIRECTION</Text>
          <Segmented
            options={[
              { key: 'BU' as VBase, label: 'Base Up' },
              { key: 'BD' as VBase, label: 'Base Down' },
            ]}
            value={rVBase}
            onChange={setRVBase}
          />

          {resolveResult ? (
            <>
              <View style={styles.diagramCard}>
                <PrismFrameDiagram
                  width={diagramWidth}
                  hMag={resolveResult.horizontal}
                  hBase={rHBase}
                  vMag={resolveResult.vertical}
                  vBase={rVBase}
                  resultant={parseFloat(resMag)}
                  baseLabel={[
                    resolveResult.vertical > 0.005 ? rVBase : null,
                    resolveResult.horizontal > 0.005 ? rHBase : null,
                  ]
                    .filter(Boolean)
                    .join(' & ')}
                />
              </View>
              <View style={styles.componentsCard}>
                <View style={styles.componentRow}>
                  <Text style={styles.componentLabel}>Horizontal</Text>
                  <Text style={styles.componentValue}>
                    {formatNumber(resolveResult.horizontal, 2)}Δ {rHBase}
                  </Text>
                </View>
                <View style={[styles.componentRow, styles.componentRowBorder]}>
                  <Text style={styles.componentLabel}>Vertical</Text>
                  <Text style={styles.componentValue}>
                    {formatNumber(resolveResult.vertical, 2)}Δ {rVBase}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Enter resultant magnitude and angle</Text>
            </View>
          )}
        </>
      )}

      <Text style={styles.footer}>
        {mode === 'combine'
          ? 'Resultant = √(H² + V²), angle = arctan(V ÷ H). Base direction combines the two components.'
          : 'H = R × cos(θ), V = R × sin(θ), with θ measured from the horizontal meridian.'}
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
  sectionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
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
  diagramCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  resultCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  resultLabel: {
    ...Typography.caption,
    color: Colors.accentLight,
    marginBottom: Spacing.xs,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  resultBase: {
    ...Typography.bodyBold,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  resultAngle: {
    ...Typography.label,
    color: Colors.accentLight,
    marginTop: 2,
  },
  componentsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  componentRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  componentLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  componentValue: {
    ...Typography.result,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xs,
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
    marginTop: Spacing.xs,
  },
});
