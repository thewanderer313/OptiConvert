import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

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
  const [activePicker, setActivePicker] = useState<PickerField>(null);

  // Direction is derived from the actual From/To values: the larger vertex is
  // the spectacle plane, the smaller is the contact lens. A larger lens-to-eye
  // distance (glasses) moving to a smaller one (contacts) reads left→right.
  const fromVal = parseFloat(originalVertex);
  const toVal = parseFloat(newVertex);
  const glassesToContacts = isNaN(fromVal) || isNaN(toVal) ? true : fromVal >= toVal;
  const fromName = glassesToContacts ? 'Glasses' : 'Contacts';
  const toName = glassesToContacts ? 'Contacts' : 'Glasses';

  const swapDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevFrom = originalVertex;
    onChangeOriginalVertex(newVertex);
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
      case 'sphere': onChangePower(value); break;
      case 'cylinder': onChangeCylinder(value); break;
      case 'axis': onChangeAxis(value); break;
      case 'fromVertex': onChangeOriginalVertex(value); break;
      case 'toVertex': onChangeNewVertex(value); break;
    }
  };

  const PickerButton = ({ field }: { field: PickerField }) => (
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
  );

  const pickerInfo = activePicker ? PICKER_MAP[activePicker] : null;

  return (
    <View style={styles.container}>
      {/* Sphere / Cylinder / Axis row */}
      <View style={styles.rxRow}>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>SPHERE (D)</Text>
          <View style={styles.inputRowSmall}>
            <TextInput
              style={styles.inputSmall}
              value={power}
              onChangeText={onChangePower}
              keyboardType="decimal-pad"
              placeholder="-4.00"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="sphere" />
          </View>
        </View>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>CYLINDER (D)</Text>
          <View style={styles.inputRowSmall}>
            <TextInput
              style={styles.inputSmall}
              value={cylinder}
              onChangeText={onChangeCylinder}
              keyboardType="decimal-pad"
              placeholder="-1.50"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="cylinder" />
          </View>
        </View>
        <View style={styles.rxFieldSmall}>
          <Text style={styles.sectionLabel}>AXIS</Text>
          <View style={styles.inputRowSmall}>
            <TextInput
              style={styles.inputSmall}
              value={axis}
              onChangeText={onChangeAxis}
              keyboardType="number-pad"
              placeholder="90"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="axis" />
          </View>
        </View>
      </View>

      <Text style={styles.hint}>Leave Cylinder and Axis blank for sphere-only</Text>

      {/* Vertex distance row */}
      <View style={styles.vertexRow}>
        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>FROM VERTEX (mm)</Text>
          <View style={styles.inputRowSmall}>
            <TextInput
              style={styles.inputSmall}
              value={originalVertex}
              onChangeText={onChangeOriginalVertex}
              keyboardType="decimal-pad"
              placeholder="12"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="fromVertex" />
          </View>
        </View>

        <Text style={styles.arrow}>→</Text>

        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>TO VERTEX (mm)</Text>
          <View style={styles.inputRowSmall}>
            <TextInput
              style={styles.inputSmall}
              value={newVertex}
              onChangeText={onChangeNewVertex}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="toVertex" />
          </View>
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
  rxField: {
    flex: 2,
  },
  rxFieldSmall: {
    flex: 1,
  },
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
  vertexField: {
    flex: 1,
  },
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
  dirText: {
    ...Typography.bodyBold,
    color: Colors.textOnPrimary,
  },
  dirArrow: {
    color: Colors.accentLight,
  },
  dirSwapBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirSwapIcon: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
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
  pickerIconBarShort: {
    width: 8,
    backgroundColor: Colors.accent,
  },
});
