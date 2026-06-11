import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { Category, Hub, CATEGORIES } from '../utils/conversions';

interface Props {
  visible: boolean;
  hub: Hub;
  selected: Category;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

// Look up the full CategoryConfig for a HubItem to get its description.
function describe(key: Category): string {
  return CATEGORIES.find((c) => c.key === key)?.description ?? '';
}

export default function ToolPickerSheet({ visible, hub, selected, onSelect, onClose }: Props) {
  const handleSelect = (key: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{hub.title}</Text>
          <Text style={styles.subtitle}>{hub.description}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {hub.items.map((item) => {
              const isActive = item.key === selected;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => handleSelect(item.key)}
                  activeOpacity={0.6}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.itemDescription, isActive && styles.itemDescriptionActive]}
                    >
                      {describe(item.key)}
                    </Text>
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: 34,
    maxHeight: '80%',
    ...Shadow.card,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  itemActive: { backgroundColor: Colors.primary },
  itemContent: { flex: 1 },
  itemLabel: { ...Typography.bodyBold, color: Colors.text },
  itemLabelActive: { color: Colors.textOnPrimary },
  itemDescription: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  itemDescriptionActive: { color: Colors.accentLight },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.sm,
  },
});
