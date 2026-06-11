import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import {
  powerAtMeridian,
  decentrationForPrism,
  ocHorizontalMove,
  ocVerticalMove,
  formatNumber,
} from '../utils/conversions';
import DecentrationFrameDiagram, { EyeShift } from '../diagrams/DecentrationFrameDiagram';

type HBase = 'BI' | 'BO';
type VBase = 'BU' | 'BD';
type EyeKey = 'OD' | 'OS';
type InputMode = 'components' | 'resultant';

const MAX_PRACTICAL_MM = 25;

const DIR_WORD: Record<string, string> = {
  IN: 'in (nasal)',
  OUT: 'out (temporal)',
  UP: 'up',
  DOWN: 'down',
};

interface EyeInput {
  sphere: string;
  cylinder: string;
  axis: string;
  hMag: string;
  hBase: HBase;
  vMag: string;
  vBase: VBase;
  resMag: string;
  resAngle: string;
}

interface EyeResult {
  hPower: number;
  vPower: number;
  hDec: number;
  vDec: number;
  hDir: 'IN' | 'OUT' | '';
  vDir: 'UP' | 'DOWN' | '';
  hWant: boolean;
  vWant: boolean;
  hFeasible: boolean;
  vFeasible: boolean;
}

const defaultEye = (): EyeInput => ({
  sphere: '-4.00',
  cylinder: '0.00',
  axis: '180',
  hMag: '',
  hBase: 'BO',
  vMag: '',
  vBase: 'BU',
  resMag: '',
  resAngle: '',
});

// Resolve the desired prism into horizontal/vertical components with base
// senses for a given eye. In resultant mode the angle is geometric
// (0° = right, 90° = up, counterclockwise — as a lensometer reads it); the
// base-x sign maps to In/Out differently per eye because "in" is toward the nose.
function resolveDesired(
  v: EyeInput,
  mode: InputMode,
  eye: EyeKey
): { hMag: number; hBase: HBase; vMag: number; vBase: VBase } {
  if (mode === 'components') {
    return { hMag: parseFloat(v.hMag), hBase: v.hBase, vMag: parseFloat(v.vMag), vBase: v.vBase };
  }
  const R = parseFloat(v.resMag);
  const ang = parseFloat(v.resAngle);
  if (isNaN(R) || isNaN(ang)) return { hMag: NaN, hBase: v.hBase, vMag: NaN, vBase: v.vBase };
  const th = (ang * Math.PI) / 180;
  const bx = R * Math.cos(th); // + = toward examiner's right
  const by = R * Math.sin(th); // + = up
  const hBase: HBase = bx >= 0 ? (eye === 'OD' ? 'BI' : 'BO') : eye === 'OD' ? 'BO' : 'BI';
  const vBase: VBase = by >= 0 ? 'BU' : 'BD';
  return { hMag: Math.abs(bx), hBase, vMag: Math.abs(by), vBase };
}

function computeEye(v: EyeInput, mode: InputMode, eye: EyeKey): EyeResult | null {
  const sph = parseFloat(v.sphere);
  const cyl = parseFloat(v.cylinder) || 0;
  const ax = parseFloat(v.axis);
  if (isNaN(sph) || isNaN(ax)) return null;

  const d = resolveDesired(v, mode, eye);
  const hWant = !isNaN(d.hMag) && d.hMag > 0.005;
  const vWant = !isNaN(d.vMag) && d.vMag > 0.005;
  if (!hWant && !vWant) return null;

  const hPower = powerAtMeridian(sph, cyl, ax, 180);
  const vPower = powerAtMeridian(sph, cyl, ax, 90);
  const hDec = hWant ? decentrationForPrism(d.hMag, hPower) : 0;
  const vDec = vWant ? decentrationForPrism(d.vMag, vPower) : 0;
  const hDir: 'IN' | 'OUT' | '' = hWant ? ocHorizontalMove(d.hBase, hPower) : '';
  const vDir: 'UP' | 'DOWN' | '' = vWant ? ocVerticalMove(d.vBase, vPower) : '';

  return {
    hPower,
    vPower,
    hDec,
    vDec,
    hDir,
    vDir,
    hWant,
    vWant,
    hFeasible: hWant ? isFinite(hDec) : true,
    vFeasible: vWant ? isFinite(vDec) : true,
  };
}

