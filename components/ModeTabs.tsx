import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { Category, HubItem } from '../utils/conversions';

interface Props {
  items: HubItem[];
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function ModeTabs({ items, selected, onSelect }: Props) {
  const handlePress = (key: Category) => {
    if (key !== selected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(key);
    }
  };

  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {items.map((item) => {
          const active = item.key === selected;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handlePress(item.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    ...Typography.chip,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textOnPrimary,
  },
});
