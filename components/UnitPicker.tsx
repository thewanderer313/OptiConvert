import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
  FlatList,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';

interface UnitOption {
  key: string;
  label: string;
  abbr: string;
}

interface Props {
  options: UnitOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export default function UnitPicker({ options, selected, onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((o) => o.key === selected);

  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>{selectedOption?.abbr ?? selected}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.key === selected && styles.optionActive,
                  ]}
                  onPress={() => handleSelect(item.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionAbbr,
                      item.key === selected && styles.optionTextActive,
                    ]}
                  >
                    {item.abbr}
                  </Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      item.key === selected && styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minWidth: 70,
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.bodyBold,
    color: Colors.textOnPrimary,
  },
  chevron: {
    fontSize: 10,
    color: Colors.accentLight,
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 320,
    maxHeight: 400,
    ...Shadow.card,
    overflow: 'hidden',
  },
  modalTitle: {
    ...Typography.title,
    color: Colors.text,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionActive: {
    backgroundColor: Colors.primary,
  },
  optionAbbr: {
    ...Typography.bodyBold,
    color: Colors.primary,
    width: 40,
  },
  optionLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.textOnPrimary,
  },
});
