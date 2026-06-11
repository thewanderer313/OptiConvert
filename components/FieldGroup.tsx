import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  suffix?: string;
  keyboardType?: 'decimal-pad' | 'number-pad' | 'default';
  picker?: PickerConfig;
}

interface Props {
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 1 | 2 | 3;
}

export default function FieldGroup({ fields, values, onChange, columns = 2 }: Props) {
  const [activePicker, setActivePicker] = useState<string | null>(null);

  const rows: FieldConfig[][] = [];
  for (let i = 0; i < fields.length; i += columns) {
    rows.push(fields.slice(i, i + columns));
  }

  const activeField = fields.find((f) => f.key === activePicker);

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((field) => (
            <View key={field.key} style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={values[field.key] ?? ''}
                  onChangeText={(v) => onChange(field.key, v)}
                  keyboardType={field.keyboardType ?? 'decimal-pad'}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.border}
                  selectionColor={Colors.accent}
                />
                {field.picker ? (
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setActivePicker(field.key)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <View style={styles.pickerIconBar} />
                    <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
                    <View style={styles.pickerIconBar} />
                  </TouchableOpacity>
                ) : field.suffix ? (
                  <Text style={styles.suffix}>{field.suffix}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Scroll picker modal */}
      {activeField?.picker && (
        <ScrollPicker
          visible={activePicker !== null}
          value={values[activeField.key] ?? ''}
          config={activeField.picker}
          label={activeField.label}
          suffix={activeField.suffix}
          onSelect={(v) => onChange(activeField.key, v)}
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
  field: {},
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
  suffix: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  pickerButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginLeft: Spacing.xs,
  },
  pickerIconBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: {
    width: 10,
    backgroundColor: Colors.accent,
  },
});
