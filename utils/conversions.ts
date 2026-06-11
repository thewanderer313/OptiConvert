// ─── Category Types ───────────────────────────────────────

export type Category =
  | 'length'
  | 'diopters'
  | 'prism'
  | 'vertex'
  | 'thickness'
  | 'transpose'
  | 'sphEquiv'
  | 'mbs'
  | 'prentice'
  | 'javal'
  | 'framePd'
  | 'nearPd'
  | 'baseCurve'
  | 'magnification'
  | 'materialCompare'
  | 'nearAdd'
  | 'prismCompound'
  | 'asWorn'
  | 'examLane'
  | 'curvature'
  | 'decenterForPrism'
  | 'reference';

export interface CategoryConfig {
  key: Category;
  label: string;
  description: string;
}

export interface CategoryGroup {
  title: string;
  items: CategoryConfig[];
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'length', label: 'Length', description: 'Length & focal length' },
  { key: 'diopters', label: 'Diopters', description: 'Focal length ↔ Power' },
  { key: 'prism', label: 'Prism', description: 'Prism diopters ↔ Degrees' },
  { key: 'vertex', label: 'Vertex', description: 'Vertex distance compensation' },
  { key: 'thickness', label: 'Thickness', description: 'Lens thickness estimation' },
  { key: 'transpose', label: 'Transpose', description: 'Plus ↔ Minus cylinder' },
  { key: 'sphEquiv', label: 'Sph Equiv', description: 'Spherical equivalent' },
  { key: 'mbs', label: 'MBS', description: 'Minimum blank size' },
  { key: 'prentice', label: "Prentice", description: "Prentice's Rule" },
  { key: 'javal', label: "Javal", description: "Javal's Rule" },
  { key: 'framePd', label: 'Frame PD', description: 'Frame PD & decentration' },
  { key: 'nearPd', label: 'Near PD', description: 'Near PD from distance' },
  { key: 'baseCurve', label: 'Base Curve', description: 'Base curve selection' },
  { key: 'magnification', label: 'Magnify', description: 'Spectacle magnification' },
  { key: 'materialCompare', label: 'Compare', description: 'Lens material comparison' },
  { key: 'nearAdd', label: 'Near Add', description: 'Add power & NRA/PRA balance' },
  { key: 'prismCompound', label: 'Prism Tools', description: 'Compound & resolve prism' },
  { key: 'asWorn', label: 'As Worn', description: 'Pantoscopic tilt effects' },
  { key: 'examLane', label: 'Exam Lane', description: 'Optotype size for acuity' },
  { key: 'curvature', label: 'Curvature', description: 'Radius ↔ power' },
  { key: 'decenterForPrism', label: 'Decenter', description: 'Decentration to induce prism' },
  { key: 'reference', label: 'Reference', description: 'Abbreviations & materials' },
];

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: 'Conversions',
    items: [
      { key: 'length', label: 'Length', description: 'Length & focal length' },
      { key: 'diopters', label: 'Diopters', description: 'Focal length ↔ Power' },
      { key: 'prism', label: 'Prism', description: 'Δ, degrees, radians & arc' },
      { key: 'curvature', label: 'Radius ↔ Power', description: 'Curvature for K & base curves' },
    ],
  },
  {
    title: 'Optics',
    items: [
      { key: 'vertex', label: 'Vertex Distance', description: 'Rx compensation for vertex change' },
      { key: 'thickness', label: 'Lens Thickness', description: 'Edge & center thickness' },
      { key: 'transpose', label: 'Transposition', description: 'Plus ↔ Minus cylinder form' },
      { key: 'sphEquiv', label: 'Spherical Equivalent', description: 'Sphere + Cyl/2' },
      { key: 'magnification', label: 'Magnification', description: 'Spectacle image size change' },
      { key: 'materialCompare', label: 'Material Comparison', description: 'Thickness & weight by lens material' },
      { key: 'nearAdd', label: 'Near Add', description: 'Reading add & NRA/PRA balancing' },
      { key: 'asWorn', label: 'As-Worn / Pantoscopic Tilt', description: 'Tilt-induced sphere & cylinder' },
    ],
  },
  {
    title: 'Fitting',
    items: [
      { key: 'mbs', label: 'Min Blank Size', description: 'Minimum lens blank needed' },
      { key: 'prentice', label: "Prentice's Rule", description: 'Induced prism from decentration' },
      { key: 'prismCompound', label: 'Prism Compound & Resolve', description: 'Combine or split prism components' },
      { key: 'framePd', label: 'Frame PD', description: 'Frame PD & decentration' },
      { key: 'nearPd', label: 'Near PD', description: 'Near PD from distance PD' },
      { key: 'baseCurve', label: 'Base Curve', description: "Vogel's rule for base curve" },
    ],
  },
  {
    title: 'Formulas & Reference',
    items: [
      { key: 'javal', label: "Javal's Rule", description: 'Predicted cyl from K readings' },
      { key: 'examLane', label: 'Exam Lane Setup', description: 'Letter size for a target acuity' },
      { key: 'reference', label: 'Reference', description: 'Abbreviations & materials' },
    ],
  },
];

