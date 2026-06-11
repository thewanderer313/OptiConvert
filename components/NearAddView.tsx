import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import {
  accommodativeDemand,
  hofstetterAmplitude,
  tentativeAdd,
  balanceAdd,
  roundToStep,
  formatNumber,
} from '../utils/conversions';
import FieldGroup, { FieldConfig } from './FieldGroup';
import { useSharedValues } from '../contexts/SharedValuesContext';

const FIELDS: FieldConfig[] = [
  { key: 'workingDistance', label: 'WORKING DIST (cm)', placeholder: '40', suffix: 'cm', picker: { min: 20, max: 100, step: 5, precision: 0 } },
  { key: 'age', label: 'AGE (yrs)', placeholder: '45', suffix: 'yr', picker: { min: 5, max: 90, step: 1, precision: 0 } },
  { key: 'tentativeAdd', label: 'TENTATIVE ADD (D)', placeholder: '+2.00', suffix: 'D', picker: { min: 0, max: 4, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
  { key: 'nra', label: 'NRA (+D)', placeholder: '+2.00', suffix: 'D', picker: { min: 0, max: 3, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
  { key: 'pra', label: 'PRA (−D)', placeholder: '-2.00', suffix: 'D', picker: { min: -4, max: 0, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
];

interface ResultRow {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export default function NearAddView() {
  const { values: shared, setValue: setShared } = useSharedValues();
  const initialWd = shared.workingDistance != null ? String(shared.workingDistance) : '40';
  const [values, setValues] = useState<Record<string, string>>({ workingDistance: initialWd });

  // Keep workingDistance in shared store as the user edits it.
  useEffect(() => {
    const wd = parseFloat(values.workingDistance);
    if (!isNaN(wd)) setShared('workingDistance', wd);
  }, [values.workingDistance, setShared]);

  const onChange = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const { rows, warning } = useMemo(() => {
    const wd = parseFloat(values.workingDistance);
    const age = parseFloat(values.age);
    const enteredTent = parseFloat(values.tentativeAdd);
    const nra = parseFloat(values.nra);
    const pra = parseFloat(values.pra);

    const demand = !isNaN(wd) && wd > 0 ? accommodativeDemand(wd) : null;
    const amp = !isNaN(age) ? hofstetterAmplitude(age) : null;
    const suggested =
      demand != null && amp ? roundToStep(tentativeAdd(demand, amp.min), 0.25) : null;
    const tentUsed = !isNaN(enteredTent) ? enteredTent : suggested;
    const mid = !isNaN(nra) && !isNaN(pra) ? (nra + pra) / 2 : null;
    const balanced =
      tentUsed != null && mid != null ? roundToStep(balanceAdd(tentUsed, nra, pra), 0.25) : null;

    const rows: ResultRow[] = [];
    if (demand != null) {
      rows.push({
        label: 'Accommodative demand',
        value: `${formatNumber(demand, 2)} D`,
        hint: `1 ÷ ${formatNumber(wd / 100, 2)} m`,
      });
    }
    if (amp) {
      rows.push({
        label: 'Amplitude (Hofstetter min)',
        value: `${formatNumber(amp.min, 2)} D`,
        hint: `avg ${formatNumber(amp.avg, 1)} · ½ reserve ${formatNumber(amp.min / 2, 2)} D`,
      });
    }
    if (suggested != null) {
      rows.push({
        label: 'Suggested tentative add',
        value: `+${formatNumber(suggested, 2)} D`,
        hint: 'demand − ½ min amplitude',
      });
    }
    if (mid != null && tentUsed != null) {
      rows.push({
        label: 'NRA/PRA balance',
        value: `${mid >= 0 ? '+' : ''}${formatNumber(mid, 2)} D`,
        hint: '(NRA + PRA) ÷ 2',
      });
      rows.push({
        label: 'Balanced add',
        value: `+${formatNumber(balanced ?? 0, 2)} D`,
        hint: `tentative ${formatNumber(tentUsed, 2)} + balance`,
        emphasis: true,
      });
    }

    let warning: string | null = null;
    if (!isNaN(nra) && tentUsed != null && nra > tentUsed + 0.001) {
      warning = 'NRA exceeds the add — the tentative add may be too high (over-plussed).';
    }

    return { rows, warning };
  }, [values]);

  return (
    <View style={styles.container}>
      <FieldGroup fields={FIELDS} values={values} onChange={onChange} columns={2} />

      {rows.length > 0 ? (
        <View style={styles.card}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder, r.emphasis && styles.rowEmphasis]}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, r.emphasis && styles.rowLabelEmphasis]}>{r.label}</Text>
                {r.hint && <Text style={[styles.rowHint, r.emphasis && styles.rowHintEmphasis]}>{r.hint}</Text>}
              </View>
              <Text style={[styles.rowValue, r.emphasis && styles.rowValueEmphasis]}>{r.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter a working distance to begin</Text>
        </View>
      )}

      {warning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠ {warning}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Enter age for an amplitude-based tentative add, or type your own. Add NRA (max plus) and PRA
        (max minus) to refine: Final Add = Tentative + (NRA + PRA) ÷ 2. A well-balanced add has
        NRA + PRA near zero.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.sm, gap: Spacing.sm },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowEmphasis: { backgroundColor: Colors.primary },
  rowLeft: { flex: 1 },
  rowLabel: { ...Typography.label, color: Colors.text },
  rowLabelEmphasis: { color: Colors.textOnPrimary },
  rowHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  rowHintEmphasis: { color: Colors.accentLight },
  rowValue: { ...Typography.result, color: Colors.text, fontVariant: ['tabular-nums'] },
  rowValueEmphasis: { color: Colors.textOnPrimary, fontWeight: '700' },
  emptyCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  warningBox: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
  },
  warningText: { fontSize: 12, color: Colors.error, fontWeight: '500' },
  footer: {
    marginHorizontal: Spacing.md,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