function eyeShift(r: EyeResult | null): EyeShift {
  if (!r) return { hMm: 0, hDir: '', vMm: 0, vDir: '', active: false };
  return {
    hMm: r.hWant && r.hFeasible ? r.hDec : 0,
    hDir: r.hWant && r.hFeasible ? r.hDir : '',
    vMm: r.vWant && r.vFeasible ? r.vDec : 0,
    vDir: r.vWant && r.vFeasible ? r.vDir : '',
    active: true,
  };
}

function sentenceFor(r: EyeResult | null): string {
  if (!r) return '';
  const parts: string[] = [];
  if (r.hWant && r.hFeasible) parts.push(`${formatNumber(r.hDec, 1)} mm ${DIR_WORD[r.hDir]}`);
  if (r.vWant && r.vFeasible) parts.push(`${formatNumber(r.vDec, 1)} mm ${DIR_WORD[r.vDir]}`);
  return parts.join(' and ');
}

export default function DecenterForPrismView() {
  const { width: screenWidth } = useWindowDimensions();
  const diagramWidth = screenWidth - Spacing.md * 2;

  const [eye, setEye] = useState<EyeKey>('OD');
  const [mode, setMode] = useState<InputMode>('components');
  const [inputs, setInputs] = useState<Record<EyeKey, EyeInput>>({
    OD: defaultEye(),
    OS: defaultEye(),
  });

  const cur = inputs[eye];
  const setField = (key: keyof EyeInput, value: string) =>
    setInputs((prev) => ({ ...prev, [eye]: { ...prev[eye], [key]: value } }));

  const odResult = useMemo(() => computeEye(inputs.OD, mode, 'OD'), [inputs.OD, mode]);
  const osResult = useMemo(() => computeEye(inputs.OS, mode, 'OS'), [inputs.OS, mode]);

  // Resolved components for the current eye (to confirm a resultant entry).
  const resolvedCur = mode === 'resultant' ? resolveDesired(cur, mode, eye) : null;

  const anyResult = odResult !== null || osResult !== null;

  const warning = useMemo(() => {
    const rs = [odResult, osResult].filter(Boolean) as EyeResult[];
    if (rs.some((r) => (r.hWant && !r.hFeasible) || (r.vWant && !r.vFeasible)))
      return 'A meridian has essentially zero power — prism cannot be created there by decentration.';
    if (
      rs.some(
        (r) =>
          (r.hWant && r.hFeasible && r.hDec > MAX_PRACTICAL_MM) ||
          (r.vWant && r.vFeasible && r.vDec > MAX_PRACTICAL_MM)
      )
    )
      return 'Required decentration is very large — consider grinding in the prism instead.';
    return null;
  }, [odResult, osResult]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHint}>
        Enter each eye's Rx and the prism you need — see how far and which way to decenter both lenses
      </Text>

      {/* Eye selector */}
      <Segmented
        options={[
          { key: 'OD' as EyeKey, label: 'OD (Right)' },
          { key: 'OS' as EyeKey, label: 'OS (Left)' },
        ]}
        value={eye}
        onChange={setEye}
      />

      {/* Input mode */}
      <Segmented
        options={[
          { key: 'components' as InputMode, label: 'H / V Components' },
          { key: 'resultant' as InputMode, label: 'Resultant + °' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {/* Prescription */}
      <Text style={styles.groupLabel}>{eye} PRESCRIPTION</Text>
      <View style={styles.row}>
        <Field label="SPHERE" value={cur.sphere} onChange={(v) => setField('sphere', v)} placeholder="-4.00" />
        <Field label="CYL" value={cur.cylinder} onChange={(v) => setField('cylinder', v)} placeholder="0.00" />
        <Field label="AXIS" value={cur.axis} onChange={(v) => setField('axis', v)} placeholder="180" numeric />
      </View>

      {/* Desired prism */}
      <Text style={styles.groupLabel}>{eye} DESIRED PRISM</Text>
      {mode === 'components' ? (
        <View style={styles.prismRow}>
          <View style={styles.prismField}>
            <Text style={styles.label}>HORIZONTAL (Δ)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={cur.hMag}
                onChangeText={(v) => setField('hMag', v)}
                keyboardType="decimal-pad"
                placeholder="2"
                placeholderTextColor={Colors.border}
                selectionColor={Colors.accent}
              />
            </View>
            <Segmented
              options={[
                { key: 'BI' as HBase, label: 'Base In' },
                { key: 'BO' as HBase, label: 'Base Out' },
              ]}
              value={cur.hBase}
              onChange={(v) => setField('hBase', v)}
            />
          </View>
          <View style={styles.prismField}>
            <Text style={styles.label}>VERTICAL (Δ)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={cur.vMag}
                onChangeText={(v) => setField('vMag', v)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.border}
                selectionColor={Colors.accent}
              />
            </View>
            <Segmented
              options={[
                { key: 'BU' as VBase, label: 'Base Up' },
                { key: 'BD' as VBase, label: 'Base Down' },
              ]}
              value={cur.vBase}
              onChange={(v) => setField('vBase', v)}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <Field
              label="PRISM (Δ)"
              value={cur.resMag}
              onChange={(v) => setField('resMag', v)}
              placeholder="3.6"
            />
            <Field
              label="DIRECTION (°)"
              value={cur.resAngle}
              onChange={(v) => setField('resAngle', v)}
              placeholder="34"
              numeric
            />
          </View>
          <Text style={styles.conventionNote}>
            0° = right · 90° = up · 180° = left · 270° = down, counterclockwise (lensometer reading)
          </Text>
          {resolvedCur && !isNaN(resolvedCur.hMag) && !isNaN(resolvedCur.vMag) && (
            <Text style={styles.resolvedNote}>
              {eye} ≡{' '}
              {[
                resolvedCur.hMag > 0.005
                  ? `${formatNumber(resolvedCur.hMag, 2)}Δ ${resolvedCur.hBase}`
                  : null,
                resolvedCur.vMag > 0.005
                  ? `${formatNumber(resolvedCur.vMag, 2)}Δ ${resolvedCur.vBase}`
                  : null,
              ]
                .filter(Boolean)
                .join(' + ') || 'no prism'}
            </Text>
          )}
        </>
      )}

      {anyResult ? (
        <>
          <View style={styles.diagramCard}>
            <DecentrationFrameDiagram
              width={diagramWidth}
              od={eyeShift(odResult)}
              os={eyeShift(osResult)}
            />
          </View>

          <View style={styles.card}>
            <EyeResultBlock eyeName="OD (Right)" result={odResult} />
            <EyeResultBlock eyeName="OS (Left)" result={osResult} border />
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter an Rx and a desired prism for either eye</Text>
        </View>
      )}

      {warning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠ {warning}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        c (mm) = 10 × prism (Δ) ÷ power in that meridian. Plus lenses are decentered toward the base;
        minus lenses away from the base. "In" is toward the nose, mirrored between the two eyes.
      </Text>
    </View>
  );
}

function EyeResultBlock({
  eyeName,
  result,
  border,
}: {
  eyeName: string;
  result: EyeResult | null;
  border?: boolean;
}) {
  const sentence = sentenceFor(result);
  return (
    <View style={[styles.eyeBlock, border && styles.eyeBlockBorder]}>
      <View style={styles.eyeHeaderRow}>
        <Text style={styles.eyeName}>{eyeName}</Text>
        <Text style={styles.eyeSentence}>
          {result ? (sentence !== '' ? sentence : 'not possible') : 'no prism'}
        </Text>
      </View>
      {result && (
        <View style={styles.eyeDetail}>
          {result.hWant && (
            <Text style={styles.eyeDetailText}>
              H: {formatNumber(result.hPower, 2)} D @180° →{' '}
              {result.hFeasible ? `${formatNumber(result.hDec, 1)} mm ${result.hDir}` : 'n/a'}
            </Text>
          )}
          {result.vWant && (
            <Text style={styles.eyeDetailText}>
              V: {formatNumber(result.vPower, 2)} D @90° →{' '}
              {result.vFeasible ? `${formatNumber(result.vDec, 1)} mm ${result.vDir}` : 'n/a'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType={numeric ? 'number-pad' : 'decimal-pad'}
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
        />
      </View>
    </View>
  );
}

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
  groupLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
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
  prismRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prismField: {
    flex: 1,
    gap: Spacing.xs,
  },
  conventionNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resolvedNote: {
    ...Typography.label,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: '700',
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
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textOnPrimary,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  eyeBlock: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  eyeBlockBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  eyeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  eyeName: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  eyeSentence: {
    ...Typography.label,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  eyeDetail: {
    gap: 2,
  },
  eyeDetailText: {
    fontSize: 11,
    color: Colors.textSecondary,
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
  warningBox: {
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  footer: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
});