// ─── Hubs (consolidated navigation) ────────────────────────
// Each hub groups several existing calculators behind mode tabs. The
// underlying `Category` keys are unchanged, so all per-category logic
// (results, learning mode, diagrams) keeps working as-is.

export interface HubItem {
  key: Category;
  label: string;
}

export interface Hub {
  key: string;
  title: string;
  description: string;
  items: HubItem[];
}

export const HUBS: Hub[] = [
  {
    key: 'convert',
    title: 'Convert',
    description: 'Units & optical conversions',
    items: [
      // Length is folded into the diopters tool — entering a length unit there
      // already outputs power plus every other length unit.
      { key: 'diopters', label: 'Length & Power' },
      { key: 'prism', label: 'Prism Angles' },
      { key: 'curvature', label: 'Radius ↔ Power' },
    ],
  },
  {
    key: 'rxTools',
    title: 'Rx Tools',
    description: 'Prescription & effective power',
    items: [
      { key: 'transpose', label: 'Transpose' },
      { key: 'sphEquiv', label: 'Sph Equiv' },
      { key: 'vertex', label: 'Vertex' },
      { key: 'asWorn', label: 'As-Worn' },
    ],
  },
  {
    key: 'lenses',
    title: 'Lenses',
    description: 'Thickness, material & design',
    items: [
      { key: 'thickness', label: 'Thickness' },
      { key: 'materialCompare', label: 'Materials' },
      { key: 'baseCurve', label: 'Base Curve' },
      { key: 'magnification', label: 'Magnify' },
    ],
  },
  {
    key: 'prismTools',
    title: 'Prism',
    description: 'Prism analysis',
    items: [
      { key: 'decenterForPrism', label: 'Decenter for Rx' },
      { key: 'prismCompound', label: 'Compound / Resolve' },
      { key: 'prentice', label: 'Prentice' },
    ],
  },
  {
    key: 'fitting',
    title: 'Fitting',
    description: 'Frame & PD measurements',
    items: [
      { key: 'framePd', label: 'Frame PD' },
      { key: 'mbs', label: 'Min Blank' },
      { key: 'nearPd', label: 'Near PD' },
    ],
  },
  {
    key: 'refraction',
    title: 'Refraction',
    description: 'Clinical refraction & lane',
    items: [
      { key: 'nearAdd', label: 'Near Add' },
      { key: 'javal', label: 'Javal' },
      { key: 'examLane', label: 'Exam Lane' },
    ],
  },
  {
    key: 'reference',
    title: 'Reference',
    description: 'Abbreviations & materials',
    items: [{ key: 'reference', label: 'Reference' }],
  },
];

// ─── Length Units ──────────────────────────────────────────

export type LengthUnit = 'mm' | 'cm' | 'dm' | 'm' | 'in' | 'ft';

