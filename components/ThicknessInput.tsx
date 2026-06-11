import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { REFRACTIVE_INDICES } from '../utils/conversions';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

const PICKER_POWER: PickerConfig = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_DIA: PickerConfig = { min: 40, max: 80, step: 1, precision: 0 };
const PICKER_MIN_T: PickerConfig = { min: 0.5, max: 5, step: 0.1, precision: 1 };

type PickerField = 'power' | 'diameter' | 'minThickness' | null;

interface Props {
  power: string;
  onChangePower: (text: string) => void;
  diameter: string;
  onChangeDiameter: (text: string) => void;
  refractiveIndex: number;
  onChangeRefractiveIndex: (value: number) => void;
  minThickness: string;
  onChangeMinThickness: (text: string) => void;
}

export default function ThicknessInput({
  power,
  onChangePower,
  diameter,
  onChangeDiameter,
  refractiveIndex,
  onChangeRefractiveIndex,
  minThickness,
  onChangeMinThickness,
}: Props) {
  const [activePicker, setActivePicker] = useState<PickerField>(null);

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
      case 'power': onChangePower(value); break;
      case 'diameter': onChangeDiameter(value); break;
      case 'minThickness': onChangeMinThickness(value); break;
    }
  };

  const getPickerConfig = (): { config: PickerConfig; label: string; suffix?: string } => {
    switch (activePicker) {
      case 'power': return { config: PICKER_POWER, label: 'LENS POWER', suffix: 'D' };
      case 'diameter': return { config: PICKER_DIA, label: 'DIAMETER', suffix: 'mm' };
      case 'minThickness': return { config: PICKER_MIN_T, label: 'MIN THICKNESS', suffix: 'mm' };
      default: return { config: PICKER_POWER, label: '' };
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

  const pickerInfo = activePicker ? getPickerConfig() : null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>LENS POWER (D)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={power}
              onChangeText={onChangePower}
              keyboardType="decimal-pad"
              placeholder="-3.00"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="power" />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>DIAMETER (mm)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={diameter}
              onChangeText={onChangeDiameter}
              keyboardType="decimal-pad"
              placeholder="70"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
            <PickerButton field="diameter" />
          </View>
        </View>
      </View>

      <Text style={styles.label}>MATERIAL</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.materialRow}
      >
        {REFRACTIVE_INDICES.map((ri) => {
          const isActive = ri.value === refractiveIndex;
          return (
            <TouchableOpacity
              key={ri.value}
              style={[styles.materialChip, isActive && styles.materialChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChangeRefractiveIndex(ri.value);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.materialText,
                  isActive && styles.materialTextActive,
                ]}
              >
                {ri.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>MIN THICKNESS (mm)</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={minThickness}
          onChangeText={onChangeMinThickness}
          keyboardType="decimal-pad"
          placeholder="1.5"
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
        />
        <PickerButton field="minThickness" />
      </View>

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
  materialRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  materialChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  materialText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  materialTextActive: {
    color: Colors.textOnPrimary,
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
