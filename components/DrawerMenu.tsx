import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { HUBS } from '../utils/conversions';

interface Props {
  visible: boolean;
  selected: string; // active hub key
  onSelect: (hubKey: string) => void;
  onClose: () => void;
}

export default function DrawerMenu({ visible, selected, onSelect, onClose }: Props) {
  const handleSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer panel */}
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>OptiConvert</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.group}>
              {HUBS.map((hub) => {
                const isActive = hub.key === selected;
                return (
                  <TouchableOpacity
                    key={hub.key}
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => handleSelect(hub.key)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                        {hub.title}
                      </Text>
                      <Text
                        style={[
                          styles.itemDescription,
                          isActive && styles.itemDescriptionActive,
                        ]}
                      >
                        {hub.items.map((i) => i.label).join(' · ')}
                      </Text>
                    </View>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: Spacing.xxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    maxWidth: 300,
    backgroundColor: Colors.surface,
    ...Shadow.card,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    ...Typography.header,
    color: Colors.textOnPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  drawerScroll: {
    flex: 1,
  },
  group: {
    paddingTop: Spacing.md,
  },
  groupTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  itemActive: {
    backgroundColor: Colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  itemLabelActive: {
    color: Colors.textOnPrimary,
  },
  itemDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemDescriptionActive: {
    color: Colors.accentLight,
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.sm,
  },
});
