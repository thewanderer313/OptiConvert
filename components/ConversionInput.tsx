import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import UnitPicker from './UnitPicker';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

interface UnitOption {
  key: string;
  label: string;
  abbr: string;
}

interface Props {
  value: string;
  onChangeValue: (text: string) => void;
  unit: string;
  onChangeUnit: (key: string) => void;
  unitOptions: UnitOption[];
  label?: string;
  placeholder?: string;
  picker?: PickerConfig;
  /** Which entry method opens on direct field tap. Defaults to 'keyboard'. */
  defaultEntry?: 'picker' | 'keyboard';
}

export default function ConversionInput({
  value,
  onChangeValue,
  unit,
  onChangeUnit,
  unitOptions,
  label,
  placeholder = '0',
  picker,
  defaultEntry = 'keyboard',
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isPickerDefault = defaultEntry === 'picker' && !!picker;
  const inputInert = isPickerDefault && !editing;

  const focusInput = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    if (isPickerDefault) setEditing(false);
  };

  const handleFieldTap = () => {
    if (isPickerDefault && !editing) {
      setPickerOpen(true);
    } else {
      focusInput();
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.inputRow} onPress={handleFieldTap}>
        {isPickerDefault ? (
          <TouchableOpacity
            style={styles.iconBtnKbd}
            onPress={focusInput}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.iconKbdText}>⌨</Text>
          </TouchableOpacity>
        ) : picker ? (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View style={styles.pickerIconBar} />
            <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
            <View style={styles.pickerIconBar} />
          </TouchableOpacity>
        ) : null}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeValue}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
          maxLength={15}
          pointerEvents={inputInert ? 'none' : 'auto'}
        />
        <UnitPicker
          options={unitOptions}
          selected={unit}
          onSelect={onChangeUnit}
        />
      </Pressable>

      {picker && (
        <ScrollPicker
          visible={pickerOpen}
          value={value}
          config={picker}
          label={label ?? 'Value'}
          onSelect={onChangeValue}
          onClose={() => setPickerOpen(false)}
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
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.input,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  pickerButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
