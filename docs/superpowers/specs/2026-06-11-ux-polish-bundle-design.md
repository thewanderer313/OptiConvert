# UX Polish Bundle: Header Nav + Persistence + Smart Defaults

**Date:** 2026-06-11
**Status:** Draft for review

## Goal

Reduce three forms of friction the user has hit while operating OptiConvert:

1. **Sub-tool navigation feels inelegant.** The horizontal pill scroll (`ModeTabs`) under the header reads as a generic tab strip and gets in the way visually.
2. **Repeated data entry across tools.** Values like patient PD and vertex distance must be re-typed every time the user switches calculators.
3. **Data entry friction per field.** Every numeric field offers both a keyboard and a scroll picker, but the keyboard is always the default tap target — even for fields whose values are inherently stepped (sphere, cylinder, axis).

The hub-level structure (drawer of 7 hubs) and the dual-input model (keyboard + picker on every field) both stay — only the *defaults* and the *intra-hub navigation* change.

## Scope

Three pieces, all shippable together as one bundle:

1. **Header dropdown navigation** — replaces `ModeTabs`
2. **Cross-tool value persistence** — shared in-memory store for 5 commonly-reused values
3. **Smart-default entry per field type** — stepped fields open picker on tap; free fields open keyboard on tap; both remain accessible on every field

### Explicitly out of scope

- Search / command palette
- Favorites / recents
- Preset chips
- Rx string parsing ("paste Rx")
- Persistence across app restarts (AsyncStorage)
- Hub structure changes / bottom tab bar
- Visual hub icons
- Any UX changes inside the calculators themselves (results display, learning mode, etc.)

---

## Piece 1: Header dropdown navigation

### Behavior

The header title becomes a tappable button that opens a bottom sheet listing the current hub's sub-tools.

- Title format: `[Tool Name] ▾` with a small `[Hub Name]` line above it in a secondary text style.
- Tap title or chevron → bottom sheet slides up.
- Sheet shows the hub's sub-tools as a vertical list with one-line descriptions (same descriptions currently used in the drawer items).
- Tap a sub-tool → sheet closes, calculator switches.
- Tap outside the sheet or pull down to dismiss.
- For hubs with a single sub-tool (`reference`), the title renders without a chevron and is non-interactive.

### Layout impact

The `ModeTabs` strip is removed from `app/index.tsx`. The header gains a small amount of vertical padding to accommodate the two-line label (hub name above, tool name below). Net vertical space saved: ~44 px (the height of the old tabs bar).

### Components

| File | Action | Purpose |
|---|---|---|
| `components/HeaderTitleButton.tsx` | new | Renders the two-line tappable title with chevron; non-interactive when only one sub-tool exists |
| `components/ToolPickerSheet.tsx` | new | Bottom-sheet `Modal` listing sub-tools with descriptions; reuses styling cues from `DrawerMenu` |
| `app/index.tsx` | modified | Replace `<ModeTabs>` with `<HeaderTitleButton>` + `<ToolPickerSheet>`; rework header layout |
| `components/ModeTabs.tsx` | deleted | No longer used |

### Data flow

The same `category` state in `HomeScreen` is read by `HeaderTitleButton` (for the title text via the hub lookup) and written by `ToolPickerSheet.onSelect`. No new state shape required.

---

## Piece 2: Cross-tool value persistence

### Shared values (session-scoped)

| Key | Type | Tools that read/write it |
|---|---|---|
| `patientPd` | `number \| null` | MBS, Frame PD, Near PD |
| `vertexDistance` | `number \| null` | Vertex (`vertexOriginal`), As-Worn, Magnification |
| `refractiveIndex` | `number \| null` | Thickness, Magnification, As-Worn, Materials view |
| `workingDistance` | `number \| null` | Near PD, Near Add view |
| `lastRx` | `{ sphere: number; cylinder: number; axis: number } \| null` | Transpose, Vertex, Sph Equiv, Base Curve, Magnification |

