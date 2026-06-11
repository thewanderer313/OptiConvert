import { REFRACTIVE_INDICES } from './conversions';

export interface Abbreviation {
  abbr: string;
  meaning: string;
  context: string;
}

export const RX_ABBREVIATIONS: Abbreviation[] = [
  { abbr: 'OD', meaning: 'Oculus Dexter', context: 'Right eye' },
  { abbr: 'OS', meaning: 'Oculus Sinister', context: 'Left eye' },
  { abbr: 'OU', meaning: 'Oculus Uterque', context: 'Both eyes' },
  { abbr: 'SPH', meaning: 'Sphere', context: 'Spherical lens power (D)' },
  { abbr: 'CYL', meaning: 'Cylinder', context: 'Cylindrical lens power (D)' },
  { abbr: 'AXIS', meaning: 'Axis', context: 'Cylinder orientation (1-180°)' },
  { abbr: 'ADD', meaning: 'Addition', context: 'Near add power for multifocals' },
  { abbr: 'PD', meaning: 'Pupillary Distance', context: 'Distance between pupils (mm)' },
  { abbr: 'BVD / VD', meaning: 'Back Vertex Distance', context: 'Lens-to-cornea distance (mm)' },
  { abbr: 'BC', meaning: 'Base Curve', context: 'Front surface curvature of lens' },
  { abbr: 'OC', meaning: 'Optical Center', context: 'Center of lens power' },
  { abbr: 'DIA', meaning: 'Diameter', context: 'Lens diameter (mm)' },
  { abbr: 'ED', meaning: 'Effective Diameter', context: 'Longest frame diameter (mm)' },
  { abbr: 'DBL', meaning: 'Distance Between Lenses', context: 'Bridge size (mm)' },
  { abbr: 'A / B', meaning: 'Box Dimensions', context: 'Horizontal / vertical frame size' },
  { abbr: 'SEG HT', meaning: 'Segment Height', context: 'Bifocal/progressive segment height' },
  { abbr: 'MBS', meaning: 'Minimum Blank Size', context: 'Smallest usable lens blank' },
  { abbr: 'NV / DV', meaning: 'Near / Distance Vision', context: 'Near vs distance Rx' },
  { abbr: 'Δ (Prism)', meaning: 'Prism Diopter', context: 'Unit of prismatic deviation' },
  { abbr: 'BI / BO', meaning: 'Base In / Base Out', context: 'Prism base direction (horizontal)' },
  { abbr: 'BU / BD', meaning: 'Base Up / Base Down', context: 'Prism base direction (vertical)' },
  { abbr: 'CT', meaning: 'Center Thickness', context: 'Thickness at optical center' },
  { abbr: 'ET', meaning: 'Edge Thickness', context: 'Thickness at lens edge' },
  { abbr: 'n', meaning: 'Refractive Index', context: 'Material light-bending property' },
  { abbr: 'K', meaning: 'Keratometry', context: 'Corneal curvature reading (D)' },
  { abbr: 'WTR', meaning: 'With The Rule', context: 'Steep meridian near 90°' },
  { abbr: 'ATR', meaning: 'Against The Rule', context: 'Steep meridian near 180°' },
  { abbr: 'Plano / PL', meaning: 'Plano', context: 'Zero power / no correction' },
  { abbr: 'SV', meaning: 'Single Vision', context: 'One focal power throughout' },
  { abbr: 'PAL / Prog', meaning: 'Progressive', context: 'Progressive addition lens' },
  { abbr: 'FT / ST', meaning: 'Flat Top / Straight Top', context: 'Bifocal/trifocal segment type' },
];

export interface MaterialInfo {
  name: string;
  index: number;
  abbe: number;
  specificGravity: number;
  uvCutoff: string;
  impactResistance: string;
  notes: string;
}

// Presentation-only metadata for the Reference tab, keyed by refractive index.
// The optical numbers (Abbe value, specific gravity) are NOT duplicated here —
// they come from REFRACTIVE_INDICES so the Reference tab and the Materials
// comparison tool can never disagree on the same property.
const MATERIAL_REFERENCE_META: Record<
  string,
  { name: string; uvCutoff: string; impactResistance: string; notes: string }
> = {
  '1.5': { name: 'CR-39', uvCutoff: '350 nm', impactResistance: 'Low', notes: 'Best optics, lightweight, easy to tint' },
  '1.53': { name: 'Trivex', uvCutoff: '380 nm', impactResistance: 'Excellent', notes: 'Lightest, great impact resistance, good optics' },
  '1.59': { name: 'Polycarbonate', uvCutoff: '380 nm', impactResistance: 'Excellent', notes: 'Impact resistant, thinner than CR-39, lower optics' },
  '1.6': { name: 'Mid-Index 1.60', uvCutoff: '380 nm', impactResistance: 'Moderate', notes: 'Good balance of thinness and optics' },
  '1.67': { name: 'High-Index 1.67', uvCutoff: '380 nm', impactResistance: 'Moderate', notes: 'Thin, good for moderate-high Rx' },
  '1.74': { name: 'Ultra High-Index 1.74', uvCutoff: '380 nm', impactResistance: 'Low', notes: 'Thinnest, best for high Rx, heaviest' },
};

export const LENS_MATERIALS: MaterialInfo[] = [
  ...REFRACTIVE_INDICES.map((m): MaterialInfo => {
    const meta = MATERIAL_REFERENCE_META[String(m.value)];
    return {
      name: meta?.name ?? m.name,
      index: m.value,
      abbe: m.abbe,
      specificGravity: m.specificGravity,
      uvCutoff: meta?.uvCutoff ?? '—',
      impactResistance: meta?.impactResistance ?? '—',
      notes: meta?.notes ?? '',
    };
  }),
  // Glass is reference-only (not offered in the comparison tool), so its values
  // live here rather than in the engine table.
  {
    name: 'Glass (Crown)',
    index: 1.523,
    abbe: 59,
    specificGravity: 2.54,
    uvCutoff: '310 nm',
    impactResistance: 'Very Low',
    notes: 'Best scratch resistance, heaviest, rarely used',
  },
];
