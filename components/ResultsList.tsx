import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { formatNumber } from '../utils/conversions';
import * as Clipboard from 'expo-clipboard';

interface ResultItem {
  label: string;
  abbr: string;
  value: number;
}

interface Props {
  results: ResultItem[];
  title?: string;
}

export default function ResultsList({ results, title = 'Results' }: Props) {
  const handleCopy = async (value: number, abbr: string) => {
    try {
      await Clipboard.setStringAsync(`${formatNumber(value)} ${abbr}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // clipboard not available
    }
  };

  if (results.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter a value to see conversions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {results.map((r, i) => (
          <TouchableOpacity
            key={`${r.abbr}-${i}`}
            style={[styles.row, i > 0 && styles.rowBorder]}
            onPress={() => handleCopy(r.value, r.abbr)}
            activeOpacity={0.6}
          >
            <Text style={styles.value}>{formatNumber(r.value)}</Text>
            <Text style={styles.unit}>{r.abbr}</Text>
            <Text style={styles.label}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>Tap a result to copy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  title: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  value: {
    ...Typography.result,
    color: Colors.text,
    minWidth: 80,
  },
  unit: {
    ...Typography.bodyBold,
    color: Colors.accent,
    minWidth: 30,
  },
  label: {
    ...Typography.resultUnit,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  hint: {
    ...Typography.resultUnit,
    color: Colors.border,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