export interface UnitInfo {
  key: LengthUnit;
  label: string;
  abbr: string;
  toMeters: number;
}

export const LENGTH_UNITS: UnitInfo[] = [
  { key: 'mm', label: 'Millimeters', abbr: 'mm', toMeters: 0.001 },
  { key: 'cm', label: 'Centimeters', abbr: 'cm', toMeters: 0.01 },
  { key: 'dm', label: 'Decimeters', abbr: 'dm', toMeters: 0.1 },
  { key: 'm', label: 'Meters', abbr: 'm', toMeters: 1 },
  { key: 'in', label: 'Inches', abbr: 'in', toMeters: 0.0254 },
  { key: 'ft', label: 'Feet', abbr: 'ft', toMeters: 0.3048 },
];

// ─── Length Conversions ────────────────────────────────────

export interface LengthResult {
  unit: UnitInfo;
  value: number;
}

export function convertLength(value: number, fromUnit: LengthUnit): LengthResult[] {
  const from = LENGTH_UNITS.find((u) => u.key === fromUnit)!;
  const meters = value * from.toMeters;
  return LENGTH_UNITS.filter((u) => u.key !== fromUnit).map((u) => ({
    unit: u,
    value: meters / u.toMeters,
  }));
}

export function lengthToDiopters(value: number, fromUnit: LengthUnit): number | null {
  const from = LENGTH_UNITS.find((u) => u.key === fromUnit)!;
  const meters = value * from.toMeters;
  if (meters === 0) return null;
  return 1 / meters;
}

// ─── Diopter Conversions ───────────────────────────────────

export type DioptersInputUnit = LengthUnit | 'D';

export interface DioptersResult {
  label: string;
  abbr: string;
  value: number;
}

export function convertDiopters(value: number, fromUnit: DioptersInputUnit): DioptersResult[] {
  if (value === 0) return [];

  let meters: number;
  if (fromUnit === 'D') {
    meters = 1 / value;
  } else {
    const unit = LENGTH_UNITS.find((u) => u.key === fromUnit)!;
    meters = value * unit.toMeters;
  }
  if (meters === 0) return [];

  const diopters = 1 / meters;
  const results: DioptersResult[] = [];
  if (fromUnit !== 'D') {
    results.push({ label: 'Diopters', abbr: 'D', value: diopters });
  }
  for (const u of LENGTH_UNITS) {
    if (u.key !== fromUnit) {
      results.push({ label: u.label, abbr: u.abbr, value: meters / u.toMeters });
    }
  }
  return results;
}

// ─── Prism Conversions ─────────────────────────────────────

export type PrismUnit = 'prismDiopters' | 'degrees';

export function prismDioptersToDegrees(prismDiopters: number): number {
  return (Math.atan(prismDiopters / 100) * 180) / Math.PI;
}

export function degreesToPrismDiopters(degrees: number): number {
  const radians = (degrees * Math.PI) / 180;
  return 100 * Math.tan(radians);
}

export function convertPrism(
  value: number,
  fromUnit: PrismUnit
): { label: string; abbr: string; value: number } {
  if (fromUnit === 'prismDiopters') {
    return { label: 'Degrees', abbr: '°', value: prismDioptersToDegrees(value) };
  }
  return { label: 'Prism Diopters', abbr: 'Δ', value: degreesToPrismDiopters(value) };
}

// Extended angular units for the deviation angle θ where Δ = 100·tan θ.
export type PrismAngleUnit =
  | 'prismDiopters'
  | 'degrees'
  | 'radians'
  | 'arcmin'
  | 'arcsec';

// Convert any prism/angular input into the deviation angle θ in radians.
export function prismToTheta(value: number, unit: PrismAngleUnit): number {
  switch (unit) {
    case 'prismDiopters':
      return Math.atan(value / 100);
    case 'degrees':
      return (value * Math.PI) / 180;
    case 'radians':
      return value;
    case 'arcmin':
      return ((value / 60) * Math.PI) / 180;
    case 'arcsec':
      return ((value / 3600) * Math.PI) / 180;
  }
}

