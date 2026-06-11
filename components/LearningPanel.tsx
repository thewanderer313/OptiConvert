import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { LearningContent } from '../utils/learningSteps';

interface Props {
  content: LearningContent | null;
  diagram?: React.ReactNode;
}

export default function LearningPanel({ content, diagram }: Props) {
  if (!content) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LEARN</Text>
        </View>
        <Text style={styles.conceptTitle}>{content.conceptTitle}</Text>
      </View>

      <Text style={styles.conceptDescription}>{content.conceptDescription}</Text>

      {diagram && <View style={styles.diagramContainer}>{diagram}</View>}

      <View style={styles.stepsContainer}>
        {content.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              {step.formula && (
                <Text style={styles.formula}>{step.formula}</Text>
              )}
              <View style={styles.workBox}>
                <Text style={styles.workText}>{step.work}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    overflow: 'hidden',
    ...Shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingBottom: 0,
  },
  badge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textOnAccent,
    fontSize: 10,
  },
  conceptTitle: {
    ...Typography.title,
    color: Colors.text,
  },
  conceptDescription: {
    ...Typography.learning,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  diagramContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
  },
  stepsContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 2,
  },
  formula: {
    ...Typography.formula,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
  },
  workBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  workText: {
    ...Typography.learning,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
});