**Storage**: React Context, in-memory only. Resets on app restart.

**Rationale for not persisting across restarts**: most of these are per-patient values (PD, vertex, Rx). Persisting them invites the "yesterday's patient" bug — opening the app and seeing PD = 64 from someone else. Refractive index and working distance are arguably preferences and could be persisted, but mixing two persistence models is a worse outcome than session-only across the board. A future "Preferences" screen can add stable defaults if needed.

### Read/write semantics

- **Read**: when a tool's input component mounts and the corresponding field is empty, it initializes from the shared store. If the user has already typed a different value in that tool, the shared value is *not* overlaid (no clobbering local state).
- **Write**: when the user changes a shared-value field, the new number is written to the store synchronously alongside the local state update. Other tools using the same key will see the new value on their next mount.
- **Clear**: not exposed in v1. Resetting requires app restart.

### Components

| File | Action | Purpose |
|---|---|---|
| `contexts/SharedValuesContext.tsx` | new | Provider + `useSharedValues()` hook returning `{ values, setValue }` |
| `app/_layout.tsx` | modified | Wrap `<Stack>` in `<SharedValuesProvider>` |
| `app/index.tsx` | modified | Replace local `useState` defaults for shared fields with shared-store reads |
| (per-view components for As-Worn, Magnification, Materials, Near Add, Frame PD, Near PD that own their own state) | modified | Same pattern: read from store as initial value, write on change |

### v1 visual treatment

No special hint that a value came from the shared store — it just appears in the field. A small "↻ shared" affordance can be added later if it proves needed. This keeps the visual diff minimal.

---

## Piece 3: Smart-default entry per field type

### Rule

Every numeric input keeps both entry methods. What changes is the *primary* tap target:

| Field type | Primary tap | Secondary access |
|---|---|---|
| **Stepped** — sphere/cyl (0.25D), axis (1°), PD (0.5mm), K readings (0.25D), small mm steps | Tap field area → scroll picker | Small keyboard icon in field box |
| **Free** — lengths, distances, working distance, percentages, large mm values (e.g., lens diameter), refractive index entered as decimal | Tap field area → keyboard (current behavior) | Small picker icon in field box (current behavior) |

### Detection

`FieldConfig` and `ConversionInput`'s prop shape gain:

```ts
defaultEntry?: 'picker' | 'keyboard'; // default: 'keyboard'
```

Fields explicitly mark themselves. Heuristic-based detection (e.g., "step ≤ 0.5 → picker") is rejected as too fragile — refractive index has step 0.01 but the user usually wants to type it.

**Mental model:** values you'd read off a prescription or measurement device in discrete clinical steps default to the picker. Free-typed measurements (mm, cm, index decimals) default to the keyboard.

Picker default (`defaultEntry: 'picker'`):
- Sphere, cylinder, axis, prescription power — every tool (Transpose, Sph Equiv, Vertex, As-Worn, Base Curve, Magnification, Prentice, Thickness)
- K readings — k1, k2, k1Axis, k2Axis (Javal)
- PD values — patientPd in MBS, Frame PD, Near PD; distancePd in Near PD
- Vertex distance — Vertex tool (both vertexOriginal and vertexNew), wherever else it appears
- Decentration — Prentice
- Front curve — Magnification
- Prism value — Convert > Prism tool
- Diopter value — Convert > Diopters tool (picker config is `PICKER_SPHERE`)

Keyboard default (`defaultEntry: 'keyboard'`, the default):
- Length input — Convert > Length & Power
- Lens diameter — Thickness
- Frame measurements — A size, DBL (Frame PD), ED + framePd (MBS)
- Refractive index — everywhere it appears
- Working distance — Near PD
- Minimum thickness — Thickness
- Pantoscopic tilt — As-Worn

### Components touched

