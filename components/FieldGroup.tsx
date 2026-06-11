import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  suffix?: string;
  keyboardType?: 'decimal-pad' | 'number-pad' | 'default';
  picker?: PickerConfig;
  /** Which entry method opens on direct field tap. Defaults to 'keyboard'. */
  defaultEntry?: 'picker' | 'keyboard';
}

interface Props {
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 1 | 2 | 3;
}

export default function FieldGroup({ fields, values, onChange, columns = 2 }: Props) {
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const rows: FieldConfig[][] = [];
  for (let i = 0; i < fields.length; i += columns) {
    rows.push(fields.slice(i, i + columns));
  }

  const activeField = fields.find((f) => f.key === activePicker);

  const focusInput = (key: string) => {
    setEditingKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => inputRefs.current[key]?.focus(), 0);
  };

  const handleBlur = (field: FieldConfig) => {
    if (field.defaultEntry === 'picker') {
      setEditingKeys((prev) => ({ ...prev, [field.key]: false }));
    }
  };

  const handleFieldTap = (field: FieldConfig) => {
    const isPickerDefault = field.defaultEntry === 'picker' && !!field.picker;
    if (isPickerDefault && !editingKeys[field.key]) {
      setActivePicker(field.key);
    } else {
      focusInput(field.key);
    }
  };

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((field) => {
            const isPickerDefault = field.defaultEntry === 'picker' && !!field.picker;
            const inputInert = isPickerDefault && !editingKeys[field.key];
            return (
              <View key={field.key} style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{field.label}</Text>
                <Pressable style={styles.inputBox} onPress={() => handleFieldTap(field)}>
                  <TextInput
                    ref={(el) => { inputRefs.current[field.key] = el; }}
                    style={styles.input}
                    value={values[field.key] ?? ''}
                    onChangeText={(v) => onChange(field.key, v)}
                    onBlur={() => handleBlur(field)}
                    keyboardType={field.keyboardType ?? 'decimal-pad'}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.border}
                    selectionColor={Colors.accent}
                    pointerEvents={inputInert ? 'none' : 'auto'}
                  />
                  {field.picker && isPickerDefault ? (
                    <TouchableOpacity
                      style={styles.iconBtnKbd}
                      onPress={() => focusInput(field.key)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.iconKbdText}>⌨</Text>
                    </TouchableOpacity>
                  ) : field.picker ? (
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
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

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
  iconBtnKbd: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