// Produce all angular representations except the input unit.
export function convertPrismAngles(
  value: number,
  unit: PrismAngleUnit
): { key: PrismAngleUnit; label: string; abbr: string; value: number }[] {
  const theta = prismToTheta(value, unit);
  const deg = (theta * 180) / Math.PI;
  const all: { key: PrismAngleUnit; label: string; abbr: string; value: number }[] = [
    { key: 'prismDiopters', label: 'Prism Diopters', abbr: 'Δ', value: 100 * Math.tan(theta) },
    { key: 'degrees', label: 'Degrees', abbr: '°', value: deg },
    { key: 'radians', label: 'Radians', abbr: 'rad', value: theta },
    { key: 'arcmin', label: 'Arcminutes', abbr: '′', value: deg * 60 },
    { key: 'arcsec', label: 'Arcseconds', abbr: '″', value: deg * 3600 },
  ];
  return all.filter((a) => a.key !== unit);
}

// ─── Vertex Distance (spherocylindrical) ───────────────────

export function compensateVertexDistance(
  originalPower: number,
  originalVertexMm: number,
  newVertexMm: number
): number {
  // d is the decrease in vertex distance (positive when the lens moves toward
  // the eye, e.g. glasses 12mm → contacts 0mm gives d = +0.012m)
  const d = (originalVertexMm - newVertexMm) / 1000;
  const denominator = 1 - d * originalPower;
  if (denominator === 0) return Infinity;
  return originalPower / denominator;
}

export interface SpheroCylRx {
  sphere: number;
  cylinder: number;
  axis: number;
}

export function compensateVertexSpheroCyl(
  rx: SpheroCylRx,
  originalVertexMm: number,
  newVertexMm: number
): SpheroCylRx {
  // Compensate each principal meridian independently
  const meridian1 = rx.sphere;
  const meridian2 = rx.sphere + rx.cylinder;

  const newMeridian1 = compensateVertexDistance(meridian1, originalVertexMm, newVertexMm);
  const newMeridian2 = compensateVertexDistance(meridian2, originalVertexMm, newVertexMm);

  return {
    sphere: roundToStep(newMeridian1, 0.25),
    cylinder: roundToStep(newMeridian2 - newMeridian1, 0.25),
    axis: rx.axis, // axis doesn't change
  };
}

export const VERTEX_PRESETS = {
  glasses: 12,
  contacts: 0,
};

// ─── Lens Thickness ────────────────────────────────────────

export interface LensThicknessInput {
  power: number;
  diameter: number;
  refractiveIndex: number;
  minThickness: number;
}

export interface LensThicknessResult {
  centerThickness: number;
  edgeThickness: number;
  isPlusLens: boolean;
}

export interface MaterialInfo {
  value: number; // refractive index
  label: string; // short label used in chips
  name: string; // full material name
  specificGravity: number; // g/cm³ (nominal)
  abbe: number; // Abbe value — higher = less chromatic aberration
}

// Nominal published values; real products vary slightly by manufacturer.
export const REFRACTIVE_INDICES: MaterialInfo[] = [
  { value: 1.5, label: 'CR-39 (1.50)', name: 'CR-39', specificGravity: 1.32, abbe: 58 },
  { value: 1.53, label: 'Trivex (1.53)', name: 'Trivex', specificGravity: 1.11, abbe: 43 },
  { value: 1.59, label: 'Poly (1.59)', name: 'Polycarbonate', specificGravity: 1.2, abbe: 30 },
  { value: 1.6, label: 'Mid (1.60)', name: '1.60 (MR-8)', specificGravity: 1.3, abbe: 41 },
  { value: 1.67, label: 'High (1.67)', name: '1.67 (MR-10)', specificGravity: 1.36, abbe: 32 },
  { value: 1.74, label: 'Ultra (1.74)', name: '1.74 (MR-174)', specificGravity: 1.47, abbe: 33 },
];

