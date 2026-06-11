import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../constants/theme';

interface Props {
  hubTitle: string;
  toolLabel: string;
  hasMultiple: boolean;
  onPress: () => void;
}

export default function HeaderTitleButton({ hubTitle, toolLabel, hasMultiple, onPress }: Props) {
  if (!hasMultiple) {
    return (
      <View style={styles.container}>
        <Text style={styles.toolText}>{toolLabel}</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${hubTitle}: ${toolLabel}. Tap to switch tool.`}
    >
      <Text style={styles.hubText}>{hubTitle}</Text>
      <View style={styles.toolRow}>
        <Text style={styles.toolText}>{toolLabel}</Text>
        <Text style={styles.chevron}>▾</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hubText: {
    ...Typography.caption,
    color: Colors.accentLight,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolText: { ...Typography.header, color: Colors.textOnPrimary },
  chevron: { color: Colors.accentLight, fontSize: 14, fontWeight: '700' },
});
