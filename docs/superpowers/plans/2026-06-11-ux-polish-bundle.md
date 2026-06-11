# UX Polish Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace OptiConvert's intra-hub `ModeTabs` pill row with a header dropdown, add session-scoped cross-tool value persistence, and add a smart per-field default-entry mode that opens the scroll picker on tap for stepped Rx values while keeping both entry methods available everywhere.

**Architecture:** Three loosely-coupled pieces shipped together. A React Context (`SharedValuesContext`) provides session-only shared state for `patientPd`, `vertexDistance`, `refractiveIndex`, `workingDistance`, and `lastRx`. A new `defaultEntry: 'picker' | 'keyboard'` prop on `FieldConfig` and `ConversionInput` controls which entry method opens on direct field tap; both methods stay accessible via a secondary icon. A new `HeaderTitleButton` + `ToolPickerSheet` pair replaces `ModeTabs`, with the hub title becoming a tappable label that opens a bottom sheet of sub-tools.

**Tech Stack:** Expo SDK 56, React Native 0.85, expo-router 56, React 19, TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-06-11-ux-polish-bundle-design.md`

**Verification:** No unit test framework in this repo. Verification per task = `npx tsc --noEmit` clean + a manual smoke test against the dev server. After the full plan, run `npx expo-doctor` once.

**Branch:** Optional. The earlier work on this repo committed straight to `main`; if you prefer isolation, create `feature/ux-polish-bundle` first. The plan assumes whichever branch is currently checked out.

---

## File Map

**Created:**
- `contexts/SharedValuesContext.tsx` — Provider + `useSharedValues()` hook
- `components/HeaderTitleButton.tsx` — Tappable two-line title with chevron
- `components/ToolPickerSheet.tsx` — Bottom-sheet `Modal` listing sub-tools

**Modified:**
- `app/_layout.tsx` — Wrap app in `SharedValuesProvider`
- `app/index.tsx` — Replace `ModeTabs` with new components; integrate shared values; annotate fields with `defaultEntry`
- `components/FieldGroup.tsx` — Implement smart-default entry behaviour
- `components/ConversionInput.tsx` — Implement smart-default entry behaviour
- `components/VertexInput.tsx` — Smart-default per field + shared values
- `components/ThicknessInput.tsx` — Smart-default per field + shared refractive index
- `components/MaterialCompareView.tsx` — Smart-default per field (no shared values; tool iterates over all RIs by design)
- `components/NearAddView.tsx` — Annotate FIELDS + shared working distance

**Deleted:**
- `components/ModeTabs.tsx` — Replaced by header dropdown

---

## Task 1: Shared values context

**Files:**
- Create: `contexts/SharedValuesContext.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create the context module**

Create `contexts/SharedValuesContext.tsx` with this exact content:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

export interface SharedRx {
  sphere: number;
  cylinder: number;
  axis: number;
}

export interface SharedValues {
  patientPd: number | null;
  vertexDistance: number | null;
  refractiveIndex: number | null;
  workingDistance: number | null;
  lastRx: SharedRx | null;
}

type SharedKey = keyof SharedValues;

const EMPTY: SharedValues = {
  patientPd: null,
  vertexDistance: null,
  refractiveIndex: null,
  workingDistance: null,
  lastRx: null,
};

interface ContextShape {
  values: SharedValues;
  setValue: <K extends SharedKey>(key: K, value: SharedValues[K]) => void;
}

const SharedValuesContext = createContext<ContextShape | null>(null);