| File | Action |
|---|---|
| `components/FieldGroup.tsx` | modified — wrap input in a `TouchableOpacity` (or `Pressable`) when `defaultEntry === 'picker'`; render a secondary keyboard-toggle icon instead of the wheel icon |
| `components/ConversionInput.tsx` | modified — same treatment |
| `app/index.tsx` (`*_FIELDS` arrays, the Length/Diopters/Prism `picker` props) | modified — annotate which fields are `defaultEntry: 'picker'` |
| `components/VertexInput.tsx`, `components/ThicknessInput.tsx` | modified — same field-by-field default-entry annotations applied to whichever fields they own |

### Behavioural detail

When `defaultEntry: 'picker'`:
- The visible `TextInput` is wrapped in a `Pressable` overlay that intercepts taps and opens the picker, so the user cannot focus the input directly with a single tap.
- The secondary icon becomes a small **keyboard** glyph (replacing the wheel glyph) — tapping it focuses the `TextInput` so the OS keyboard appears.
- The wheel modal's existing manual-entry `TextInput` continues to work, so typing remains possible from within the picker too.

When `defaultEntry: 'keyboard'` (current behavior preserved):
- Tap on `TextInput` → keyboard focuses.
- Tap on wheel icon → picker opens.

---

## Testing & verification

### Static
- `npx tsc --noEmit` clean.
- `npx expo-doctor` 21/21.

### Manual (golden paths)

**Piece 1 — Header dropdown:**
- Open Rx Tools, header reads `Rx Tools / Transpose ▾`. Tap title → sheet appears listing Transpose, Sph Equiv, Vertex, As-Worn. Pick Vertex → sheet closes, calculator switches, header reads `Rx Tools / Vertex ▾`.
- Switch hubs via the drawer to Reference. Header reads `Reference` with no chevron and is non-tappable.
- Swipe down on an open sheet dismisses it without changing tool.

**Piece 2 — Persistence:**
- In Frame PD, enter Patient PD = 64. Open the drawer, switch to Fitting > Near PD. Patient PD field shows 64 (not blank, not placeholder).
- In Near PD, change PD to 62. Go back to Frame PD via header dropdown (after switching hubs back). Patient PD reads 62.
- In Vertex, enter vertex distance 14. Switch to As-Worn or Magnification — if those tools have a vertex distance field, it pre-fills with 14.
- Cold-restart the app. Patient PD field is blank again (no cross-restart carry).

**Piece 3 — Smart defaults:**
- In Transpose, tap the Sphere field area — picker opens. Tap the small keyboard icon in the same field — OS keyboard appears with focus.
- In Length (Convert hub, length tool), tap the length input — keyboard appears. Tap the wheel icon — picker opens.
- In every multi-field form (Javal, MBS, Frame PD, etc.), confirm each field's behavior matches its annotation.

### Regression
- All existing calculations still produce identical results — these changes are purely entry/navigation, no math touched.
- Learning mode toggle still works in every tool.
- Drawer still opens and selects hubs correctly.
- ScrollPicker's typed-entry path still clamps to range and snaps to step.

---

## Open implementation questions

(None blocking — listed for awareness during plan-writing.)

1. **Header height**: with a two-line title, is the current header tall enough, or does it need `paddingVertical` bumped? Decide during implementation by visual check.
2. **`ToolPickerSheet` vs `DrawerMenu` styling**: both are list-style choosers. Should they share a `ListSheet` primitive? Probably yes if it costs <50 lines of factoring; otherwise just copy the pattern.
3. **Sheet animation**: native `Modal animationType="slide"` is the simplest. If it feels janky, consider a reanimated sheet — but not in this bundle's scope.

---

## Out-of-scope follow-ups (for future specs)

These ideas came up in brainstorming but were deliberately deferred:

- **Search / command palette** across all tools
- **Favorites + Recents** strip in the drawer
- **Preset chips** for refractive index and vertex distance
- **Rx string parsing** ("paste -2.00 -1.50 x 90")
- **Persisted preferences** (default vertex distance, default index) via AsyncStorage
- **Bottom tab bar** as an alternative top-level navigation
- **Visual icons per hub** in the drawer
