import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';
import { useSharedValues } from '../contexts/SharedValuesContext';

const PICKER_SPHERE: PickerConfig = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_CYLINDER: PickerConfig = { min: -10, max: 10, step: 0.25, precision: 2 };
const PICKER_AXIS: PickerConfig = { min: 1, max: 180, step: 1, precision: 0 };
const PICKER_VERTEX: PickerConfig = { min: 0, max: 20, step: 0.5, precision: 1 };

interface Props {
  power: string;
  onChangePower: (text: string) => void;
  cylinder: string;
  onChangeCylinder: (text: string) => void;
  axis: string;
  onChangeAxis: (text: string) => void;
  originalVertex: string;
  onChangeOriginalVertex: (text: string) => void;
  newVertex: string;
  onChangeNewVertex: (text: string) => void;
}

type PickerField = 'sphere' | 'cylinder' | 'axis' | 'fromVertex' | 'toVertex' | null;

const PICKER_MAP: Record<string, { config: PickerConfig; label: string; suffix?: string }> = {
  sphere: { config: PICKER_SPHERE, label: 'SPHERE', suffix: 'D' },
  cylinder: { config: PICKER_CYLINDER, label: 'CYLINDER', suffix: 'D' },
  axis: { config: PICKER_AXIS, label: 'AXIS', suffix: '°' },
  fromVertex: { config: PICKER_VERTEX, label: 'FROM VERTEX', suffix: 'mm' },
  toVertex: { config: PICKER_VERTEX, label: 'TO VERTEX', suffix: 'mm' },
};

// All five fields here are stepped, so all are picker-default.
const PICKER_DEFAULT_FIELDS: Set<NonNullable<PickerField>> = new Set([
  'sphere', 'cylinder', 'axis', 'fromVertex', 'toVertex',
]);