export function SharedValuesProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<SharedValues>(EMPTY);

  const setValue = useCallback(<K extends SharedKey>(key: K, value: SharedValues[K]) => {
    setValues((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const ctx = useMemo(() => ({ values, setValue }), [values, setValue]);

  return <SharedValuesContext.Provider value={ctx}>{children}</SharedValuesContext.Provider>;
}

export function useSharedValues(): ContextShape {
  const ctx = useContext(SharedValuesContext);
  if (!ctx) throw new Error('useSharedValues must be used inside SharedValuesProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap the app in the provider**

Modify `app/_layout.tsx`. Replace the `RootLayout` component body so the provider wraps everything below `GestureHandlerRootView`:

```tsx
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/theme';
import CustomSplash from '../components/CustomSplash';
import { SharedValuesProvider } from '../contexts/SharedValuesContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(Platform.OS === 'android');

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SharedValuesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.surfaceAlt },
          }}
        />
        {splashVisible && (
          <CustomSplash onFinish={() => setSplashVisible(false)} />
        )}
      </SharedValuesProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add contexts/SharedValuesContext.tsx app/_layout.tsx
git commit -m "Add SharedValuesContext for cross-tool persistence"
```

---

## Task 2: Smart-default entry in FieldGroup

**Files:**
- Modify: `components/FieldGroup.tsx`

- [ ] **Step 1: Add `defaultEntry` to FieldConfig and implement smart entry**

Replace the entire contents of `components/FieldGroup.tsx` with:

```tsx
import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

export interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  suffix?: string;
  keyboardType?: 'decimal-pad' | 'number-pad' | 'default';
  picker?: PickerConfig;
  /** Which entry method opens on direct field tap. Defaults to 'keyboard'. */
  defaultEntry?: 'picker' | 'keyboard';
}

interface Props {
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 1 | 2 | 3;
}

export default function FieldGroup({ fields, values, onChange, columns = 2 }: Props) {
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const rows: FieldConfig[][] = [];
  for (let i = 0; i < fields.length; i += columns) {
    rows.push(fields.slice(i, i + columns));
  }

  const activeField = fields.find((f) => f.key === activePicker);

  const focusInput = (key: string) => {
    setEditingKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => inputRefs.current[key]?.focus(), 0);
  };

  const handleBlur = (field: FieldConfig) => {
    if (field.defaultEntry === 'picker') {
      setEditingKeys((prev) => ({ ...prev, [field.key]: false }));
    }
  };

  const handleFieldTap = (field: FieldConfig) => {
    const isPickerDefault = field.defaultEntry === 'picker' && !!field.picker;
    if (isPickerDefault && !editingKeys[field.key]) {
      setActivePicker(field.key);
    } else {
      focusInput(field.key);
    }
  };

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((field) => {
            const isPickerDefault = field.defaultEntry === 'picker' && !!field.picker;
            const inputInert = isPickerDefault && !editingKeys[field.key];
            return (
              <View key={field.key} style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>{field.label}</Text>
                <Pressable style={styles.inputBox} onPress={() => handleFieldTap(field)}>
                  <TextInput
                    ref={(el) => { inputRefs.current[field.key] = el; }}
                    style={styles.input}
                    value={values[field.key] ?? ''}
                    onChangeText={(v) => onChange(field.key, v)}
                    onBlur={() => handleBlur(field)}
                    keyboardType={field.keyboardType ?? 'decimal-pad'}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.border}
                    selectionColor={Colors.accent}
                    pointerEvents={inputInert ? 'none' : 'auto'}
                  />
                  {field.picker && isPickerDefault ? (
                    <TouchableOpacity
                      style={styles.iconBtnKbd}
                      onPress={() => focusInput(field.key)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.iconKbdText}>⌨</Text>
                    </TouchableOpacity>
                  ) : field.picker ? (
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setActivePicker(field.key)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <View style={styles.pickerIconBar} />
                      <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
                      <View style={styles.pickerIconBar} />
                    </TouchableOpacity>
                  ) : field.suffix ? (
                    <Text style={styles.suffix}>{field.suffix}</Text>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}

      {activeField?.picker && (
        <ScrollPicker
          visible={activePicker !== null}
          value={values[activeField.key] ?? ''}
          config={activeField.picker}
          label={activeField.label}
          suffix={activeField.suffix}
          onSelect={(v) => onChange(activeField.key, v)}
          onClose={() => setActivePicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {},
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  input: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  suffix: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  pickerButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginLeft: Spacing.xs,
  },
  pickerIconBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: {
    width: 10,
    backgroundColor: Colors.accent,
  },
  iconBtnKbd: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Smoke test (existing fields unchanged)**

Start the dev server: `npx expo start`. Open any FieldGroup-using tool (e.g., Convert → Length & Power is `ConversionInput`, so use Rx Tools → Transpose). Tap a field — keyboard appears, tap the wheel icon — picker appears. (Behaviour identical to before because no field has `defaultEntry: 'picker'` yet.)

- [ ] **Step 4: Commit**

```bash
git add components/FieldGroup.tsx
git commit -m "Add defaultEntry support to FieldGroup"
```

---

## Task 3: Smart-default entry in ConversionInput

**Files:**
- Modify: `components/ConversionInput.tsx`

- [ ] **Step 1: Add `defaultEntry` prop and matching behaviour**

Replace the entire contents of `components/ConversionInput.tsx` with:

```tsx
import React, { useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import UnitPicker from './UnitPicker';
import ScrollPicker, { PickerConfig } from './ScrollPicker';

interface UnitOption {
  key: string;
  label: string;
  abbr: string;
}

interface Props {
  value: string;
  onChangeValue: (text: string) => void;
  unit: string;
  onChangeUnit: (key: string) => void;
  unitOptions: UnitOption[];
  label?: string;
  placeholder?: string;
  picker?: PickerConfig;
  /** Which entry method opens on direct field tap. Defaults to 'keyboard'. */
  defaultEntry?: 'picker' | 'keyboard';
}

export default function ConversionInput({
  value,
  onChangeValue,
  unit,
  onChangeUnit,
  unitOptions,
  label,
  placeholder = '0',
  picker,
  defaultEntry = 'keyboard',
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isPickerDefault = defaultEntry === 'picker' && !!picker;
  const inputInert = isPickerDefault && !editing;

  const focusInput = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    if (isPickerDefault) setEditing(false);
  };

  const handleFieldTap = () => {
    if (isPickerDefault && !editing) {
      setPickerOpen(true);
    } else {
      focusInput();
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.inputRow} onPress={handleFieldTap}>
        {picker && !isPickerDefault && (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.6}
          >
            <View style={styles.pickerIconBar} />
            <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
            <View style={styles.pickerIconBar} />
          </TouchableOpacity>
        )}
        {picker && isPickerDefault && (
          <TouchableOpacity
            style={styles.iconBtnKbd}
            onPress={focusInput}
            activeOpacity={0.6}
          >
            <Text style={styles.iconKbdText}>⌨</Text>
          </TouchableOpacity>
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeValue}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
          maxLength={15}
          pointerEvents={inputInert ? 'none' : 'auto'}
        />
        <UnitPicker
          options={unitOptions}
          selected={unit}
          onSelect={onChangeUnit}
        />
      </Pressable>

      {picker && (
        <ScrollPicker
          visible={pickerOpen}
          value={value}
          config={picker}
          label={label ?? 'Value'}
          onSelect={onChangeValue}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.input,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  pickerButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pickerIconBar: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: {
    width: 10,
    backgroundColor: Colors.accent,
  },
  iconBtnKbd: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: {
    fontSize: 14,
    color: Colors.primary,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ConversionInput.tsx
git commit -m "Add defaultEntry support to ConversionInput"
```

---

## Task 4: Annotate field configs in app/index.tsx

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Mark stepped fields as picker-default in the FIELDS arrays**

In `app/index.tsx`, update each multi-field config array to set `defaultEntry: 'picker'` on Rx-like / clinical-stepped fields. Replace each array literal as follows:

```ts
const TRANSPOSE_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER, defaultEntry: 'picker' },
  { key: 'axis', label: 'AXIS (°)', placeholder: '90', suffix: '°', picker: PICKER_AXIS, defaultEntry: 'picker' },
];

const SPH_EQUIV_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER, defaultEntry: 'picker' },
];

const MBS_FIELDS: FieldConfig[] = [
  { key: 'ed', label: 'EFFECTIVE DIA', placeholder: '54', suffix: 'mm', picker: { min: 40, max: 70, step: 1, precision: 0 } },
  { key: 'framePd', label: 'FRAME PD', placeholder: '70', suffix: 'mm', picker: { min: 55, max: 85, step: 1, precision: 0 } },
  { key: 'patientPd', label: 'PATIENT PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD, defaultEntry: 'picker' },
];

const PRENTICE_FIELDS: FieldConfig[] = [
  { key: 'decentration', label: 'DECENTRATION', placeholder: '5', suffix: 'mm', picker: PICKER_DECEN, defaultEntry: 'picker' },
  { key: 'power', label: 'LENS POWER', placeholder: '-4.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
];

const JAVAL_FIELDS: FieldConfig[] = [
  { key: 'k1', label: 'K1 (STEEP)', placeholder: '44.00', suffix: 'D', picker: PICKER_K, defaultEntry: 'picker' },
  { key: 'k1Axis', label: 'K1 AXIS', placeholder: '90', suffix: '°', picker: PICKER_AXIS, defaultEntry: 'picker' },
  { key: 'k2', label: 'K2 (FLAT)', placeholder: '42.50', suffix: 'D', picker: PICKER_K, defaultEntry: 'picker' },
  { key: 'k2Axis', label: 'K2 AXIS', placeholder: '180', suffix: '°', picker: PICKER_AXIS, defaultEntry: 'picker' },
];

const FRAME_PD_FIELDS: FieldConfig[] = [
  { key: 'aSize', label: 'A SIZE', placeholder: '52', suffix: 'mm', picker: { min: 40, max: 62, step: 1, precision: 0 } },
  { key: 'dbl', label: 'DBL (BRIDGE)', placeholder: '18', suffix: 'mm', picker: { min: 14, max: 24, step: 1, precision: 0 } },
  { key: 'patientPd', label: 'PATIENT PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD, defaultEntry: 'picker' },
];

const NEAR_PD_FIELDS: FieldConfig[] = [
  { key: 'distancePd', label: 'DISTANCE PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD, defaultEntry: 'picker' },
  { key: 'workingDistance', label: 'WORKING DIST', placeholder: '40', suffix: 'cm', picker: PICKER_WORK_DIST },
];

const BASE_CURVE_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER, defaultEntry: 'picker' },
];

const MAGNIFICATION_FIELDS: FieldConfig[] = [
  { key: 'power', label: 'BACK VERTEX', placeholder: '-6.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
  { key: 'centerThickness', label: 'CENTER THICK', placeholder: '2.0', suffix: 'mm', picker: PICKER_SMALL_MM },
  { key: 'frontCurve', label: 'FRONT CURVE', placeholder: '4.00', suffix: 'D', picker: { min: 0, max: 12, step: 0.50, precision: 2 }, defaultEntry: 'picker' },
  { key: 'refractiveIndex', label: 'REF INDEX', placeholder: '1.50', picker: PICKER_INDEX },
  { key: 'vertexDistance', label: 'VERTEX DIST', placeholder: '12', suffix: 'mm', picker: PICKER_VERTEX, defaultEntry: 'picker' },
];

const AS_WORN_FIELDS: FieldConfig[] = [
  { key: 'power', label: 'SPHERE POWER (D)', placeholder: '-4.00', suffix: 'D', picker: PICKER_SPHERE, defaultEntry: 'picker' },
  { key: 'tilt', label: 'PANTO TILT (°)', placeholder: '10', suffix: '°', picker: { min: 0, max: 25, step: 1, precision: 0 } },
  { key: 'refractiveIndex', label: 'INDEX (n)', placeholder: '1.50', picker: PICKER_INDEX },
];
```

- [ ] **Step 2: Pass `defaultEntry` to the Convert-hub ConversionInputs**

Still in `app/index.tsx`, find the `renderInput` switch. Modify the `case 'diopters'` and `case 'prism'` `<ConversionInput>` JSX blocks to add `defaultEntry="picker"`. Leave `case 'length'` unchanged (length entry stays keyboard-default).

Change in `case 'diopters'`:
```tsx
case 'diopters':
  return (
    <ConversionInput
      value={dioptersValue}
      onChangeValue={setDioptersValue}
      unit={dioptersUnit}
      onChangeUnit={setDioptersUnit}
      unitOptions={DIOPTER_OPTIONS}
      label="ENTER VALUE"
      picker={PICKER_SPHERE}
      defaultEntry="picker"
    />
  );
```

Change in `case 'prism'`:
```tsx
case 'prism':
  return (
    <ConversionInput
      value={prismValue}
      onChangeValue={setPrismValue}
      unit={prismUnit}
      onChangeUnit={setPrismUnit}
      unitOptions={PRISM_OPTIONS}
      label="ENTER PRISM"
      picker={{ min: 0, max: 30, step: 0.5, precision: 1 }}
      defaultEntry="picker"
    />
  );
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Smoke test**

On the dev server, open Rx Tools → Transpose. Tap a Sphere field — picker should open. Tap the small keyboard icon (⌨) — keyboard should appear and the field becomes editable. Type a number, tap outside, picker-default behaviour restored on next tap. Open Convert → Length & Power and confirm keyboard is still the primary tap. Open Convert and change the unit to "D" (this is the Diopters case actually — open Convert hub > the diopters category). Tap the field — picker opens.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx
git commit -m "Annotate stepped Rx fields as picker-default"
```

---

## Task 5: Smart-default + shared values in VertexInput

**Files:**
- Modify: `components/VertexInput.tsx`

- [ ] **Step 1: Add a smart-default field component and wire shared values**

Replace the entire contents of `components/VertexInput.tsx` with:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import ScrollPicker, { PickerConfig } from './ScrollPicker';
import { useSharedValues } from '../contexts/SharedValuesContext';

const PICKER_SPHERE: PickerConfig = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_CYLINDER: PickerConfig = { min: -10, max: 10, step: 0.25, precision: 2 };
const PICKER_AXIS: PickerConfig = { min: 1, max: 180, step: 1, precision: 0 };
const PICKER_VERTEX: PickerConfig = { min: 0, max: 20, step: 0.5, precision: 1 };

interface Props {
  power: string;
  onChangePower: (text: string) => void;
  cylinder: string;
  onChangeCylinder: (text: string) => void;
  axis: string;
  onChangeAxis: (text: string) => void;
  originalVertex: string;
  onChangeOriginalVertex: (text: string) => void;
  newVertex: string;
  onChangeNewVertex: (text: string) => void;
}

type PickerField = 'sphere' | 'cylinder' | 'axis' | 'fromVertex' | 'toVertex' | null;

const PICKER_MAP: Record<string, { config: PickerConfig; label: string; suffix?: string }> = {
  sphere: { config: PICKER_SPHERE, label: 'SPHERE', suffix: 'D' },
  cylinder: { config: PICKER_CYLINDER, label: 'CYLINDER', suffix: 'D' },
  axis: { config: PICKER_AXIS, label: 'AXIS', suffix: '°' },
  fromVertex: { config: PICKER_VERTEX, label: 'FROM VERTEX', suffix: 'mm' },
  toVertex: { config: PICKER_VERTEX, label: 'TO VERTEX', suffix: 'mm' },
};

// All five fields here are stepped, so all are picker-default.
const PICKER_DEFAULT_FIELDS: Set<NonNullable<PickerField>> = new Set([
  'sphere', 'cylinder', 'axis', 'fromVertex', 'toVertex',
]);

export default function VertexInput({
  power,
  onChangePower,
  cylinder,
  onChangeCylinder,
  axis,
  onChangeAxis,
  originalVertex,
  onChangeOriginalVertex,
  newVertex,
  onChangeNewVertex,
}: Props) {
  const { values: shared, setValue: setShared } = useSharedValues();

  // Hydrate empties from shared store on first mount.
  useEffect(() => {
    if (!power && shared.lastRx) onChangePower(shared.lastRx.sphere.toFixed(2));
    if (!cylinder && shared.lastRx) onChangeCylinder(shared.lastRx.cylinder.toFixed(2));
    if (!axis && shared.lastRx) onChangeAxis(String(shared.lastRx.axis));
    if (originalVertex === '12' && shared.vertexDistance != null) {
      onChangeOriginalVertex(shared.vertexDistance.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write back on every change (numeric values only).
  const writeRxIfComplete = (sph: string, cyl: string, ax: string) => {
    const s = parseFloat(sph);
    const c = parseFloat(cyl);
    const a = parseFloat(ax);
    if (!isNaN(s) && !isNaN(c) && !isNaN(a)) {
      setShared('lastRx', { sphere: s, cylinder: c, axis: a });
    }
  };

  const onPowerChange = (v: string) => {
    onChangePower(v);
    writeRxIfComplete(v, cylinder, axis);
  };
  const onCylinderChange = (v: string) => {
    onChangeCylinder(v);
    writeRxIfComplete(power, v, axis);
  };
  const onAxisChange = (v: string) => {
    onChangeAxis(v);
    writeRxIfComplete(power, cylinder, v);
  };
  const onFromChange = (v: string) => {
    onChangeOriginalVertex(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setShared('vertexDistance', n);
  };
  const onToChange = (v: string) => {
    onChangeNewVertex(v);
    // newVertex is the target; we do not write it to shared store.
  };

  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [editingField, setEditingField] = useState<PickerField>(null);
  const inputRefs = useRef<Partial<Record<NonNullable<PickerField>, TextInput | null>>>({});

  const fromVal = parseFloat(originalVertex);
  const toVal = parseFloat(newVertex);
  const glassesToContacts = isNaN(fromVal) || isNaN(toVal) ? true : fromVal >= toVal;
  const fromName = glassesToContacts ? 'Glasses' : 'Contacts';
  const toName = glassesToContacts ? 'Contacts' : 'Glasses';

  const swapDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevFrom = originalVertex;
    onFromChange(newVertex);
    onChangeNewVertex(prevFrom);
  };

  const getPickerValue = (): string => {
    switch (activePicker) {
      case 'sphere': return power;
      case 'cylinder': return cylinder;
      case 'axis': return axis;
      case 'fromVertex': return originalVertex;
      case 'toVertex': return newVertex;
      default: return '';
    }
  };

  const handlePickerSelect = (value: string) => {
    switch (activePicker) {
      case 'sphere': onPowerChange(value); break;
      case 'cylinder': onCylinderChange(value); break;
      case 'axis': onAxisChange(value); break;
      case 'fromVertex': onFromChange(value); break;
      case 'toVertex': onToChange(value); break;
    }
  };

  const focusInput = (field: NonNullable<PickerField>) => {
    setEditingField(field);
    setTimeout(() => inputRefs.current[field]?.focus(), 0);
  };

  const handleFieldTap = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field) && editingField !== field) {
      setActivePicker(field);
    } else {
      focusInput(field);
    }
  };

  const handleBlur = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field)) setEditingField(null);
  };

  // Render helper (NOT a component) — returning JSX from a function avoids
  // creating a new React component identity per render, which would unmount
  // the TextInput on every keystroke and break focus.
  const renderSmartField = (
    field: NonNullable<PickerField>,
    value: string,
    onValueChange: (text: string) => void,
    keyboardType: 'decimal-pad' | 'number-pad',
    placeholder: string
  ) => {
    const isPickerDefault = PICKER_DEFAULT_FIELDS.has(field);
    const inputInert = isPickerDefault && editingField !== field;
    return (
      <Pressable style={styles.inputRowSmall} onPress={() => handleFieldTap(field)}>
        <TextInput
          ref={(el) => { inputRefs.current[field] = el; }}
          style={styles.inputSmall}
          value={value}
          onChangeText={onValueChange}
          onBlur={() => handleBlur(field)}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
          pointerEvents={inputInert ? 'none' : 'auto'}
        />
        {isPickerDefault ? (
          <TouchableOpacity
            style={styles.iconBtnKbd}
            onPress={() => focusInput(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.iconKbdText}>⌨</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setActivePicker(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View style={styles.pickerIconBar} />
            <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
            <View style={styles.pickerIconBar} />
          </TouchableOpacity>
        )}
      </Pressable>
    );
  };

  const pickerInfo = activePicker ? PICKER_MAP[activePicker] : null;

  return (
    <View style={styles.container}>
      <View style={styles.rxRow}>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>SPHERE (D)</Text>
          {renderSmartField('sphere', power, onPowerChange, 'decimal-pad', '-4.00')}
        </View>
        <View style={styles.rxField}>
          <Text style={styles.sectionLabel}>CYLINDER (D)</Text>
          {renderSmartField('cylinder', cylinder, onCylinderChange, 'decimal-pad', '-1.50')}
        </View>
        <View style={styles.rxFieldSmall}>
          <Text style={styles.sectionLabel}>AXIS</Text>
          {renderSmartField('axis', axis, onAxisChange, 'number-pad', '90')}
        </View>
      </View>

      <Text style={styles.hint}>Leave Cylinder and Axis blank for sphere-only</Text>

      <View style={styles.vertexRow}>
        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>FROM VERTEX (mm)</Text>
          {renderSmartField('fromVertex', originalVertex, onFromChange, 'decimal-pad', '12')}
        </View>

        <Text style={styles.arrow}>→</Text>

        <View style={styles.vertexField}>
          <Text style={styles.sectionLabel}>TO VERTEX (mm)</Text>
          {renderSmartField('toVertex', newVertex, onToChange, 'decimal-pad', '0')}
        </View>
      </View>

      <TouchableOpacity
        style={styles.dirToggle}
        onPress={swapDirection}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Direction ${fromName} to ${toName}. Tap to reverse.`}
      >
        <Text style={styles.dirText}>
          {fromName} <Text style={styles.dirArrow}>→</Text> {toName}
        </Text>
        <View style={styles.dirSwapBadge}>
          <Text style={styles.dirSwapIcon}>⇄</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.dirHint}>Tap to reverse direction</Text>

      {pickerInfo && (
        <ScrollPicker
          visible={activePicker !== null}
          value={getPickerValue()}
          config={pickerInfo.config}
          label={pickerInfo.label}
          suffix={pickerInfo.suffix}
          onSelect={handlePickerSelect}
          onClose={() => setActivePicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  rxRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  rxField: { flex: 2 },
  rxFieldSmall: { flex: 1 },
  hint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  vertexRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  vertexField: { flex: 1 },
  arrow: {
    fontSize: 24,
    color: Colors.accent,
    marginBottom: Spacing.md,
    fontWeight: '300',
  },
  inputRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  inputSmall: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  dirToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
  },
  dirText: { ...Typography.bodyBold, color: Colors.textOnPrimary },
  dirArrow: { color: Colors.accentLight },
  dirSwapBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirSwapIcon: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
  dirHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  pickerBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  pickerIconBar: {
    width: 12,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: { width: 8, backgroundColor: Colors.accent },
  iconBtnKbd: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: { fontSize: 12, color: Colors.primary },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Smoke test**

On dev server, open Rx Tools → Vertex. Tap Sphere → picker opens. Tap ⌨ icon → keyboard appears, type a number, tap outside → picker-default restored. Enter sphere, cylinder, axis values. Switch to Rx Tools → Transpose. Sphere/cyl/axis should be pre-filled with the values entered in Vertex. Enter a vertex distance of 14mm in Vertex. Switch back later: vertex distance should persist if no other tool wrote to it.

- [ ] **Step 4: Commit**

```bash
git add components/VertexInput.tsx
git commit -m "Wire VertexInput to smart defaults and shared values"
```

---

## Task 6: Smart-default + shared refractive index in ThicknessInput

**Files:**
- Modify: `components/ThicknessInput.tsx`

- [ ] **Step 1: Apply smart-default to power; pull refractive index from shared store**

Replace the entire contents of `components/ThicknessInput.tsx` with:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { REFRACTIVE_INDICES } from '../utils/conversions';
import ScrollPicker, { PickerConfig } from './ScrollPicker';
import { useSharedValues } from '../contexts/SharedValuesContext';

const PICKER_POWER: PickerConfig = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_DIA: PickerConfig = { min: 40, max: 80, step: 1, precision: 0 };
const PICKER_MIN_T: PickerConfig = { min: 0.5, max: 5, step: 0.1, precision: 1 };

type PickerField = 'power' | 'diameter' | 'minThickness' | null;

// Power is the only stepped Rx-like value; diameter and min thickness are free.
const PICKER_DEFAULT_FIELDS: Set<NonNullable<PickerField>> = new Set(['power']);

interface Props {
  power: string;
  onChangePower: (text: string) => void;
  diameter: string;
  onChangeDiameter: (text: string) => void;
  refractiveIndex: number;
  onChangeRefractiveIndex: (value: number) => void;
  minThickness: string;
  onChangeMinThickness: (text: string) => void;
}

export default function ThicknessInput({
  power,
  onChangePower,
  diameter,
  onChangeDiameter,
  refractiveIndex,
  onChangeRefractiveIndex,
  minThickness,
  onChangeMinThickness,
}: Props) {
  const { values: shared, setValue: setShared } = useSharedValues();

  useEffect(() => {
    if (shared.refractiveIndex != null && shared.refractiveIndex !== refractiveIndex) {
      onChangeRefractiveIndex(shared.refractiveIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRefractiveIndex = (value: number) => {
    onChangeRefractiveIndex(value);
    setShared('refractiveIndex', value);
  };

  const [activePicker, setActivePicker] = useState<PickerField>(null);
  const [editingField, setEditingField] = useState<PickerField>(null);
  const inputRefs = useRef<Partial<Record<NonNullable<PickerField>, TextInput | null>>>({});

  const getPickerValue = () => {
    switch (activePicker) {
      case 'power': return power;
      case 'diameter': return diameter;
      case 'minThickness': return minThickness;
      default: return '';
    }
  };

  const handlePickerSelect = (value: string) => {
    switch (activePicker) {
      case 'power': onChangePower(value); break;
      case 'diameter': onChangeDiameter(value); break;
      case 'minThickness': onChangeMinThickness(value); break;
    }
  };

  const getPickerConfig = (): { config: PickerConfig; label: string; suffix?: string } => {
    switch (activePicker) {
      case 'power': return { config: PICKER_POWER, label: 'LENS POWER', suffix: 'D' };
      case 'diameter': return { config: PICKER_DIA, label: 'DIAMETER', suffix: 'mm' };
      case 'minThickness': return { config: PICKER_MIN_T, label: 'MIN THICKNESS', suffix: 'mm' };
      default: return { config: PICKER_POWER, label: '' };
    }
  };

  const focusInput = (field: NonNullable<PickerField>) => {
    setEditingField(field);
    setTimeout(() => inputRefs.current[field]?.focus(), 0);
  };

  const handleFieldTap = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field) && editingField !== field) {
      setActivePicker(field);
    } else {
      focusInput(field);
    }
  };

  const handleBlur = (field: NonNullable<PickerField>) => {
    if (PICKER_DEFAULT_FIELDS.has(field)) setEditingField(null);
  };

  // Render helper (NOT a component) — returning JSX from a function avoids
  // creating a new React component identity per render, which would unmount
  // the TextInput on every keystroke and break focus.
  const renderSmartField = (
    field: NonNullable<PickerField>,
    value: string,
    onValueChange: (text: string) => void,
    placeholder: string
  ) => {
    const isPickerDefault = PICKER_DEFAULT_FIELDS.has(field);
    const inputInert = isPickerDefault && editingField !== field;
    return (
      <Pressable style={styles.inputBox} onPress={() => handleFieldTap(field)}>
        <TextInput
          ref={(el) => { inputRefs.current[field] = el; }}
          style={styles.input}
          value={value}
          onChangeText={onValueChange}
          onBlur={() => handleBlur(field)}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.border}
          selectionColor={Colors.accent}
          pointerEvents={inputInert ? 'none' : 'auto'}
        />
        {isPickerDefault ? (
          <TouchableOpacity
            style={styles.iconBtnKbd}
            onPress={() => focusInput(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.iconKbdText}>⌨</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setActivePicker(field)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View style={styles.pickerIconBar} />
            <View style={[styles.pickerIconBar, styles.pickerIconBarShort]} />
            <View style={styles.pickerIconBar} />
          </TouchableOpacity>
        )}
      </Pressable>
    );
  };

  const pickerInfo = activePicker ? getPickerConfig() : null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>LENS POWER (D)</Text>
          {renderSmartField('power', power, onChangePower, '-3.00')}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>DIAMETER (mm)</Text>
          {renderSmartField('diameter', diameter, onChangeDiameter, '70')}
        </View>
      </View>

      <Text style={styles.label}>MATERIAL</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.materialRow}
      >
        {REFRACTIVE_INDICES.map((ri) => {
          const isActive = ri.value === refractiveIndex;
          return (
            <TouchableOpacity
              key={ri.value}
              style={[styles.materialChip, isActive && styles.materialChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                selectRefractiveIndex(ri.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.materialText, isActive && styles.materialTextActive]}>
                {ri.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>MIN THICKNESS (mm)</Text>
      {renderSmartField('minThickness', minThickness, onChangeMinThickness, '1.5')}

      {pickerInfo && (
        <ScrollPicker
          visible={activePicker !== null}
          value={getPickerValue()}
          config={pickerInfo.config}
          label={pickerInfo.label}
          suffix={pickerInfo.suffix}
          onSelect={handlePickerSelect}
          onClose={() => setActivePicker(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  field: { flex: 1 },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  input: {
    flex: 1,
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  materialRow: { gap: Spacing.xs, paddingBottom: Spacing.xs },
  materialChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  materialText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  materialTextActive: { color: Colors.textOnPrimary },
  pickerBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  pickerIconBar: {
    width: 12,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  pickerIconBarShort: { width: 8, backgroundColor: Colors.accent },
  iconBtnKbd: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconKbdText: { fontSize: 12, color: Colors.primary },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Smoke test**

In Lenses → Thickness, tap Lens Power → picker opens. Tap Diameter → keyboard appears. Tap a material chip (1.67). Switch to Lenses → Magnify. The REF INDEX field (in MAGNIFICATION_FIELDS) should still allow free entry; Magnify hasn't been wired to shared store yet — that's Task 9. The persistence is verified end-to-end in Task 9's smoke test.

- [ ] **Step 4: Commit**

```bash
git add components/ThicknessInput.tsx
git commit -m "Wire ThicknessInput to smart defaults and shared RI"
```

---

## Task 7: Smart-default in MaterialCompareView

**Files:**
- Modify: `components/MaterialCompareView.tsx`

This tool by design iterates over every refractive index for comparison, so the refractive-index shared value is not connected here. Only the smart-default entry change applies.

- [ ] **Step 1: Apply smart-default for power; leave diameter and min-thickness as keyboard-default**

In `components/MaterialCompareView.tsx`, locate the existing `PickerField` type and the `PickerButton` component near the top of the file. Below the `PickerField` type alias, add:

```ts
const PICKER_DEFAULT_FIELDS: Set<NonNullable<PickerField>> = new Set(['power']);
```

Inside the component body, after the existing `const [activePicker, setActivePicker] = useState<PickerField>(null);` line, add:

```ts
const [editingField, setEditingField] = useState<PickerField>(null);
const inputRefs = useRef<Partial<Record<NonNullable<PickerField>, TextInput | null>>>({});

const focusInput = (field: NonNullable<PickerField>) => {
  setEditingField(field);
  setTimeout(() => inputRefs.current[field]?.focus(), 0);
};

const handleFieldTap = (field: NonNullable<PickerField>) => {
  if (PICKER_DEFAULT_FIELDS.has(field) && editingField !== field) {
    setActivePicker(field);
  } else {
    focusInput(field);
  }
};

const handleBlur = (field: NonNullable<PickerField>) => {
  if (PICKER_DEFAULT_FIELDS.has(field)) setEditingField(null);
};
```

Add the `useRef` import: change the existing import line `import React, { useState, useMemo } from 'react';` to:

```tsx
import React, { useMemo, useRef, useState } from 'react';
```

Add `Pressable` to the React Native import: change `import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';` to:

```tsx
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
```

Replace the JSX for the three power/diameter/min-thickness input boxes (the three `<View style={styles.inputBox}>...</View>` blocks containing `<TextInput>` + `<PickerButton field=... />`) with calls to a render helper. Below the existing `PickerButton` definition, add this **function** (not a component — returning JSX from a function avoids creating a new React component identity per render, which would unmount the TextInput on every keystroke and break focus):

```tsx
const renderSmartField = (
  field: NonNullable<PickerField>,
  value: string,
  onValueChange: (text: string) => void,
  placeholder: string
) => {
  const isPickerDefault = PICKER_DEFAULT_FIELDS.has(field);
  const inputInert = isPickerDefault && editingField !== field;
  return (
    <Pressable style={styles.inputBox} onPress={() => handleFieldTap(field)}>
      <TextInput
        ref={(el) => { inputRefs.current[field] = el; }}
        style={styles.input}
        value={value}
        onChangeText={onValueChange}
        onBlur={() => handleBlur(field)}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={Colors.border}
        selectionColor={Colors.accent}
        pointerEvents={inputInert ? 'none' : 'auto'}
      />
      {isPickerDefault ? (
        <TouchableOpacity
          style={styles.iconBtnKbd}
          onPress={() => focusInput(field)}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={styles.iconKbdText}>⌨</Text>
        </TouchableOpacity>
      ) : (
        <PickerButton field={field} />
      )}
    </Pressable>
  );
};
```

Replace the three power/diameter/min-thickness JSX blocks. Find:

```tsx
<View style={styles.field}>
  <Text style={styles.label}>LENS POWER (D)</Text>
  <View style={styles.inputBox}>
    <TextInput
      style={styles.input}
      value={power}
      onChangeText={setPower}
      keyboardType="decimal-pad"
      placeholder="-4.00"
      placeholderTextColor={Colors.border}
      selectionColor={Colors.accent}
    />
    <PickerButton field="power" />
  </View>
</View>
```

Replace with:

```tsx
<View style={styles.field}>
  <Text style={styles.label}>LENS POWER (D)</Text>
  {renderSmartField('power', power, setPower, '-4.00')}
</View>
```

Repeat for `diameter` (placeholder `"70"`) and `minThickness` (placeholder `"1.5"`):

```tsx
<View style={styles.field}>
  <Text style={styles.label}>DIAMETER (mm)</Text>
  {renderSmartField('diameter', diameter, setDiameter, '70')}
</View>
```

```tsx
<Text style={styles.label}>MIN THICKNESS (mm)</Text>
{renderSmartField('minThickness', minThickness, setMinThickness, '1.5')}
```

Add two new styles at the bottom of the `styles = StyleSheet.create({...})` object, before the closing brace:

```ts
iconBtnKbd: {
  width: 24,
  height: 24,
  borderRadius: 5,
  backgroundColor: Colors.surfaceAlt,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: Colors.border,
},
iconKbdText: { fontSize: 12, color: Colors.primary },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Smoke test**

Open Lenses → Materials. Tap Lens Power → picker opens. Tap Diameter → keyboard. Tap Min Thickness → keyboard.

- [ ] **Step 4: Commit**

```bash
git add components/MaterialCompareView.tsx
git commit -m "Wire MaterialCompareView to smart-default entry"
```

---

## Task 8: Smart-default + shared working distance in NearAddView

**Files:**
- Modify: `components/NearAddView.tsx`

This view uses `FieldGroup`, so the smart-default plumbing is already in place via Task 2. We just need to annotate the FIELDS array and wire the shared store.

- [ ] **Step 1: Annotate FIELDS and integrate shared values**

Replace the entire contents of `components/NearAddView.tsx` with:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import {
  accommodativeDemand,
  hofstetterAmplitude,
  tentativeAdd,
  balanceAdd,
  roundToStep,
  formatNumber,
} from '../utils/conversions';
import FieldGroup, { FieldConfig } from './FieldGroup';
import { useSharedValues } from '../contexts/SharedValuesContext';

const FIELDS: FieldConfig[] = [
  { key: 'workingDistance', label: 'WORKING DIST (cm)', placeholder: '40', suffix: 'cm', picker: { min: 20, max: 100, step: 5, precision: 0 } },
  { key: 'age', label: 'AGE (yrs)', placeholder: '45', suffix: 'yr', picker: { min: 5, max: 90, step: 1, precision: 0 } },
  { key: 'tentativeAdd', label: 'TENTATIVE ADD (D)', placeholder: '+2.00', suffix: 'D', picker: { min: 0, max: 4, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
  { key: 'nra', label: 'NRA (+D)', placeholder: '+2.00', suffix: 'D', picker: { min: 0, max: 3, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
  { key: 'pra', label: 'PRA (−D)', placeholder: '-2.00', suffix: 'D', picker: { min: -4, max: 0, step: 0.25, precision: 2 }, defaultEntry: 'picker' },
];

interface ResultRow {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}

export default function NearAddView() {
  const { values: shared, setValue: setShared } = useSharedValues();
  const initialWd = shared.workingDistance != null ? String(shared.workingDistance) : '40';
  const [values, setValues] = useState<Record<string, string>>({ workingDistance: initialWd });

  // Keep workingDistance in shared store as the user edits it.
  useEffect(() => {
    const wd = parseFloat(values.workingDistance);
    if (!isNaN(wd)) setShared('workingDistance', wd);
  }, [values.workingDistance, setShared]);

  const onChange = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const { rows, warning } = useMemo(() => {
    const wd = parseFloat(values.workingDistance);
    const age = parseFloat(values.age);
    const enteredTent = parseFloat(values.tentativeAdd);
    const nra = parseFloat(values.nra);
    const pra = parseFloat(values.pra);

    const demand = !isNaN(wd) && wd > 0 ? accommodativeDemand(wd) : null;
    const amp = !isNaN(age) ? hofstetterAmplitude(age) : null;
    const suggested =
      demand != null && amp ? roundToStep(tentativeAdd(demand, amp.min), 0.25) : null;
    const tentUsed = !isNaN(enteredTent) ? enteredTent : suggested;
    const mid = !isNaN(nra) && !isNaN(pra) ? (nra + pra) / 2 : null;
    const balanced =
      tentUsed != null && mid != null ? roundToStep(balanceAdd(tentUsed, nra, pra), 0.25) : null;

    const rows: ResultRow[] = [];
    if (demand != null) {
      rows.push({
        label: 'Accommodative demand',
        value: `${formatNumber(demand, 2)} D`,
        hint: `1 ÷ ${formatNumber(wd / 100, 2)} m`,
      });
    }
    if (amp) {
      rows.push({
        label: 'Amplitude (Hofstetter min)',
        value: `${formatNumber(amp.min, 2)} D`,
        hint: `avg ${formatNumber(amp.avg, 1)} · ½ reserve ${formatNumber(amp.min / 2, 2)} D`,
      });
    }
    if (suggested != null) {
      rows.push({
        label: 'Suggested tentative add',
        value: `+${formatNumber(suggested, 2)} D`,
        hint: 'demand − ½ min amplitude',
      });
    }
    if (mid != null && tentUsed != null) {
      rows.push({
        label: 'NRA/PRA balance',
        value: `${mid >= 0 ? '+' : ''}${formatNumber(mid, 2)} D`,
        hint: '(NRA + PRA) ÷ 2',
      });
      rows.push({
        label: 'Balanced add',
        value: `+${formatNumber(balanced ?? 0, 2)} D`,
        hint: `tentative ${formatNumber(tentUsed, 2)} + balance`,
        emphasis: true,
      });
    }

    let warning: string | null = null;
    if (!isNaN(nra) && tentUsed != null && nra > tentUsed + 0.001) {
      warning = 'NRA exceeds the add — the tentative add may be too high (over-plussed).';
    }

    return { rows, warning };
  }, [values]);

  return (
    <View style={styles.container}>
      <FieldGroup fields={FIELDS} values={values} onChange={onChange} columns={2} />

      {rows.length > 0 ? (
        <View style={styles.card}>
          {rows.map((r, i) => (
            <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder, r.emphasis && styles.rowEmphasis]}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowLabel, r.emphasis && styles.rowLabelEmphasis]}>{r.label}</Text>
                {r.hint && <Text style={[styles.rowHint, r.emphasis && styles.rowHintEmphasis]}>{r.hint}</Text>}
              </View>
              <Text style={[styles.rowValue, r.emphasis && styles.rowValueEmphasis]}>{r.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Enter a working distance to begin</Text>
        </View>
      )}

      {warning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠ {warning}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Enter age for an amplitude-based tentative add, or type your own. Add NRA (max plus) and PRA
        (max minus) to refine: Final Add = Tentative + (NRA + PRA) ÷ 2. A well-balanced add has
        NRA + PRA near zero.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.sm, gap: Spacing.sm },
  card: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  rowEmphasis: { backgroundColor: Colors.primary },
  rowLeft: { flex: 1 },
  rowLabel: { ...Typography.label, color: Colors.text },
  rowLabelEmphasis: { color: Colors.textOnPrimary },
  rowHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  rowHintEmphasis: { color: Colors.accentLight },
  rowValue: { ...Typography.result, color: Colors.text, fontVariant: ['tabular-nums'] },
  rowValueEmphasis: { color: Colors.textOnPrimary, fontWeight: '700' },
  emptyCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
  warningBox: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.sm,
  },
  warningText: { fontSize: 12, color: Colors.error, fontWeight: '500' },
  footer: {
    marginHorizontal: Spacing.md,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/NearAddView.tsx
git commit -m "Wire NearAddView to smart defaults and shared working distance"
```

---

## Task 9: Shared values for app/index.tsx tools using FieldGroup

This task wires the FieldGroup-based tools in `app/index.tsx` into the shared store. The affected tools are:
- `mbs`, `framePd`, `nearPd` → `patientPd` (and `nearPd` also reads/writes `workingDistance` + `distancePd` as `patientPd`)
- `transpose`, `sphEquiv`, `baseCurve` → `lastRx`
- `magnification` → `vertexDistance`, `refractiveIndex`, plus `power` as `lastRx.sphere`
- `asWorn` → `refractiveIndex`, plus `power` as `lastRx.sphere`

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Import the shared-values hook and add a hydration effect**

At the top of `app/index.tsx`, add the import:

```tsx
import { useSharedValues, SharedRx } from '../contexts/SharedValuesContext';
```

Inside `HomeScreen()`, immediately after the existing line `const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});`, add:

```tsx
const { values: shared, setValue: setShared } = useSharedValues();

// Hydrate the just-selected category's shared fields from the shared store,
// but only when the field is empty (don't overwrite the user's entry).
// Runs on initial mount (initial category) and on every category change.
useEffect(() => {
  const cat = category;
  const pdStr = shared.patientPd != null ? shared.patientPd.toFixed(1) : undefined;
  const wdStr = shared.workingDistance != null ? String(shared.workingDistance) : undefined;
  const riStr = shared.refractiveIndex != null ? shared.refractiveIndex.toFixed(2) : undefined;
  const vdStr = shared.vertexDistance != null ? shared.vertexDistance.toFixed(1) : undefined;
  const rx: { sphere: string; cylinder: string; axis: string } | null = shared.lastRx
    ? {
        sphere: shared.lastRx.sphere.toFixed(2),
        cylinder: shared.lastRx.cylinder.toFixed(2),
        axis: String(shared.lastRx.axis),
      }
    : null;

  const additions: Record<string, string> = {};
  const tryAdd = (key: string, val: string | undefined) => {
    if (val && !fieldValues[cat]?.[key]) additions[key] = val;
  };

  if (cat === 'mbs' || cat === 'framePd') tryAdd('patientPd', pdStr);
  if (cat === 'nearPd') {
    tryAdd('distancePd', pdStr);
    tryAdd('workingDistance', wdStr);
  }
  if (rx) {
    if (cat === 'transpose') {
      tryAdd('sphere', rx.sphere);
      tryAdd('cylinder', rx.cylinder);
      tryAdd('axis', rx.axis);
    }
    if (cat === 'sphEquiv' || cat === 'baseCurve') {
      tryAdd('sphere', rx.sphere);
      tryAdd('cylinder', rx.cylinder);
    }
    if (cat === 'magnification' || cat === 'asWorn') {
      tryAdd('power', rx.sphere);
    }
  }
  if (cat === 'magnification') {
    tryAdd('refractiveIndex', riStr);
    tryAdd('vertexDistance', vdStr);
  }
  if (cat === 'asWorn') tryAdd('refractiveIndex', riStr);

  if (Object.keys(additions).length > 0) {
    setFieldValues((prev) => ({
      ...prev,
      [cat]: { ...(prev[cat] ?? {}), ...additions },
    }));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [category]);
```

Also add `useEffect` to the existing React import line at the top. The current line is:
```tsx
import React, { useState, useMemo, useCallback } from 'react';
```
Change it to:
```tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
```

- [ ] **Step 2: Mirror writes back to the shared store**

Find the existing `setFieldVal` definition (immediately after the `getFieldVal` definition). Replace it with:

```tsx
const setFieldVal = useCallback(
  (cat: string, key: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [key]: value },
    }));

    // Mirror shared values back to the context so other tools see them.
    const num = parseFloat(value);
    if (isNaN(num)) return;

    if ((cat === 'mbs' || cat === 'framePd') && key === 'patientPd') {
      setShared('patientPd', num);
    } else if (cat === 'nearPd' && key === 'distancePd') {
      setShared('patientPd', num);
    } else if (cat === 'nearPd' && key === 'workingDistance') {
      setShared('workingDistance', num);
    } else if (cat === 'magnification' && key === 'vertexDistance') {
      setShared('vertexDistance', num);
    } else if ((cat === 'magnification' || cat === 'asWorn') && key === 'refractiveIndex') {
      setShared('refractiveIndex', num);
    }
  },
  [setShared]
);
```

Below `setFieldVal`, find the existing `makeOnChange`. Just after it, add a helper that captures full-Rx writes when the relevant tool has all three fields filled:

```tsx
const captureRxFromCategory = useCallback(
  (cat: string) => {
    const fields = fieldValues[cat] ?? {};
    const s = parseFloat(fields.sphere);
    const c = parseFloat(fields.cylinder);
    const a = parseFloat(fields.axis ?? '0');
    if (!isNaN(s) && !isNaN(c)) {
      setShared('lastRx', {
        sphere: s,
        cylinder: c,
        axis: isNaN(a) ? 0 : a,
      });
    }
  },
  [fieldValues, setShared]
);

useEffect(() => {
  // Capture Rx when transpose/sphEquiv/baseCurve are edited.
  captureRxFromCategory('transpose');
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fieldValues.transpose]);
useEffect(() => {
  captureRxFromCategory('sphEquiv');
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fieldValues.sphEquiv]);
useEffect(() => {
  captureRxFromCategory('baseCurve');
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fieldValues.baseCurve]);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Smoke test**

Open Fitting → Frame PD. Enter Patient PD = 64. Switch via the drawer to Fitting → Near PD. The Distance PD field should be 64. Change it to 62. Switch back to Frame PD via the drawer — Patient PD should now read 62. In Rx Tools → Transpose, enter Sphere −2.00, Cyl −1.50, Axis 90. Switch to Rx Tools → Sph Equiv — Sphere and Cylinder pre-fill. In Lenses → Magnify, the BACK VERTEX (power) field shows −2.00. Cold-restart the app — everything resets to blanks.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx
git commit -m "Wire FieldGroup tools in HomeScreen to shared values"
```

---

## Task 10: Tool picker bottom sheet

**Files:**
- Create: `components/ToolPickerSheet.tsx`

- [ ] **Step 1: Create the component**

Create `components/ToolPickerSheet.tsx` with this exact content:

```tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';
import { Category, Hub, CategoryConfig, CATEGORIES } from '../utils/conversions';

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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ToolPickerSheet.tsx
git commit -m "Add ToolPickerSheet component"
```

---

## Task 11: Tappable header title button

**Files:**
- Create: `components/HeaderTitleButton.tsx`

- [ ] **Step 1: Create the component**

Create `components/HeaderTitleButton.tsx` with this exact content:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/HeaderTitleButton.tsx
git commit -m "Add HeaderTitleButton component"
```

---

## Task 12: Wire header dropdown, remove ModeTabs

**Files:**
- Modify: `app/index.tsx`
- Delete: `components/ModeTabs.tsx`

- [ ] **Step 1: Remove ModeTabs import and add the new ones**

In `app/index.tsx`, find:

```tsx
import ModeTabs from '../components/ModeTabs';
```

Replace with:

```tsx
import HeaderTitleButton from '../components/HeaderTitleButton';
import ToolPickerSheet from '../components/ToolPickerSheet';
```

- [ ] **Step 2: Add sheet-visible state**

Inside `HomeScreen()`, after `const [drawerOpen, setDrawerOpen] = useState(false);`, add:

```tsx
const [toolSheetOpen, setToolSheetOpen] = useState(false);
```

Also derive the tool's display label from the current category. Just after the existing `const currentLabel = currentHub.title;` line, add:

```tsx
const currentToolLabel = currentHub.items.find((i) => i.key === category)?.label ?? currentHub.title;
const hasMultipleTools = currentHub.items.length > 1;
```

- [ ] **Step 3: Replace the header title and remove ModeTabs from layout**

Find this block in the JSX:

```tsx
<View style={styles.headerCenter}>
  <Text style={styles.headerTitle}>{currentLabel}</Text>
</View>
```

Replace with:

```tsx
<View style={styles.headerCenter}>
  <HeaderTitleButton
    hubTitle={currentHub.title}
    toolLabel={currentToolLabel}
    hasMultiple={hasMultipleTools}
    onPress={() => setToolSheetOpen(true)}
  />
</View>
```

Then find this block (just below the DrawerMenu):

```tsx
{/* Sub-tool mode tabs for the current hub */}
{currentHub.items.length > 1 && (
  <ModeTabs
    items={currentHub.items}
    selected={category}
    onSelect={handleSelectTool}
  />
)}
```

Replace the entire block with the sheet at the same spot:

```tsx
{/* Sub-tool picker sheet */}
<ToolPickerSheet
  visible={toolSheetOpen}
  hub={currentHub}
  selected={category}
  onSelect={handleSelectTool}
  onClose={() => setToolSheetOpen(false)}
/>
```

- [ ] **Step 4: Remove unused styles**

In the styles block at the bottom of `app/index.tsx`, the `headerTitle` and `headerCenter` styles will be used differently now — leave `headerCenter` as is (it still wraps the new button) and **delete** the `headerTitle` style because it's no longer referenced.

- [ ] **Step 5: Delete ModeTabs.tsx**

```bash
git rm components/ModeTabs.tsx
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Smoke test (golden paths)**

On dev server:
1. Open the app — drawer hamburger is still there. Tap the title in the header ("Convert / Length & Power ▾") — bottom sheet appears with Prism, Length & Power, Radius ↔ Power.
2. Pick Prism — sheet closes, calculator switches, header reads "Convert / Prism Angles ▾".
3. Open the drawer → switch to Reference. Header reads only "Reference" (no chevron). Tapping the title does nothing.
4. Open the drawer → switch to Rx Tools. Header reads "Rx Tools / Transpose ▾". Tap title → sheet shows Transpose / Sph Equiv / Vertex / As-Worn.
5. Swipe-down or tap outside the sheet → sheet closes without switching tools.

- [ ] **Step 8: Commit**

```bash
git add app/index.tsx
git commit -m "Replace ModeTabs with header dropdown nav"
```

---

## Task 13: Final verification and cleanup

**Files:**
- (none modified — verification only)

- [ ] **Step 1: Project health**

Run:
```bash
npx tsc --noEmit
npx expo-doctor
```
Expected: tsc clean. expo-doctor 21/21.

- [ ] **Step 2: Full manual smoke pass**

On the dev server, walk through each hub:

- **Convert** — Length & Power: keyboard primary on length, picker via wheel icon. Diopters / Prism: picker primary, ⌨ icon opens keyboard.
- **Rx Tools** — Transpose / Sph Equiv / Vertex / As-Worn: all primary Rx fields (sphere/cyl/axis/power) open picker on tap; keyboard via ⌨ icon. Editing in Transpose then opening Sph Equiv pre-fills sphere/cyl.
- **Lenses** — Thickness: power picker-default; switching material chip updates the shared refractive index; visiting Magnify shows it reflected in REF INDEX (won't change material display until the user enters Thickness again — that's expected, Magnify hydrates on first open).
- **Prism** — Decenter / Compound / Prentice work as before.
- **Fitting** — Patient PD entered in Frame PD pre-fills MBS and Near PD on next open.
- **Refraction** — Near Add working distance persists; visiting Near PD shows it (since Near PD also reads `workingDistance`).
- **Reference** — Header shows only "Reference", no chevron, non-tappable.

- [ ] **Step 3: Visual regression check**

Compare against the previous build. Confirm:
- Header layout still readable.
- No ghost pill row under the header.
- All calculations produce the same numbers as before (this change does not touch any math).

- [ ] **Step 4: Final commit (if any cleanup needed)**

If everything is clean, no commit needed. If any leftover styling issue, fix and commit:

```bash
git add -A
git commit -m "Final cleanup after UX polish bundle"
```

- [ ] **Step 5: Bump version**

Edit `app.json`: change `"version": "1.0.1"` to `"version": "1.1.0"` (minor bump — the bundle adds user-visible features). Commit:

```bash
git add app.json
git commit -m "Bump version to 1.1.0"
```

---

## Self-Review Notes

- **Spec coverage**: Every spec section maps to tasks. Header dropdown → Tasks 10/11/12. Persistence → Tasks 1, 5, 6, 8, 9. Smart defaults → Tasks 2, 3, 4, 5, 6, 7, 8.
- **Type consistency**: `SharedRx { sphere, cylinder, axis }` used consistently in Task 1 (define), Task 5 (Vertex writes), Task 9 (HomeScreen writes/reads).
- **Placeholder scan**: No TBDs. All code blocks are complete.
- **Out of scope per spec, deferred**: search, favorites/recents, preset chips, Rx string parsing, AsyncStorage persistence, hub structure changes, bottom tab bar, hub icons.
