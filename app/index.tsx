import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from '../constants/theme';
import {
  Category,
  LengthUnit,
  LENGTH_UNITS,
  DioptersInputUnit,
  PrismUnit,
  convertLength,
  lengthToDiopters,
  convertDiopters,
  convertPrism,
  convertPrismAngles,
  PrismAngleUnit,
  pantoscopicTilt,
  compensateVertexDistance,
  compensateVertexSpheroCyl,
  calculateLensThickness,
  transposeRx,
  sphericalEquivalent,
  calculateMBS,
  prenticeRule,
  javalsRule,
  calculateFramePd,
  calculateNearPd,
  calculateBaseCurve,
  calculateMagnification,
  formatNumber,
  formatRx,
  roundToStep,
  CATEGORIES,
  HUBS,
  REFRACTIVE_INDICES,
} from '../utils/conversions';
import { getLearningContent, LearningContent } from '../utils/learningSteps';

import DrawerMenu from '../components/DrawerMenu';
import ModeTabs from '../components/ModeTabs';
import ConversionInput from '../components/ConversionInput';
import ResultsList from '../components/ResultsList';
import LearningPanel from '../components/LearningPanel';
import VertexInput from '../components/VertexInput';
import ThicknessInput from '../components/ThicknessInput';
import FieldGroup, { FieldConfig } from '../components/FieldGroup';
import ReferenceView from '../components/ReferenceView';
import InteractivePrism from '../components/InteractivePrism';
import MaterialCompareView from '../components/MaterialCompareView';
import NearAddView from '../components/NearAddView';
import PrismToolsView from '../components/PrismToolsView';
import ExamLaneView from '../components/ExamLaneView';
import CurvatureView from '../components/CurvatureView';
import DecenterForPrismView from '../components/DecenterForPrismView';

import FocalLengthDiagram from '../diagrams/FocalLengthDiagram';
import PrismDiagram from '../diagrams/PrismDiagram';
import VertexDiagram from '../diagrams/VertexDiagram';
import LensThicknessDiagram from '../diagrams/LensThicknessDiagram';
import PantoscopicTiltDiagram from '../diagrams/PantoscopicTiltDiagram';

// ─── Unit option lists ──────────────────────────────────────

const LENGTH_OPTIONS = LENGTH_UNITS.map((u) => ({
  key: u.key,
  label: u.label,
  abbr: u.abbr,
}));

const DIOPTER_OPTIONS = [
  { key: 'D', label: 'Diopters', abbr: 'D' },
  ...LENGTH_OPTIONS,
];

const PRISM_OPTIONS = [
  { key: 'prismDiopters', label: 'Prism Diopters', abbr: 'Δ' },
  { key: 'degrees', label: 'Degrees', abbr: '°' },
  { key: 'radians', label: 'Radians', abbr: 'rad' },
  { key: 'arcmin', label: 'Arcminutes', abbr: '′' },
  { key: 'arcsec', label: 'Arcseconds', abbr: '″' },
];

// ─── Picker presets ──────────────────────────────────────────

const PICKER_SPHERE = { min: -20, max: 20, step: 0.25, precision: 2 };
const PICKER_CYLINDER = { min: -10, max: 10, step: 0.25, precision: 2 };
const PICKER_AXIS = { min: 1, max: 180, step: 1, precision: 0 };
const PICKER_PD = { min: 50, max: 80, step: 0.5, precision: 1 };
const PICKER_VERTEX = { min: 0, max: 20, step: 0.5, precision: 1 };
const PICKER_MM = { min: 1, max: 100, step: 1, precision: 0 };
const PICKER_K = { min: 38, max: 50, step: 0.25, precision: 2 };
const PICKER_DECEN = { min: 0, max: 15, step: 0.5, precision: 1 };
const PICKER_POWER_LOW = { min: -20, max: 20, step: 0.50, precision: 2 };
const PICKER_SMALL_MM = { min: 0.5, max: 10, step: 0.1, precision: 1 };
const PICKER_INDEX = { min: 1.40, max: 1.80, step: 0.01, precision: 2 };
const PICKER_WORK_DIST = { min: 20, max: 100, step: 5, precision: 0 };

// ─── Field definitions for multi-input categories ───────────

const TRANSPOSE_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER },
  { key: 'axis', label: 'AXIS (°)', placeholder: '90', suffix: '°', picker: PICKER_AXIS },
];

const SPH_EQUIV_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER },
];

