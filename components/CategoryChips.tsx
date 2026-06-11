import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { Category, CATEGORIES } from '../utils/conversions';

interface Props {
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryChips({ selected, onSelect }: Props) {
  const handlePress = (category: Category) => {
    if (category !== selected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(category);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === selected;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handlePress(cat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.chipActive,
  },
  chipText: {
    ...Typography.chip,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
});
