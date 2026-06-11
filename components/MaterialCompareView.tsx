import React, { useMemo, useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import {
  REFRACTIVE_INDICES,
  calculateLensThickness,
  estimateLensWeight,
  formatNumber,
} from '../utils/conversions';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

const PICKER_POWER: PickerConfig = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_DIA: PickerConfig = { min: 40, max: 80, step: 1, precision: 0 };
const PICKER_MIN_T: PickerConfig = { min: 0.5, max: 5, step: 0.1, precision: 1 };

type PickerField = 'power' | 'diameter' | 'minThickness' | null;

const PICKER_DEFAULT_FIELDS: Set<NonNullable<PickerField>> = new Set(['power']);

interface MaterialRow {
  value: number;
  name: string;
  abbe: number;
  thickness: number; // the limiting thickness (edge for minus, center for plus)
  weight: number;
  isThinnest: boolean;
  isLightest: boolean;
  isClearest: boolean;
}

export default function MaterialCompareView() {
  const [power, setPower] = useState('-4.00');
  const [diameter, setDiameter] = useState('70');
  const [minThickness, setMinThickness] = useState('1.5');
  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [editingField, setEditingField] = useState<PickerField>(null);
  const inputRefs = useRef<Partial<Record<NonNullable<PickerField>, TextInput | null>>>({});

  const focusInput = (field: NonNullable<PickerField>) => {
    setEditingField(field);
    setTimeout(() => inputRefs.current[field]?.focus(), 0);
  };

  const handleFieldTap = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field) && editingField !== field) {
      setActivePicker(field);
    } else {
      focusInput(field);
    }
  };

  const handleBlur = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field)) setEditingField(null);
  };

  const p = parseFloat(power);
  const d = parseFloat(diameter);
  const mt = parseFloat(minThickness);
  const valid = !isNaN(p) && !isNaN(d) && d > 0 && !isNaN(mt);
  const isPlusLens = !isNaN(p) ? p >= 0 : false;

  const rows = useMemo<MaterialRow[]>(() => {
    if (!valid) return [];
    const computed = REFRACTIVE_INDICES.map((m) => {
      const t = calculateLensThickness({
        power: p,
        diameter: d,
        refractiveIndex: m.value,
        minThickness: mt,
      });
      const thickness = t.isPlusLens ? t.centerThickness : t.edgeThickness;
      const weight = estimateLensWeight(t.centerThickness, t.edgeThickness, d, m.specificGravity);
      return { value: m.value, name: m.name, abbe: m.abbe, thickness, weight };
    });

    const minT = Math.min(...computed.map((r) => r.thickness));
    const minW = Math.min(...computed.map((r) => r.weight));
    const maxAbbe = Math.max(...computed.map((r) => r.abbe));

    return computed.map((r) => ({
      ...r,
      isThinnest: Math.abs(r.thickness - minT) < 0.001,
      isLightest: Math.abs(r.weight - minW) < 0.001,
      isClearest: r.abbe === maxAbbe,
    }));
  }, [valid, p, d, mt]);

  const maxThickness = rows.length ? Math.max(...rows.map((r) => r.thickness)) : 1;
  const maxWeight = rows.length ? Math.max(...rows.map((r) => r.weight)) : 1;

  const getPickerValue = () => {
    switch (activePicker) {
      case 'power': return power;
      case 'diameter': return diameter;
      case 'minThickness': return minThickness;
      default: return '';
    }
  };

  const handlePickerSelect = (value: string) => {
    switch (activePicker) {
      case 'power': setPower(value); break;
      case 'diameter': setDiameter(value); break;
      case 'minThickness': setMinThickness(value); break;
    }
  };

  const getPickerConfig = (): { config: PickerConfig; label: string; suffix?: string } => {
    switch (activePicker) {
      case 'power': return { config: PICKER_POWER, label: 'LENS POWER', suffix: 'D' };
      case 'diameter': return { config: PICKER_DIA, label: 'BLANK DIAMETER', suffix: 'mm' };
      case 'minThickness': return { config: PICKER_MIN_T, label: 'MIN THICKNESS', suffix: 'mm' };
      default: return { config: PICKER_POWER, label: '' };
    }
  };

  // Render helper (NOT a component) — returning JSX from a function avoids
  // creating a new React component identity per render, which would unmount
  // the TextInput on every keystroke and break focus.
  const renderSmartField = (
    field: NonNullable<PickerField>,
    value: string,
    onValueChange: (text: string) => void,
    placeholder: string
  ) => {
    const isPickerDefault = PICKER_DEFAULT_FIELDS.has(field);
    const inputInert = isPickerDefault && editingField !== field;
    return (
      <Pressable style={styles.inputBox} onPress={() => handleFieldTap(field)}>
        <TextInput
          ref={(el) => { inputRefs.current[field] = el; }}
          style={styles.input}
          value={value}
          onChangeText={onValueChange}
          onBlur={() => handleBlur(field)}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
          pointerEvents={inputInert ? 'none' : 'auto'}
        />
        {isPickerDefault ? (
          <TouchableOpacity
            style={styles.iconBtnKbd}
            onPress={() => focusInput(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.iconKbdText}>⌨</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setActivePicker(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View style={styles.pickerIconBar} />
            <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
            <View style={styles.pickerIconBar} />
          </TouchableOpacity>
        )}
      </Pressable>
    );
  };

  const pickerInfo = activePicker ? getPickerConfig() : null;
  const thicknessLabel = isPlusLens ? 'Center' : 'Edge';

  return (
    <View style={styles.container}>
      {/* Inputs */}
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>LENS POWER (D)</Text>
          {renderSmartField('power', power, setPower, '-4.00')}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>DIAMETER (mm)</Text>
          {renderSmartField('diameter', diameter, setDiameter, '70')}
        </View>
      </View>

      <Text style={styles.label}>MIN THICKNESS (mm)</Text>
      {renderSmartField('minThickness', minThickness, setMinThickness, '1.5')}

      {valid ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {isPlusLens ? 'Plus lens — thickest at center' : 'Minus lens — thickest at edge'}
            </Text>
            <Text style={styles.summarySub}>Comparing {thicknessLabel.toLowerCase()} thickness across materials</Text>
          </View>

          <View style={styles.card}>
            {rows.map((r, i) => (
              <View key={r.value} style={[styles.materialRow, i > 0 && styles.materialRowBorder]}>
                <View style={styles.materialHeader}>
                  <Text style={styles.materialName}>{r.name}</Text>
                  <View style={styles.badges}>
                    {r.isThinnest && (
                      <View style={[styles.badge, styles.badgeThin]}>
                        <Text style={styles.badgeText}>THINNEST</Text>
                      </View>
                    )}
                    {r.isLightest && (
                      <View style={[styles.badge, styles.badgeLight]}>
                        <Text style={styles.badgeText}>LIGHTEST</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Thickness bar */}
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>{thicknessLabel}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(r.thickness / maxThickness) * 100}%` },
                        r.isThinnest && styles.barFillThin,
                      ]}
                    />
                  </View>
                  <Text style={styles.metricValue}>{formatNumber(r.thickness, 1)} mm</Text>
                </View>

                {/* Weight bar */}
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        styles.barFillWeight,
                        { width: `${(r.weight / maxWeight) * 100}%` },
                        r.isLightest && styles.barFillLightWin,
                      ]}
                    />
                  </View>
                  <Text style={styles.metricValue}>{formatNumber(r.weight, 2)} g</Text>
                </View>

                <Text style={styles.abbeText}>
                  Abbe {r.abbe}
                  {r.isClearest ? ' · best clarity' : r.abbe <= 32 ? ' · more color fringing' : ''}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.disclaimer}>
            Thickness from sag geometry; weight is a relative estimate (flat-disc model). Abbe value
            indicates chromatic aberration — higher is clearer. Nominal material values.
          </Text>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter a lens power to compare materials</Text>
        </View>
      )}

      {pickerInfo && (
        <ScrollPicker
          visible={activePicker !== null}
          value={getPickerValue()}
          config={pickerInfo.config}
          label={pickerInfo.label}
          suffix={pickerInfo.suffix}
          onSelect={handlePickerSelect}
          onClose={() => setActivePicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
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
  pickerBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  pickerIconBar: {
    width: 12,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: {
    width: 8,
    backgroundColor: Colors.accent,
  },
  summaryRow: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  summaryText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  materialRow: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  materialRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  materialName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeThin: {
    backgroundColor: Colors.primary,
  },
  badgeLight: {
    backgroundColor: Colors.success,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textOnPrimary,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 46,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    minWidth: 2,
  },
  barFillThin: {
    backgroundColor: Colors.primary,
  },
  barFillWeight: {
    backgroundColor: Colors.accent,
  },
  barFillLightWin: {
    backgroundColor: Colors.success,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    width: 64,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  abbeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  iconBtnKbd: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: { fontSize: 12, color: Colors.primary },
});
