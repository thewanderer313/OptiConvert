import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { RX_ABBREVIATIONS, LENS_MATERIALS } from '../utils/referenceData';

type Tab = 'abbreviations' | 'materials';

export default function ReferenceView() {
  const [tab, setTab] = useState<Tab>('abbreviations');

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'abbreviations' && styles.tabActive]}
          onPress={() => setTab('abbreviations')}
        >
          <Text style={[styles.tabText, tab === 'abbreviations' && styles.tabTextActive]}>
            Abbreviations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'materials' && styles.tabActive]}
          onPress={() => setTab('materials')}
        >
          <Text style={[styles.tabText, tab === 'materials' && styles.tabTextActive]}>
            Materials
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'abbreviations' && (
        <View style={styles.card}>
          {RX_ABBREVIATIONS.map((item, i) => (
            <View key={i} style={[styles.abbrRow, i > 0 && styles.rowBorder]}>
              <View style={styles.abbrBadge}>
                <Text style={styles.abbrText}>{item.abbr}</Text>
              </View>
              <View style={styles.abbrContent}>
                <Text style={styles.abbrMeaning}>{item.meaning}</Text>
                <Text style={styles.abbrContext}>{item.context}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {tab === 'materials' && (
        <View style={styles.materialsContainer}>
          {LENS_MATERIALS.map((mat, i) => (
            <View key={i} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <Text style={styles.materialName}>{mat.name}</Text>
                <Text style={styles.materialIndex}>n = {mat.index}</Text>
              </View>
              <View style={styles.materialGrid}>
                <View style={styles.materialStat}>
                  <Text style={styles.statLabel}>Abbe</Text>
                  <Text style={styles.statValue}>{mat.abbe}</Text>
                </View>
                <View style={styles.materialStat}>
                  <Text style={styles.statLabel}>Density</Text>
                  <Text style={styles.statValue}>{mat.specificGravity}</Text>
                </View>
                <View style={styles.materialStat}>
                  <Text style={styles.statLabel}>UV Cut</Text>
                  <Text style={styles.statValue}>{mat.uvCutoff}</Text>
                </View>
                <View style={styles.materialStat}>
                  <Text style={styles.statLabel}>Impact</Text>
                  <Text style={styles.statValue}>{mat.impactResistance}</Text>
                </View>
              </View>
              <Text style={styles.materialNotes}>{mat.notes}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  abbrRow: {
    flexDirection: 'row',
    padding: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  abbrBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  abbrText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  abbrContent: {
    flex: 1,
  },
  abbrMeaning: {
    ...Typography.label,
    color: Colors.text,
  },
  abbrContext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  materialsContainer: {
    gap: Spacing.sm,
  },
  materialCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadow.card,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  materialName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  materialIndex: {
    ...Typography.label,
    color: Colors.accent,
  },
  materialGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  materialStat: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs + 2,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    ...Typography.label,
    color: Colors.text,
    marginTop: 2,
  },
  materialNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