const MBS_FIELDS: FieldConfig[] = [
  { key: 'ed', label: 'EFFECTIVE DIA', placeholder: '54', suffix: 'mm', picker: { min: 40, max: 70, step: 1, precision: 0 } },
  { key: 'framePd', label: 'FRAME PD', placeholder: '70', suffix: 'mm', picker: { min: 55, max: 85, step: 1, precision: 0 } },
  { key: 'patientPd', label: 'PATIENT PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD },
];

const PRENTICE_FIELDS: FieldConfig[] = [
  { key: 'decentration', label: 'DECENTRATION', placeholder: '5', suffix: 'mm', picker: PICKER_DECEN },
  { key: 'power', label: 'LENS POWER', placeholder: '-4.00', suffix: 'D', picker: PICKER_SPHERE },
];

const JAVAL_FIELDS: FieldConfig[] = [
  { key: 'k1', label: 'K1 (STEEP)', placeholder: '44.00', suffix: 'D', picker: PICKER_K },
  { key: 'k1Axis', label: 'K1 AXIS', placeholder: '90', suffix: '°', picker: PICKER_AXIS },
  { key: 'k2', label: 'K2 (FLAT)', placeholder: '42.50', suffix: 'D', picker: PICKER_K },
  { key: 'k2Axis', label: 'K2 AXIS', placeholder: '180', suffix: '°', picker: PICKER_AXIS },
];

const FRAME_PD_FIELDS: FieldConfig[] = [
  { key: 'aSize', label: 'A SIZE', placeholder: '52', suffix: 'mm', picker: { min: 40, max: 62, step: 1, precision: 0 } },
  { key: 'dbl', label: 'DBL (BRIDGE)', placeholder: '18', suffix: 'mm', picker: { min: 14, max: 24, step: 1, precision: 0 } },
  { key: 'patientPd', label: 'PATIENT PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD },
];

const NEAR_PD_FIELDS: FieldConfig[] = [
  { key: 'distancePd', label: 'DISTANCE PD', placeholder: '64', suffix: 'mm', picker: PICKER_PD },
  { key: 'workingDistance', label: 'WORKING DIST', placeholder: '40', suffix: 'cm', picker: PICKER_WORK_DIST },
];

const BASE_CURVE_FIELDS: FieldConfig[] = [
  { key: 'sphere', label: 'SPHERE (D)', placeholder: '-2.00', suffix: 'D', picker: PICKER_SPHERE },
  { key: 'cylinder', label: 'CYLINDER (D)', placeholder: '-1.50', suffix: 'D', picker: PICKER_CYLINDER },
];

const MAGNIFICATION_FIELDS: FieldConfig[] = [
  { key: 'power', label: 'BACK VERTEX', placeholder: '-6.00', suffix: 'D', picker: PICKER_SPHERE },
  { key: 'centerThickness', label: 'CENTER THICK', placeholder: '2.0', suffix: 'mm', picker: PICKER_SMALL_MM },
  { key: 'frontCurve', label: 'FRONT CURVE', placeholder: '4.00', suffix: 'D', picker: { min: 0, max: 12, step: 0.50, precision: 2 } },
  { key: 'refractiveIndex', label: 'REF INDEX', placeholder: '1.50', picker: PICKER_INDEX },
  { key: 'vertexDistance', label: 'VERTEX DIST', placeholder: '12', suffix: 'mm', picker: PICKER_VERTEX },
];

const AS_WORN_FIELDS: FieldConfig[] = [
  { key: 'power', label: 'SPHERE POWER (D)', placeholder: '-4.00', suffix: 'D', picker: PICKER_SPHERE },
  { key: 'tilt', label: 'PANTO TILT (°)', placeholder: '10', suffix: '°', picker: { min: 0, max: 25, step: 1, precision: 0 } },
  { key: 'refractiveIndex', label: 'INDEX (n)', placeholder: '1.50', picker: PICKER_INDEX },
];

// ─── Main Screen ────────────────────────────────────────────

export default function HomeScreen() {
  const [hubKey, setHubKey] = useState<string>('convert');
  const [category, setCategory] = useState<Category>('diopters');
  const [learningMode, setLearningMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Remember the last sub-tool used in each hub.
  const [hubTool, setHubTool] = useState<Record<string, Category>>({});

  const currentHub = HUBS.find((h) => h.key === hubKey) ?? HUBS[0];
  const currentLabel = currentHub.title;

  const handleSelectHub = useCallback(
    (key: string) => {
      const hub = HUBS.find((h) => h.key === key);
      if (!hub) return;
      setHubKey(key);
      setCategory(hubTool[key] ?? hub.items[0].key);
    },
    [hubTool]
  );

  const handleSelectTool = useCallback(
    (cat: Category) => {
      setCategory(cat);
      setHubTool((prev) => ({ ...prev, [hubKey]: cat }));
    },
    [hubKey]
  );

  // Length state
  const [lengthValue, setLengthValue] = useState('');
  const [lengthUnit, setLengthUnit] = useState<string>('mm');

  // Diopter state
  const [dioptersValue, setDioptersValue] = useState('');
  const [dioptersUnit, setDioptersUnit] = useState<string>('D');

  // Prism state
  const [prismValue, setPrismValue] = useState('');
  const [prismUnit, setPrismUnit] = useState<string>('prismDiopters');

  // Vertex state (now supports spherocylindrical)
  const [vertexPower, setVertexPower] = useState('');
  const [vertexCylinder, setVertexCylinder] = useState('');
  const [vertexAxis, setVertexAxis] = useState('');
  const [vertexOriginal, setVertexOriginal] = useState('12');
  const [vertexNew, setVertexNew] = useState('0');

  // Thickness state
  const [thicknessPower, setThicknessPower] = useState('');
  const [thicknessDiameter, setThicknessDiameter] = useState('70');
  const [thicknessIndex, setThicknessIndex] = useState(1.5);
  const [thicknessMin, setThicknessMin] = useState('1.5');

  // Prentice interactive mode
  const [prenticeInteractive, setPrenticeInteractive] = useState(false);

  // Generic multi-field state for all new categories
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  const getFieldVal = useCallback(
    (cat: string, key: string) => fieldValues[cat]?.[key] ?? '',
    [fieldValues]
  );

  const setFieldVal = useCallback(
    (cat: string, key: string, value: string) => {
      setFieldValues((prev) => ({
        ...prev,
        [cat]: { ...prev[cat], [key]: value },
      }));
    },
    []
  );

  const getFields = useCallback(
    (cat: string) => fieldValues[cat] ?? {},
    [fieldValues]
  );

  const makeOnChange = useCallback(
    (cat: string) => (key: string, value: string) => setFieldVal(cat, key, value),
    [setFieldVal]
  );

  // ─── Compute results ───────────────────────────────────

  const results = useMemo(() => {
    switch (category) {
      case 'length': {
        const v = parseFloat(lengthValue);
        if (isNaN(v) || v === 0) return [];
        const lengthResults = convertLength(v, lengthUnit as LengthUnit);
        const diopters = lengthToDiopters(v, lengthUnit as LengthUnit);
        const items = lengthResults.map((r) => ({
          label: r.unit.label,
          abbr: r.unit.abbr,
          value: r.value,
        }));
        if (diopters !== null) {
          items.push({ label: 'Diopters (as focal length)', abbr: 'D', value: diopters });
        }
        return items;
      }
      case 'diopters': {
        const v = parseFloat(dioptersValue);
        if (isNaN(v) || v === 0) return [];
        return convertDiopters(v, dioptersUnit as DioptersInputUnit);
      }
      case 'prism': {
        const v = parseFloat(prismValue);
        if (isNaN(v)) return [];
        return convertPrismAngles(v, prismUnit as PrismAngleUnit).map((r) => ({
          label: r.label,
          abbr: r.abbr,
          value: r.value,
        }));
      }
      case 'vertex': {
        const p = parseFloat(vertexPower);
        const orig = parseFloat(vertexOriginal);
        const newV = parseFloat(vertexNew);
        if (isNaN(p) || isNaN(orig) || isNaN(newV)) return [];

        const cyl = parseFloat(vertexCylinder);
        const axis = parseFloat(vertexAxis);

        if (!isNaN(cyl) && cyl !== 0 && !isNaN(axis)) {
          // Spherocylindrical
          const rx = { sphere: p, cylinder: cyl, axis };
          const compensated = compensateVertexSpheroCyl(rx, orig, newV);
          return [
            { label: 'New Sphere', abbr: 'D', value: compensated.sphere },
            { label: 'New Cylinder', abbr: 'D', value: compensated.cylinder },
            { label: 'Axis (unchanged)', abbr: '°', value: compensated.axis },
          ];
        }
        // Sphere only
        const compensated = roundToStep(compensateVertexDistance(p, orig, newV), 0.25);
        return [
          { label: 'Compensated Power', abbr: 'D', value: compensated },
          { label: 'Change', abbr: 'D', value: roundToStep(compensated - p, 0.25) },
        ];
      }
      case 'thickness': {
        const p = parseFloat(thicknessPower);
        const d = parseFloat(thicknessDiameter);
        const mt = parseFloat(thicknessMin);
        if (isNaN(p) || isNaN(d) || isNaN(mt) || d <= 0) return [];
        const result = calculateLensThickness({
          power: p,
          diameter: d,
          refractiveIndex: thicknessIndex,
          minThickness: mt,
        });
        return [
          { label: 'Center Thickness', abbr: 'mm', value: result.centerThickness },
          { label: 'Edge Thickness', abbr: 'mm', value: result.edgeThickness },
        ];
      }
      case 'transpose': {
        const f = getFields('transpose');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        const axis = parseFloat(f.axis);
        if (isNaN(sph) || isNaN(cyl) || isNaN(axis)) return [];
        const t = transposeRx({ sphere: sph, cylinder: cyl, axis });
        return [
          { label: 'New Sphere', abbr: 'D', value: t.sphere },
          { label: 'New Cylinder', abbr: 'D', value: t.cylinder },
          { label: 'New Axis', abbr: '°', value: t.axis },
        ];
      }
      case 'sphEquiv': {
        const f = getFields('sphEquiv');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        if (isNaN(sph) || isNaN(cyl)) return [];
        const se = sphericalEquivalent(sph, cyl);
        return [{ label: 'Spherical Equivalent', abbr: 'D', value: se }];
      }
      case 'mbs': {
        const f = getFields('mbs');
        const ed = parseFloat(f.ed);
        const fpd = parseFloat(f.framePd);
        const ppd = parseFloat(f.patientPd);
        if (isNaN(ed) || isNaN(fpd) || isNaN(ppd)) return [];
        const r = calculateMBS({ ed, framePd: fpd, patientPd: ppd });
        return [
          { label: 'Decentration per eye', abbr: 'mm', value: r.decentration },
          { label: 'Minimum Blank Size', abbr: 'mm', value: r.mbs },
        ];
      }
      case 'prentice': {
        const f = getFields('prentice');
        const dec = parseFloat(f.decentration);
        const pow = parseFloat(f.power);
        if (isNaN(dec) || isNaN(pow)) return [];
        const prism = prenticeRule(dec, pow);
        return [{ label: 'Induced Prism', abbr: 'Δ', value: prism }];
      }
      case 'javal': {
        const f = getFields('javal');
        const k1 = parseFloat(f.k1);
        const k2 = parseFloat(f.k2);
        const k1a = parseFloat(f.k1Axis);
        const k2a = parseFloat(f.k2Axis);
        if (isNaN(k1) || isNaN(k2) || isNaN(k1a) || isNaN(k2a)) return [];
        const r = javalsRule(k1, k2, k1a, k2a);
        return [
          { label: `Predicted Cyl (${r.rule})`, abbr: 'D', value: r.cornealCyl },
          { label: 'Predicted Axis', abbr: '°', value: r.axis },
          { label: 'Corneal Cyl', abbr: 'D', value: Math.abs(k1 - k2) },
        ];
      }
      case 'framePd': {
        const f = getFields('framePd');
        const a = parseFloat(f.aSize);
        const dbl = parseFloat(f.dbl);
        const ppd = parseFloat(f.patientPd);
        if (isNaN(a) || isNaN(dbl) || isNaN(ppd)) return [];
        const r = calculateFramePd(a, dbl, ppd);
        return [
          { label: 'Frame PD (A + DBL)', abbr: 'mm', value: r.framePd },
          { label: 'Decentration per eye', abbr: 'mm', value: r.decentrationPerEye },
          { label: 'Total Decentration', abbr: 'mm', value: r.totalDecentration },
        ];
      }
      case 'nearPd': {
        const f = getFields('nearPd');
        const dpd = parseFloat(f.distancePd);
        const wd = parseFloat(f.workingDistance);
        if (isNaN(dpd) || isNaN(wd) || wd <= 0) return [];
        const npd = calculateNearPd(dpd, wd);
        return [
          { label: 'Near PD', abbr: 'mm', value: npd },
          { label: 'Convergence', abbr: 'mm', value: dpd - npd },
        ];
      }
      case 'baseCurve': {
        const f = getFields('baseCurve');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        if (isNaN(sph) || isNaN(cyl)) return [];
        const r = calculateBaseCurve(sph, cyl);
        return [{ label: `Recommended (${r.description})`, abbr: 'D', value: r.vogel }];
      }
      case 'magnification': {
        const f = getFields('magnification');
        const pow = parseFloat(f.power);
        const ct = parseFloat(f.centerThickness);
        const fc = parseFloat(f.frontCurve);
        const ri = parseFloat(f.refractiveIndex);
        const vd = parseFloat(f.vertexDistance);
        if (isNaN(pow) || isNaN(ct) || isNaN(fc) || isNaN(ri) || isNaN(vd)) return [];
        const r = calculateMagnification({
          power: pow,
          centerThickness: ct,
          frontCurve: fc,
          refractiveIndex: ri,
          vertexDistance: vd,
        });
        return [
          { label: 'Shape Factor', abbr: '×', value: r.shapeFactor },
          { label: 'Power Factor', abbr: '×', value: r.powerFactor },
          { label: 'Total Magnification', abbr: '×', value: r.totalMagnification },
          { label: 'Image Size Change', abbr: '%', value: r.percentChange },
        ];
      }
      case 'asWorn': {
        const f = getFields('asWorn');
        const pow = parseFloat(f.power);
        const tilt = parseFloat(f.tilt);
        const ri = parseFloat(f.refractiveIndex);
        if (isNaN(pow) || isNaN(tilt) || isNaN(ri) || ri <= 1) return [];
        const r = pantoscopicTilt(pow, tilt, ri);
        return [
          { label: 'As-Worn Sphere', abbr: 'D', value: roundToStep(r.asWornSphere, 0.25) },
          { label: 'Induced Cyl (× 180)', abbr: 'D', value: roundToStep(r.inducedCylinder, 0.25) },
          { label: 'Sphere Change', abbr: 'D', value: r.sphereChange },
        ];
      }
      case 'reference':
        return [];
      default:
        return [];
    }
  }, [
    category,
    lengthValue, lengthUnit,
    dioptersValue, dioptersUnit,
    prismValue, prismUnit,
    vertexPower, vertexCylinder, vertexAxis, vertexOriginal, vertexNew,
    thicknessPower, thicknessDiameter, thicknessIndex, thicknessMin,
    fieldValues,
    getFields,
  ]);

  // ─── Vertex full Rx display ─────────────────────────────

  const vertexFullRxDisplay = useMemo(() => {
    if (category !== 'vertex') return null;
    const p = parseFloat(vertexPower);
    const cyl = parseFloat(vertexCylinder);
    const axis = parseFloat(vertexAxis);
    const orig = parseFloat(vertexOriginal);
    const newV = parseFloat(vertexNew);
    if (isNaN(p) || isNaN(cyl) || cyl === 0 || isNaN(axis) || isNaN(orig) || isNaN(newV))
      return null;
    const rx = { sphere: p, cylinder: cyl, axis };
    const compensated = compensateVertexSpheroCyl(rx, orig, newV);
    return formatRx(compensated);
  }, [vertexPower, vertexCylinder, vertexAxis, vertexOriginal, vertexNew, category]);

  // ─── Learning content ──────────────────────────────────

  const learningContent = useMemo((): LearningContent | null => {
    if (!learningMode) return null;

    switch (category) {
      case 'length': {
        const v = parseFloat(lengthValue);
        if (isNaN(v) || v === 0) return null;
        return getLearningContent('length', { value: v, fromUnit: lengthUnit });
      }
      case 'diopters': {
        const v = parseFloat(dioptersValue);
        if (isNaN(v) || v === 0) return null;
        return getLearningContent('diopters', { value: v, fromUnit: dioptersUnit });
      }
      case 'prism': {
        const v = parseFloat(prismValue);
        if (isNaN(v)) return null;
        return getLearningContent('prism', { value: v, fromUnit: prismUnit });
      }
      case 'vertex': {
        const p = parseFloat(vertexPower);
        const orig = parseFloat(vertexOriginal);
        const newV = parseFloat(vertexNew);
        if (isNaN(p) || isNaN(orig) || isNaN(newV)) return null;
        const cyl = parseFloat(vertexCylinder);
        const axis = parseFloat(vertexAxis);
        return getLearningContent('vertex', {
          power: p,
          originalMm: orig,
          newMm: newV,
          cylinder: isNaN(cyl) ? undefined : cyl,
          axis: isNaN(axis) ? undefined : axis,
        });
      }
      case 'thickness': {
        const p = parseFloat(thicknessPower);
        const d = parseFloat(thicknessDiameter);
        const mt = parseFloat(thicknessMin);
        if (isNaN(p) || isNaN(d) || isNaN(mt)) return null;
        return getLearningContent('thickness', {
          power: p,
          diameter: d,
          refractiveIndex: thicknessIndex,
          minThickness: mt,
        });
      }
      case 'transpose': {
        const f = getFields('transpose');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        const axis = parseFloat(f.axis);
        if (isNaN(sph) || isNaN(cyl) || isNaN(axis)) return null;
        return getLearningContent('transpose', { sphere: sph, cylinder: cyl, axis });
      }
      case 'sphEquiv': {
        const f = getFields('sphEquiv');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        if (isNaN(sph) || isNaN(cyl)) return null;
        return getLearningContent('sphEquiv', { sphere: sph, cylinder: cyl });
      }
      case 'mbs': {
        const f = getFields('mbs');
        const ed = parseFloat(f.ed);
        const fpd = parseFloat(f.framePd);
        const ppd = parseFloat(f.patientPd);
        if (isNaN(ed) || isNaN(fpd) || isNaN(ppd)) return null;
        return getLearningContent('mbs', { ed, framePd: fpd, patientPd: ppd });
      }
      case 'prentice': {
        const f = getFields('prentice');
        const dec = parseFloat(f.decentration);
        const pow = parseFloat(f.power);
        if (isNaN(dec) || isNaN(pow)) return null;
        return getLearningContent('prentice', { decentrationMm: dec, powerDiopters: pow });
      }
      case 'javal': {
        const f = getFields('javal');
        const k1 = parseFloat(f.k1);
        const k2 = parseFloat(f.k2);
        const k1a = parseFloat(f.k1Axis);
        const k2a = parseFloat(f.k2Axis);
        if (isNaN(k1) || isNaN(k2) || isNaN(k1a) || isNaN(k2a)) return null;
        return getLearningContent('javal', { k1, k2, k1Axis: k1a, k2Axis: k2a });
      }
      case 'framePd': {
        const f = getFields('framePd');
        const a = parseFloat(f.aSize);
        const dbl = parseFloat(f.dbl);
        const ppd = parseFloat(f.patientPd);
        if (isNaN(a) || isNaN(dbl) || isNaN(ppd)) return null;
        return getLearningContent('framePd', { aSize: a, dbl, patientPd: ppd });
      }
      case 'nearPd': {
        const f = getFields('nearPd');
        const dpd = parseFloat(f.distancePd);
        const wd = parseFloat(f.workingDistance);
        if (isNaN(dpd) || isNaN(wd)) return null;
        return getLearningContent('nearPd', { distancePd: dpd, workingDistanceCm: wd });
      }
      case 'baseCurve': {
        const f = getFields('baseCurve');
        const sph = parseFloat(f.sphere);
        const cyl = parseFloat(f.cylinder);
        if (isNaN(sph) || isNaN(cyl)) return null;
        return getLearningContent('baseCurve', { sphere: sph, cylinder: cyl });
      }
      case 'magnification': {
        const f = getFields('magnification');
        const pow = parseFloat(f.power);
        const ct = parseFloat(f.centerThickness);
        const fc = parseFloat(f.frontCurve);
        const ri = parseFloat(f.refractiveIndex);
        const vd = parseFloat(f.vertexDistance);
        if (isNaN(pow) || isNaN(ct) || isNaN(fc) || isNaN(ri) || isNaN(vd)) return null;
        return getLearningContent('magnification', {
          power: pow,
          centerThickness: ct,
          frontCurve: fc,
          refractiveIndex: ri,
          vertexDistance: vd,
        });
      }
      case 'asWorn': {
        const f = getFields('asWorn');
        const pow = parseFloat(f.power);
        const tilt = parseFloat(f.tilt);
        const ri = parseFloat(f.refractiveIndex);
        if (isNaN(pow) || isNaN(tilt) || isNaN(ri) || ri <= 1) return null;
        return getLearningContent('asWorn', { power: pow, tiltDeg: tilt, refractiveIndex: ri });
      }
      default:
        return null;
    }
  }, [
    learningMode, category,
    lengthValue, lengthUnit,
    dioptersValue, dioptersUnit,
    prismValue, prismUnit,
    vertexPower, vertexCylinder, vertexAxis, vertexOriginal, vertexNew,
    thicknessPower, thicknessDiameter, thicknessIndex, thicknessMin,
    fieldValues, getFields,
  ]);

  // ─── Learning diagram ──────────────────────────────────

  const learningDiagram = useMemo(() => {
    if (!learningMode) return null;
    switch (category) {
      case 'length':
      case 'diopters':
        return <FocalLengthDiagram />;
      case 'prism':
      case 'prentice':
        return <PrismDiagram />;
      case 'vertex':
        return <VertexDiagram />;
      case 'thickness': {
        const p = parseFloat(thicknessPower);
        const result =
          !isNaN(p) && !isNaN(parseFloat(thicknessDiameter)) && !isNaN(parseFloat(thicknessMin))
            ? calculateLensThickness({
                power: p,
                diameter: parseFloat(thicknessDiameter),
                refractiveIndex: thicknessIndex,
                minThickness: parseFloat(thicknessMin),
              })
            : null;
        return (
          <LensThicknessDiagram
            isPlusLens={!isNaN(p) ? p >= 0 : true}
            centerThickness={result?.centerThickness}
            edgeThickness={result?.edgeThickness}
          />
        );
      }
      case 'magnification':
        return <LensThicknessDiagram isPlusLens={true} />;
      case 'asWorn': {
        const tilt = parseFloat(getFields('asWorn').tilt);
        return <PantoscopicTiltDiagram tiltDeg={isNaN(tilt) ? 10 : tilt} />;
      }
      default:
        return null;
    }
  }, [learningMode, category, thicknessPower, thicknessDiameter, thicknessIndex, thicknessMin, fieldValues, getFields]);

  // ─── Render input section per category ──────────────────

  const renderInput = () => {
    switch (category) {
      case 'length':
        return (
          <ConversionInput
            value={lengthValue}
            onChangeValue={setLengthValue}
            unit={lengthUnit}
            onChangeUnit={setLengthUnit}
            unitOptions={LENGTH_OPTIONS}
            label="ENTER LENGTH"
            picker={{ min: 0, max: 1000, step: 1, precision: 1 }}
          />
        );
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
          />
        );
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
          />
        );
      case 'vertex':
        return (
          <VertexInput
            power={vertexPower}
            onChangePower={setVertexPower}
            originalVertex={vertexOriginal}
            onChangeOriginalVertex={setVertexOriginal}
            newVertex={vertexNew}
            onChangeNewVertex={setVertexNew}
            cylinder={vertexCylinder}
            onChangeCylinder={setVertexCylinder}
            axis={vertexAxis}
            onChangeAxis={setVertexAxis}
          />
        );
      case 'thickness':
        return (
          <ThicknessInput
            power={thicknessPower}
            onChangePower={setThicknessPower}
            diameter={thicknessDiameter}
            onChangeDiameter={setThicknessDiameter}
            refractiveIndex={thicknessIndex}
            onChangeRefractiveIndex={setThicknessIndex}
            minThickness={thicknessMin}
            onChangeMinThickness={setThicknessMin}
          />
        );
      case 'transpose':
        return (
          <FieldGroup
            fields={TRANSPOSE_FIELDS}
            values={getFields('transpose')}
            onChange={makeOnChange('transpose')}
            columns={3}
          />
        );
      case 'sphEquiv':
        return (
          <FieldGroup
            fields={SPH_EQUIV_FIELDS}
            values={getFields('sphEquiv')}
            onChange={makeOnChange('sphEquiv')}
          />
        );
      case 'mbs':
        return (
          <FieldGroup
            fields={MBS_FIELDS}
            values={getFields('mbs')}
            onChange={makeOnChange('mbs')}
            columns={3}
          />
        );
      case 'prentice':
        return (
          <View>
            {/* Toggle between calculator and interactive */}
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeTab, !prenticeInteractive && styles.modeTabActive]}
                onPress={() => setPrenticeInteractive(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, !prenticeInteractive && styles.modeTabTextActive]}>
                  Calculator
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, prenticeInteractive && styles.modeTabActive]}
                onPress={() => setPrenticeInteractive(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, prenticeInteractive && styles.modeTabTextActive]}>
                  Interactive
                </Text>
              </TouchableOpacity>
            </View>
            {prenticeInteractive ? (
              <InteractivePrism />
            ) : (
              <FieldGroup
                fields={PRENTICE_FIELDS}
                values={getFields('prentice')}
                onChange={makeOnChange('prentice')}
              />
            )}
          </View>
        );
      case 'javal':
        return (
          <FieldGroup
            fields={JAVAL_FIELDS}
            values={getFields('javal')}
            onChange={makeOnChange('javal')}
          />
        );
      case 'framePd':
        return (
          <FieldGroup
            fields={FRAME_PD_FIELDS}
            values={getFields('framePd')}
            onChange={makeOnChange('framePd')}
            columns={3}
          />
        );
      case 'nearPd':
        return (
          <FieldGroup
            fields={NEAR_PD_FIELDS}
            values={getFields('nearPd')}
            onChange={makeOnChange('nearPd')}
          />
        );
      case 'baseCurve':
        return (
          <FieldGroup
            fields={BASE_CURVE_FIELDS}
            values={getFields('baseCurve')}
            onChange={makeOnChange('baseCurve')}
          />
        );
      case 'magnification':
        return (
          <FieldGroup
            fields={MAGNIFICATION_FIELDS}
            values={getFields('magnification')}
            onChange={makeOnChange('magnification')}
            columns={2}
          />
        );
      case 'materialCompare':
        return <MaterialCompareView />;
      case 'nearAdd':
        return <NearAddView />;
      case 'prismCompound':
        return <PrismToolsView />;
      case 'asWorn':
        return (
          <FieldGroup
            fields={AS_WORN_FIELDS}
            values={getFields('asWorn')}
            onChange={makeOnChange('asWorn')}
            columns={3}
          />
        );
      case 'examLane':
        return <ExamLaneView />;
      case 'curvature':
        return <CurvatureView />;
      case 'decenterForPrism':
        return <DecenterForPrismView />;
      case 'reference':
        return <ReferenceView />;
    }
  };

  // ─── Vertex full Rx result row ──────────────────────────

  const renderVertexRxRow = () => {
    if (category !== 'vertex' || !vertexFullRxDisplay) return null;
    return (
      <View style={styles.rxResultContainer}>
        <Text style={styles.rxResultLabel}>COMPENSATED FULL RX</Text>
        <Text style={styles.rxResultValue}>{vertexFullRxDisplay}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{currentLabel}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.learnButton,
                learningMode && styles.learnButtonActive,
              ]}
              onPress={() => setLearningMode(!learningMode)}
              activeOpacity={0.7}
            >
              <Text style={styles.learnIcon}>
                {learningMode ? '✕' : '📖'}
              </Text>
              <Text
                style={[
                  styles.learnText,
                  learningMode && styles.learnTextActive,
                ]}
              >
                {learningMode ? 'Close' : 'Learn'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drawer Menu */}
          <DrawerMenu
            visible={drawerOpen}
            selected={hubKey}
            onSelect={handleSelectHub}
            onClose={() => setDrawerOpen(false)}
          />

          {/* Sub-tool mode tabs for the current hub */}
          {currentHub.items.length > 1 && (
            <ModeTabs
              items={currentHub.items}
              selected={category}
              onSelect={handleSelectTool}
            />
          )}

          {/* Scrollable content */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={Keyboard.dismiss}
          >
            {/* Input */}
            {renderInput()}

            {/* Results */}
            {category !== 'reference' &&
              category !== 'materialCompare' &&
              category !== 'nearAdd' &&
              category !== 'prismCompound' &&
              category !== 'examLane' &&
              category !== 'curvature' &&
              category !== 'decenterForPrism' &&
              !(category === 'prentice' && prenticeInteractive) && (
                <ResultsList results={results} />
              )}

            {/* Vertex full Rx display */}
            {renderVertexRxRow()}

            {/* Learning Panel */}
            {learningMode &&
              category !== 'reference' &&
              category !== 'materialCompare' &&
              category !== 'nearAdd' &&
              category !== 'prismCompound' &&
              category !== 'examLane' &&
              category !== 'curvature' &&
              category !== 'decenterForPrism' && (
              <LearningPanel
                content={learningContent}
                diagram={learningDiagram}
              />
            )}

            {/* Bottom spacer */}
            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hamburgerLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textOnPrimary,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.header,
    color: Colors.textOnPrimary,
  },
  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  learnButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  learnIcon: {
    fontSize: 14,
  },
  learnText: {
    ...Typography.label,
    color: Colors.textOnPrimary,
  },
  learnTextActive: {
    color: Colors.textOnAccent,
  },
  scrollContent: {
    backgroundColor: Colors.surfaceAlt,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  rxResultContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  rxResultLabel: {
    ...Typography.caption,
    color: Colors.accentLight,
    marginBottom: Spacing.xs,
  },
  rxResultValue: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  modeToggleRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  modeTab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeTabText: {
    ...Typography.chip,
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.textOnPrimary,
  },
});