export function calculateLensThickness(input: LensThicknessInput): LensThicknessResult {
  const { power, diameter, refractiveIndex, minThickness } = input;
  const r = diameter / 2;
  const sag = (r * r * Math.abs(power)) / (2000 * (refractiveIndex - 1));
  const isPlusLens = power >= 0;

  if (isPlusLens) {
    const edgeThickness = minThickness;
    const centerThickness = edgeThickness + sag;
    return { centerThickness, edgeThickness, isPlusLens };
  } else {
    const centerThickness = minThickness;
    const edgeThickness = centerThickness + sag;
    return { centerThickness, edgeThickness, isPlusLens };
  }
}

// Rough relative weight estimate for comparison: model the lens as a disc
// whose thickness is the average of center and edge. Real lenses are curved,
// so this is a first-order estimate — consistent across materials, which is
// what matters for an apples-to-apples comparison.
export function estimateLensWeight(
  centerThickness: number,
  edgeThickness: number,
  diameterMm: number,
  specificGravity: number
): number {
  const rCm = diameterMm / 2 / 10;
  const avgThicknessCm = (centerThickness + edgeThickness) / 2 / 10;
  const volumeCm3 = Math.PI * rCm * rCm * avgThicknessCm;
  return volumeCm3 * specificGravity;
}

// ─── Rx Transposition ──────────────────────────────────────

// Normalize a cylinder axis into the optometric 1–180° range. An axis is
// modulo 180 (200° ≡ 20°), and 0° is conventionally written as 180°.
export function normalizeAxis(axis: number): number {
  if (!isFinite(axis)) return axis;
  let a = axis % 180;
  if (a <= 0) a += 180;
  return a;
}

export function transposeRx(rx: SpheroCylRx): SpheroCylRx {
  const newSphere = roundTo(rx.sphere + rx.cylinder, 2);
  const newCylinder = roundTo(-rx.cylinder, 2);
  const axis = normalizeAxis(rx.axis);
  const newAxis = axis <= 90 ? axis + 90 : axis - 90;
  return { sphere: newSphere, cylinder: newCylinder, axis: newAxis };
}

// ─── Spherical Equivalent ──────────────────────────────────

export function sphericalEquivalent(sphere: number, cylinder: number): number {
  return roundTo(sphere + cylinder / 2, 2);
}

// ─── Minimum Blank Size ────────────────────────────────────

export interface MBSInput {
  ed: number; // effective diameter of the frame (mm)
  framePd: number; // frame PD: A + DBL (mm)
  patientPd: number; // patient PD (mm)
}

export function calculateMBS(input: MBSInput): {
  decentration: number;
  mbs: number;
} {
  const decentration = (input.framePd - input.patientPd) / 2;
  const mbs = input.ed + 2 * Math.abs(decentration) + 2;
  return { decentration, mbs };
}

// ─── Prentice's Rule ───────────────────────────────────────

export function prenticeRule(decentrationMm: number, powerDiopters: number): number {
  // P (Δ) = c (cm) × F (D)
  const decentrationCm = decentrationMm / 10;
  return Math.abs(decentrationCm * powerDiopters);
}

// Power in a given meridian of a spherocylindrical Rx.
// F(θ) = sphere + cylinder · sin²(θ − axis)
export function powerAtMeridian(
  sphere: number,
  cylinder: number,
  axis: number,
  meridian: number
): number {
  const a = ((meridian - axis) * Math.PI) / 180;
  return sphere + cylinder * Math.sin(a) * Math.sin(a);
}

// Inverse Prentice: decentration (mm) needed to induce a prism in a meridian.
// c (mm) = 10 × prism (Δ) ÷ |power (D)|
export function decentrationForPrism(prismDiopters: number, powerDiopters: number): number {
  if (powerDiopters === 0) return Infinity;
  return (10 * Math.abs(prismDiopters)) / Math.abs(powerDiopters);
}

// Direction to move the optical center to induce a given prism base.
// Rule: a PLUS lens is decentered TOWARD the base; a MINUS lens AWAY from
// the base (toward the apex). Returns the OC move direction.
export type HBaseDir = 'BI' | 'BO';
export type VBaseDir = 'BU' | 'BD';

