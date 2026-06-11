import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  FlatList,
  TextInput,
  ViewToken,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export interface PickerConfig {
  min: number;
  max: number;
  step: number;
  precision: number; // decimal places
}

interface Props {
  visible: boolean;
  value: string;
  config: PickerConfig;
  label: string;
  suffix?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function ScrollPicker({
  visible,
  value,
  config,
  label,
  suffix,
  onSelect,
  onClose,
}: Props) {
  const [typedValue, setTypedValue] = useState(value);
  const flatListRef = useRef<FlatList>(null);
  const hasScrolledToInitial = useRef(false);

  // Generate values array
  const values = useMemo(() => {
    const result: string[] = [];
    // Use integer math to avoid floating point issues
    const factor = Math.pow(10, config.precision);
    const minInt = Math.round(config.min * factor);
    const maxInt = Math.round(config.max * factor);
    const stepInt = Math.round(config.step * factor);
    for (let i = minInt; i <= maxInt; i += stepInt) {
      result.push((i / factor).toFixed(config.precision));
    }
    return result;
  }, [config.min, config.max, config.step, config.precision]);

  // Find initial index
  const initialIndex = useMemo(() => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return Math.floor(values.length / 2);
    // Snap to nearest step
    const factor = Math.pow(10, config.precision);
    const snapped = (
      Math.round((parsed - config.min) / config.step) * config.step +
      config.min
    ).toFixed(config.precision);
    const idx = values.indexOf(snapped);
    return idx >= 0 ? idx : Math.floor(values.length / 2);
  }, [value, values, config]);

  // Scroll to initial value when modal opens
  useEffect(() => {
    if (visible) {
      hasScrolledToInitial.current = false;
      setTypedValue(value);
    }
  }, [visible, value]);

  const handleLayout = useCallback(() => {
    if (!hasScrolledToInitial.current && flatListRef.current) {
      hasScrolledToInitial.current = true;
      flatListRef.current.scrollToOffset({
        offset: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [initialIndex]);

  // Track selected index from scroll
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // The middle visible item is the selected one
      if (viewableItems.length > 0) {
        // Find the item closest to center
        const centerIndex = Math.floor(viewableItems.length / 2);
        const centerItem = viewableItems[centerIndex];
        if (centerItem?.index != null) {
          setSelectedIndex(centerItem.index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleMomentumEnd = useCallback(
    (e: any) => {
      const offset = e.nativeEvent.contentOffset.y;
      const index = Math.round(offset / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, values.length - 1));
      setSelectedIndex(clampedIndex);
      setTypedValue(values[clampedIndex]);
      Haptics.selectionAsync();
    },
    [values]
  );

  const handleDone = useCallback(() => {
    // Use typed value if it's valid, otherwise use scroll selection.
    const parsed = parseFloat(typedValue);
    if (!isNaN(parsed)) {
      // Clamp to the configured range so values that can't be reached by the
      // wheel (e.g. an axis of 270°) can't be entered by typing either.
      if (parsed < config.min || parsed > config.max) {
        const clamped = Math.min(config.max, Math.max(config.min, parsed));
        onSelect(clamped.toFixed(config.precision));
      } else {
        onSelect(typedValue);
      }
    } else {
      onSelect(values[selectedIndex]);
    }
    onClose();
  }, [typedValue, selectedIndex, values, config, onSelect, onClose]);

  const handleTypedSubmit = useCallback(() => {
    const parsed = parseFloat(typedValue);
    if (!isNaN(parsed) && flatListRef.current) {
      // Snap to nearest step and scroll to it
      const snapped = (
        Math.round((parsed - config.min) / config.step) * config.step +
        config.min
      ).toFixed(config.precision);
      const idx = values.indexOf(snapped);
      if (idx >= 0) {
        flatListRef.current.scrollToOffset({
          offset: idx * ITEM_HEIGHT,
          animated: true,
        });
        setSelectedIndex(idx);
      }
    }
  }, [typedValue, values, config]);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const isSelected = index === selectedIndex;
      return (
        <TouchableOpacity
          style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
          onPress={() => {
            flatListRef.current?.scrollToOffset({
              offset: index * ITEM_HEIGHT,
              animated: true,
            });
            setSelectedIndex(index);
            setTypedValue(item);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pickerItemText,
              isSelected && styles.pickerItemTextSelected,
            ]}
          >
            {item}
          </Text>
          {suffix && isSelected && (
            <Text style={styles.pickerItemSuffix}>{suffix}</Text>
          )}
        </TouchableOpacity>
      );
    },
    [selectedIndex, suffix]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalLabel}>{label}</Text>

          {/* Text input for manual entry */}
          <View style={styles.typeRow}>
            <TextInput
              style={styles.typeInput}
              value={typedValue}
              onChangeText={setTypedValue}
              onSubmitEditing={handleTypedSubmit}
              keyboardType="decimal-pad"
              selectionColor={Colors.accent}
              placeholder="Type value"
              placeholderTextColor={Colors.border}
            />
            {suffix && <Text style={styles.typeSuffix}>{suffix}</Text>}
          </View>

          {/* Scroll wheel */}
          <View style={styles.wheelContainer}>
            {/* Selection highlight band */}
            <View style={styles.selectionBand} pointerEvents="none" />

            <FlatList
              ref={flatListRef}
              data={values}
              renderItem={renderItem}
              keyExtractor={(item) => item}
              getItemLayout={getItemLayout}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={handleMomentumEnd}
              onLayout={handleLayout}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
              }}
            />
          </View>

          {/* Done button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
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
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: 34, // safe area
    ...Shadow.card,
  },
  modalLabel: {
    ...Typography.title,
    color: Colors.text,
    textAlign: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  typeInput: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm + 2,
    textAlign: 'center',
  },
  typeSuffix: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  wheelContainer: {
    height: PICKER_HEIGHT,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  selectionBand: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    zIndex: 1,
    opacity: 0.1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pickerItemSelected: {},
  pickerItemText: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  pickerItemTextSelected: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  pickerItemSuffix: {
    ...Typography.label,
    color: Colors.accent,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  doneText: {
    ...Typography.bodyBold,
    color: Colors.textOnPrimary,
  },
});