export default function VertexInput({
  power,
  onChangePower,
  cylinder,
  onChangeCylinder,
  axis,
  onChangeAxis,
  originalVertex,
  onChangeOriginalVertex,
  newVertex,
  onChangeNewVertex,
}: Props) {
  const { values: shared, setValue: setShared } = useSharedValues();

  // Hydrate empties from shared store on first mount.
  useEffect(() => {
    if (!power && shared.lastRx) onChangePower(shared.lastRx.sphere.toFixed(2));
    if (!cylinder && shared.lastRx) onChangeCylinder(shared.lastRx.cylinder.toFixed(2));
    if (!axis && shared.lastRx) onChangeAxis(String(shared.lastRx.axis));
    if (originalVertex === '12' && shared.vertexDistance != null) {
      onChangeOriginalVertex(shared.vertexDistance.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write back on every change (numeric values only).
  const writeRxIfComplete = (sph: string, cyl: string, ax: string) => {
    const s = parseFloat(sph);
    const c = parseFloat(cyl);
    const a = parseFloat(ax);
    if (!isNaN(s) && !isNaN(c) && !isNaN(a)) {
      setShared('lastRx', { sphere: s, cylinder: c, axis: a });
    }
  };

  const onPowerChange = (v: string) => {
    onChangePower(v);
    writeRxIfComplete(v, cylinder, axis);
  };
  const onCylinderChange = (v: string) => {
    onChangeCylinder(v);
    writeRxIfComplete(power, v, axis);
  };
  const onAxisChange = (v: string) => {
    onChangeAxis(v);
    writeRxIfComplete(power, cylinder, v);
  };
  const onFromChange = (v: string) => {
    onChangeOriginalVertex(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setShared('vertexDistance', n);
  };
  const onToChange = (v: string) => {
    onChangeNewVertex(v);
    // newVertex is the target; we do not write it to shared store.
  };

  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [editingField, setEditingField] = useState<PickerField>(null);
  const inputRefs = useRef<Partial<Record<NonNullable<PickerField>, TextInput | null>>>({});

  const fromVal = parseFloat(originalVertex);
  const toVal = parseFloat(newVertex);
  const glassesToContacts = isNaN(fromVal) || isNaN(toVal) ? true : fromVal >= toVal;
  const fromName = glassesToContacts ? 'Glasses' : 'Contacts';
  const toName = glassesToContacts ? 'Contacts' : 'Glasses';

  const swapDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevFrom = originalVertex;
    onFromChange(newVertex);
    onChangeNewVertex(prevFrom);
  };

  const getPickerValue = (): string => {
    switch (activePicker) {
      case 'sphere': return power;
      case 'cylinder': return cylinder;
      case 'axis': return axis;
      case 'fromVertex': return originalVertex;
      case 'toVertex': return newVertex;
      default: return '';
    }
  };

  const handlePickerSelect = (value: string) => {
    switch (activePicker) {
      case 'sphere': onPowerChange(value); break;
      case 'cylinder': onCylinderChange(value); break;
      case 'axis': onAxisChange(value); break;
      case 'fromVertex': onFromChange(value); break;
      case 'toVertex': onToChange(value); break;
    }
  };

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

  // Render helper (NOT a component) — returning JSX from a function avoids
  // creating a new React component identity per render, which would unmount
  // the TextInput on every keystroke and break focus.
  const renderSmartField = (
    field: NonNullable<PickerField>,
    value: string,
    onValueChange: (text: string) => void,
    keyboardType: 'decimal-pad' | 'number-pad',
    placeholder: string
  ) => {
    const isPickerDefault = PICKER_DEFAULT_FIELDS.has(field);
    const inputInert = isPickerDefault && editingField !== field;
    return (
      <Pressable style={styles.inputRowSmall} onPress={() => handleFieldTap(field)}>
        <TextInput
          ref={(el) => { inputRefs.current[field] = el; }}
          style={styles.inputSmall}
          value={value}
          onChangeText={onValueChange}
          onBlur={() => handleBlur(field)}
          keyboardType={keyboardType}
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

  const pickerInfo = activePicker ? PICKER_MAP[activePicker] : null;

  return (
    <View style={styles.container}>
      <View style={styles.rxRow}>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>SPHERE (D)</Text>
          {renderSmartField('sphere', power, onPowerChange, 'decimal-pad', '-4.00')}
        </View>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>CYLINDER (D)</Text>
          {renderSmartField('cylinder', cylinder, onCylinderChange, 'decimal-pad', '-1.50')}
        </View>
        <View style={styles.rxFieldSmall}>
          <Text style={styles.sectionLabel}>AXIS</Text>
          {renderSmartField('axis', axis, onAxisChange, 'number-pad', '90')}
        </View>
      </View>

      <Text style={styles.hint}>Leave Cylinder and Axis blank for sphere-only</Text>

      <View style={styles.vertexRow}>
        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>FROM VERTEX (mm)</Text>
          {renderSmartField('fromVertex', originalVertex, onFromChange, 'decimal-pad', '12')}
        </View>

        <Text style={styles.arrow}>→</Text>

        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>TO VERTEX (mm)</Text>
          {renderSmartField('toVertex', newVertex, onToChange, 'decimal-pad', '0')}
        </View>
      </View>

      <TouchableOpacity
        style={styles.dirToggle}
        onPress={swapDirection}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Direction ${fromName} to ${toName}. Tap to reverse.`}
      >
        <Text style={styles.dirText}>
          {fromName} <Text style={styles.dirArrow}>→</Text> {toName}
        </Text>
        <View style={styles.dirSwapBadge}>
          <Text style={styles.dirSwapIcon}>⇄</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.dirHint}>Tap to reverse direction</Text>

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
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  rxRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  rxField: { flex: 2 },
  rxFieldSmall: { flex: 1 },
  hint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  vertexRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  vertexField: { flex: 1 },
  arrow: {
    fontSize: 24,
    color: Colors.accent,
    marginBottom: Spacing.md,
    fontWeight: '300',
  },
  inputRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  inputSmall: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  dirToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
  },
  dirText: { ...Typography.bodyBold, color: Colors.textOnPrimary },
  dirArrow: { color: Colors.accentLight },
  dirSwapBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirSwapIcon: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
  dirHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xs,
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
  pickerIconBarShort: { width: 8, backgroundColor: Colors.accent },
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