export function ocHorizontalMove(base: HBaseDir, power: number): 'IN' | 'OUT' {
  const towardBase = power >= 0; // plus → toward base, minus → away
  if (base === 'BO') return towardBase ? 'OUT' : 'IN';
  return towardBase ? 'IN' : 'OUT';
}

export function ocVerticalMove(base: VBaseDir, power: number): 'UP' | 'DOWN' {
  const towardBase = power >= 0;
  if (base === 'BU') return towardBase ? 'UP' : 'DOWN';
  return towardBase ? 'DOWN' : 'UP';
}

// ─── Javal's Rule ──────────────────────────────────────────

export interface JavalResult {
  cornealCyl: number;
  axis: number;
  rule: string;
}

export function javalsRule(
  k1: number,
  k2: number,
  k1Axis: number,
  k2Axis: number
): JavalResult {
  // Javal's Rule: Expected refractive cyl ≈ (1.25 × corneal cyl) - 0.50 WTR
  // Corneal cyl = |K1 - K2|
  const cornealCyl = Math.abs(k1 - k2);
  const steepK = k1 > k2 ? k1 : k2;
  const steepAxis = normalizeAxis(k1 > k2 ? k1Axis : k2Axis);

  // WTR: steep meridian at or near 90° (axis 180)
  // ATR: steep meridian at or near 180° (axis 90)
  const isWTR = steepAxis >= 60 && steepAxis <= 120;
  const rule = isWTR ? 'WTR' : 'ATR';

  // For WTR: predicted = 1.25 × cornealCyl - 0.50 (minus cyl at axis near 180)
  // For ATR: predicted = 1.25 × cornealCyl + 0.50 (minus cyl at axis near 90)
  // Clamp at 0: a small WTR cornea can drive the raw figure slightly negative,
  // which is meaningless as a minus-cylinder magnitude.
  const predicted = Math.max(
    0,
    isWTR ? 1.25 * cornealCyl - 0.5 : 1.25 * cornealCyl + 0.5
  );

  // Axis of the predicted minus cylinder is at the flat meridian
  const flatAxis = normalizeAxis(k1 > k2 ? k2Axis : k1Axis);

  return {
    cornealCyl: roundTo(predicted, 2),
    axis: flatAxis,
    rule,
  };
}

// ─── Frame PD & Decentration ───────────────────────────────

export interface FramePdResult {
  framePd: number;
  decentrationPerEye: number;
  totalDecentration: number;
}

export function calculateFramePd(
  aSize: number,
  dbl: number,
  patientPd: number
): FramePdResult {
  const framePd = aSize + dbl;
  const totalDecentration = framePd - patientPd;
  const decentrationPerEye = totalDecentration / 2;
  return { framePd, decentrationPerEye, totalDecentration };
}

// ─── Near PD ───────────────────────────────────────────────

export function calculateNearPd(
  distancePd: number,
  workingDistanceCm: number
): number {
  // The working distance is measured from the spectacle plane. The visual axes
  // pivot at the centers of rotation, ~27 mm behind the lens, so by similar
  // triangles each line of sight crosses the spectacle plane closer to the nose:
  //   Near PD = Distance PD × WD / (WD + 27mm)
  // (WD and the 27 mm offset both in millimeters.)
  const vertexToRotation = 27; // mm, spectacle plane → center of rotation
  const workingDistanceMm = workingDistanceCm * 10;
  return roundTo(
    distancePd * (workingDistanceMm / (workingDistanceMm + vertexToRotation)),
    1
  );
}

// ─── Near Add / Accommodation ──────────────────────────────

// Dioptric demand for a working distance: D = 1 / distance(m).
export function accommodativeDemand(workingDistanceCm: number): number {
  if (workingDistanceCm <= 0) return 0;
  return 1 / (workingDistanceCm / 100);
}

export interface AmplitudeRange {
  min: number;
  avg: number;
  max: number;
}

// Hofstetter's formulas estimate amplitude of accommodation from age.
export function hofstetterAmplitude(age: number): AmplitudeRange {
  return {
    max: Math.max(0, 25 - 0.4 * age),
    avg: Math.max(0, 18.5 - 0.3 * age),
    min: Math.max(0, 15 - 0.25 * age),
  };
}

// Tentative add leaves half the amplitude in reserve for comfort.
// Add = demand − (amplitude ÷ 2), never negative.
export function tentativeAdd(demand: number, amplitude: number): number {
  return Math.max(0, demand - amplitude / 2);
}

// NRA/PRA refinement of a tentative add.
// Final Add = Tentative Add + (NRA + PRA) ÷ 2
// NRA is entered as a plus value, PRA as a minus value.
export function balanceAdd(tentative: number, nra: number, pra: number): number {
  return tentative + (nra + pra) / 2;
}

// ─── Prism Compounding / Resolving ─────────────────────────

// Combine horizontal + vertical prism into a single resultant.
// angle is measured from the horizontal meridian, 0–90°.
export function compoundPrism(
  horizontal: number,
  vertical: number
): { resultant: number; angle: number } {
  const h = Math.abs(horizontal);
  const v = Math.abs(vertical);
  const resultant = Math.sqrt(h * h + v * v);
  const angle = resultant === 0 ? 0 : (Math.atan2(v, h) * 180) / Math.PI;
  return { resultant, angle };
}

// Split a resultant prism into horizontal + vertical components.
// angleDeg is measured from the horizontal meridian.
export function resolvePrism(
  resultant: number,
  angleDeg: number
): { horizontal: number; vertical: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    horizontal: resultant * Math.cos(rad),
    vertical: resultant * Math.sin(rad),
  };
}

// ─── Base Curve Selection (Vogel's Rule) ───────────────────

export interface BaseCurveResult {
  vogel: number;
  description: string;
}

export function calculateBaseCurve(sphere: number, cylinder: number): BaseCurveResult {
  // Vogel's Rule uses the spherical equivalent (SE = Sphere + Cylinder/2):
  //   Plus  Rx (SE ≥ 0):  Base Curve = SE + 6.00
  //   Minus Rx (SE < 0):  Base Curve = (SE / 2) + 6.00
  // The minus-lens form halves the SE; using SE + 6 for minus Rx (the old
  // behavior) flattened recommendations far too much for higher minus powers.
  const se = sphere + cylinder / 2;
  const vogel = roundTo(se >= 0 ? se + 6 : se / 2 + 6, 2);

  let description: string;
  if (vogel <= 2) description = 'Very flat — high minus Rx';
  else if (vogel <= 4) description = 'Flat — moderate minus Rx';
  else if (vogel <= 6) description = 'Standard — low power Rx';
  else if (vogel <= 8) description = 'Steep — moderate plus Rx';
  else description = 'Very steep — high plus Rx';

  return { vogel, description };
}

// ─── Spectacle Magnification ───────────────────────────────

export interface MagnificationInput {
  power: number; // back vertex power (D)
  centerThickness: number; // in mm
  frontCurve: number; // front surface power (D)
  refractiveIndex: number;
  vertexDistance: number; // in mm
}

export interface MagnificationResult {
  shapeFactor: number;
  powerFactor: number;
  totalMagnification: number;
  percentChange: number;
}

export function calculateMagnification(input: MagnificationInput): MagnificationResult {
  const { power, centerThickness, frontCurve, refractiveIndex, vertexDistance } = input;
  const tMeters = centerThickness / 1000;
  const dMeters = vertexDistance / 1000;

  // Shape factor = 1 / (1 - (t/n) × F1)
  const shapeFactor = 1 / (1 - (tMeters / refractiveIndex) * frontCurve);

  // Power factor = 1 / (1 - d × Fv)
  const powerFactor = 1 / (1 - dMeters * power);

  const totalMagnification = shapeFactor * powerFactor;
  const percentChange = (totalMagnification - 1) * 100;

  return {
    shapeFactor: roundTo(shapeFactor, 4),
    powerFactor: roundTo(powerFactor, 4),
    totalMagnification: roundTo(totalMagnification, 4),
    percentChange: roundTo(percentChange, 2),
  };
}

// ─── As-Worn / Pantoscopic Tilt (Martin's tilt formula) ────

export interface AsWornResult {
  asWornSphere: number;
  inducedCylinder: number;
  inducedAxis: number; // pantoscopic tilt induces cyl at axis 180
  sphereChange: number;
}

// When a lens of power F is tilted by angle θ about the horizontal axis
// (pantoscopic tilt), Martin's approximation gives:
//   New sphere   S' = F · (1 + sin²θ / 2n)
//   Induced cyl  C  = F · tan²θ   (axis along the rotation axis, ~180°)
export function pantoscopicTilt(power: number, tiltDeg: number, n: number): AsWornResult {
  const theta = (tiltDeg * Math.PI) / 180;
  const sin2 = Math.sin(theta) * Math.sin(theta);
  const tan2 = Math.tan(theta) * Math.tan(theta);
  const asWornSphere = power * (1 + sin2 / (2 * n));
  const inducedCylinder = power * tan2;
  return {
    asWornSphere,
    inducedCylinder,
    inducedAxis: 180,
    sphereChange: asWornSphere - power,
  };
}

// ─── Exam Lane / Optotype Sizing ───────────────────────────

export interface OptotypeResult {
  letterArcmin: number; // angular size of whole letter
  letterRad: number;
  mar: number; // minimum angle of resolution (one stroke), arcmin
  letterHeightMm: number;
  strokeMm: number;
}

// A Snellen optotype subtends 5 arcmin total (1 arcmin per stroke) on the line
// it represents. For acuity num/den, the letter subtends 5·(den/num) arcmin.
// Physical height at the test distance: h = 2·d·tan(angle/2).
export function optotypeSize(
  distanceMm: number,
  snellenNum: number,
  snellenDen: number
): OptotypeResult {
  const mar = snellenNum !== 0 ? snellenDen / snellenNum : 0; // arcmin per stroke
  const letterArcmin = 5 * mar;
  const letterRad = (letterArcmin * (Math.PI / 180)) / 60;
  const letterHeightMm = 2 * distanceMm * Math.tan(letterRad / 2);
  return {
    letterArcmin,
    letterRad,
    mar,
    letterHeightMm,
    strokeMm: letterHeightMm / 5,
  };
}

// ─── Radius of Curvature ↔ Power (keratometry / base curves) ─

// Surface power from radius of curvature: F = (n − 1) / r.
// With the keratometric index n = 1.3375, F (D) = 337.5 / r(mm).
export function radiusToPower(radiusMm: number, n: number): number {
  if (radiusMm === 0) return Infinity;
  return ((n - 1) * 1000) / radiusMm;
}

export function powerToRadius(power: number, n: number): number {
  if (power === 0) return Infinity;
  return ((n - 1) * 1000) / power;
}

// ─── Formatting ────────────────────────────────────────────

export function formatNumber(value: number, maxDecimals: number = 4): string {
  if (!isFinite(value)) return '---';
  const fixed = value.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
}

export function formatRx(rx: SpheroCylRx): string {
  if (!isFinite(rx.sphere) || !isFinite(rx.cylinder)) return '---';
  const sphSign = rx.sphere >= 0 ? '+' : '';
  const cylSign = rx.cylinder >= 0 ? '+' : '';
  return `${sphSign}${rx.sphere.toFixed(2)} / ${cylSign}${rx.cylinder.toFixed(2)} × ${rx.axis}`;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Snap a power to the nearest dispensing step (e.g. 0.25 D). Preserves
// non-finite values so callers can still detect Infinity/NaN.
export function roundToStep(value: number, step: number): number {
  if (!isFinite(value)) return value;
  return Math.round(value / step) * step;
}
