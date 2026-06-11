import {
  Category,
  LengthUnit,
  LENGTH_UNITS,
  DioptersInputUnit,
  PrismUnit,
  PrismAngleUnit,
  prismToTheta,
  convertPrismAngles,
  pantoscopicTilt,
  SpheroCylRx,
  transposeRx,
  normalizeAxis,
  sphericalEquivalent,
  calculateMBS,
  prenticeRule,
  javalsRule,
  calculateFramePd,
  calculateNearPd,
  calculateBaseCurve,
  calculateMagnification,
  compensateVertexSpheroCyl,
  compensateVertexDistance,
  roundToStep,
  formatNumber,
  formatRx,
  MBSInput,
  MagnificationInput,
  MagnificationResult,
  JavalResult,
  FramePdResult,
  BaseCurveResult,
} from './conversions';

export interface LearningStep {
  title: string;
  formula?: string;
  work: string;
}

export interface LearningContent {
  conceptTitle: string;
  conceptDescription: string;
  steps: LearningStep[];
}

// ─── Length Learning ───────────────────────────────────────

export function getLengthLearning(
  value: number,
  fromUnit: LengthUnit
): LearningContent {
  const from = LENGTH_UNITS.find((u) => u.key === fromUnit)!;
  const meters = value * from.toMeters;
  const diopters = meters !== 0 ? 1 / meters : null;

  const steps: LearningStep[] = [
    {
      title: `Convert ${from.abbr} to meters`,
      formula: `meters = value × ${from.toMeters}`,
      work: `${formatNumber(value)} ${from.abbr} × ${from.toMeters} = ${formatNumber(meters)} m`,
    },
  ];

  // Show conversion to each other unit
  for (const u of LENGTH_UNITS) {
    if (u.key !== fromUnit && u.key !== 'm') {
      const converted = meters / u.toMeters;
      steps.push({
        title: `Convert meters to ${u.abbr}`,
        formula: `${u.abbr} = meters ÷ ${u.toMeters}`,
        work: `${formatNumber(meters)} m ÷ ${u.toMeters} = ${formatNumber(converted)} ${u.abbr}`,
      });
    }
  }

  if (diopters !== null) {
    steps.push({
      title: 'Focal length to diopters',
      formula: 'D = 1 ÷ focal length (in meters)',
      work: `D = 1 ÷ ${formatNumber(meters)} = ${formatNumber(diopters)} D`,
    });
  }

  return {
    conceptTitle: 'Unit Conversion',
    conceptDescription:
      'All length conversions go through meters as the base unit. Diopters represent the optical power of a lens and equal the reciprocal of the focal length in meters.',
    steps,
  };
}

// ─── Diopter Learning ──────────────────────────────────────

export function getDiopterLearning(
  value: number,
  fromUnit: DioptersInputUnit
): LearningContent {
  const steps: LearningStep[] = [];

  if (fromUnit === 'D') {
    const meters = value !== 0 ? 1 / value : 0;
    steps.push({
      title: 'Diopters to focal length',
      formula: 'f (meters) = 1 ÷ D',
      work: `f = 1 ÷ ${formatNumber(value)} = ${formatNumber(meters)} m`,
    });

    for (const u of LENGTH_UNITS) {
      if (u.key !== 'm') {
        steps.push({
          title: `Convert to ${u.label}`,
          formula: `${u.abbr} = meters ÷ ${u.toMeters}`,
          work: `${formatNumber(meters)} ÷ ${u.toMeters} = ${formatNumber(meters / u.toMeters)} ${u.abbr}`,
        });
      }
    }
  } else {
    const unit = LENGTH_UNITS.find((u) => u.key === fromUnit)!;
    const meters = value * unit.toMeters;
    const diopters = meters !== 0 ? 1 / meters : 0;

    steps.push({
      title: `Convert ${unit.abbr} to meters`,
      formula: `meters = value × ${unit.toMeters}`,
      work: `${formatNumber(value)} × ${unit.toMeters} = ${formatNumber(meters)} m`,
    });
    steps.push({
      title: 'Calculate diopter power',
      formula: 'D = 1 ÷ f (meters)',
      work: `D = 1 ÷ ${formatNumber(meters)} = ${formatNumber(diopters)} D`,
    });
  }

  return {
    conceptTitle: 'Diopter Power',
    conceptDescription:
      'A diopter (D) measures the optical power of a lens. It equals the reciprocal of the focal length in meters. A +2.00 D lens focuses light at 0.5 meters (50 cm).',
    steps,
  };
}

// ─── Prism Learning ────────────────────────────────────────

const PRISM_UNIT_NAMES: Record<PrismAngleUnit, string> = {
  prismDiopters: 'prism diopters (Δ)',
  degrees: 'degrees (°)',
  radians: 'radians (rad)',
  arcmin: 'arcminutes (′)',
  arcsec: 'arcseconds (″)',
};

export function getPrismLearning(
  value: number,
  fromUnit: PrismAngleUnit
): LearningContent {
  const theta = prismToTheta(value, fromUnit); // deviation angle in radians
  const degrees = (theta * 180) / Math.PI;
  const outputs = convertPrismAngles(value, fromUnit);

  const steps: LearningStep[] = [
    {
      title: 'Find the deviation angle θ',
      formula: 'Δ = 100 × tan(θ)  ⇒  θ = arctan(Δ ÷ 100)',
      work: `Input ${formatNumber(value)} ${PRISM_UNIT_NAMES[fromUnit]} → θ = ${formatNumber(theta, 6)} rad = ${formatNumber(degrees, 4)}°`,
    },
    {
      title: 'Degrees ↔ radians',
      formula: 'radians = degrees × π ÷ 180',
      work: `${formatNumber(degrees, 4)}° × π ÷ 180 = ${formatNumber(theta, 6)} rad`,
    },
    {
      title: 'Arc subdivisions of the angle',
      formula: "1° = 60′ (arcminutes) = 3600″ (arcseconds)",
      work: `${formatNumber(degrees, 4)}° = ${formatNumber(degrees * 60, 2)}′ = ${formatNumber(degrees * 3600, 1)}″`,
    },
    {
      title: 'Prism diopters from the angle',
      formula: 'Δ = 100 × tan(θ)',
      work: `Δ = 100 × tan(${formatNumber(theta, 6)}) = ${formatNumber(100 * Math.tan(theta), 4)} Δ`,
    },
    {
      title: 'All equivalent values',
      work: outputs.map((o) => `${formatNumber(o.value, 4)} ${o.abbr}`).join('  ·  '),
    },
  ];

  return {
    conceptTitle: 'Prism & Angular Deviation',
    conceptDescription:
      'A prism diopter (Δ) measures how much a prism displaces light — 1Δ deflects light 1 cm at 1 meter. It relates to the deviation angle by Δ = 100 × tan(θ). The same angle can be expressed in degrees, radians, arcminutes, or arcseconds.',
    steps,
  };
}

// ─── Vertex Distance Learning ──────────────────────────────

export function getVertexLearning(
  power: number,
  originalMm: number,
  newMm: number,
  cylinder?: number,
  axis?: number
): LearningContent {
  // Spherocylindrical mode
  if (cylinder !== undefined && axis !== undefined) {
    const rx: SpheroCylRx = { sphere: power, cylinder, axis };
    const meridian1 = rx.sphere;
    const meridian2 = rx.sphere + rx.cylinder;
    const d = (originalMm - newMm) / 1000;

    const denom1 = 1 - d * meridian1;
    const newMeridian1 = denom1 !== 0 ? meridian1 / denom1 : Infinity;
    const denom2 = 1 - d * meridian2;
    const newMeridian2 = denom2 !== 0 ? meridian2 / denom2 : Infinity;

    const result = compensateVertexSpheroCyl(rx, originalMm, newMm);

    return {
      conceptTitle: 'Vertex Distance Compensation (Spherocylindrical)',
      conceptDescription:
        'For spherocylindrical lenses, each principal meridian is compensated independently. The sphere meridian and the sphere+cylinder meridian are each adjusted using F_new = F / (1 - d × F), then recombined into sphere/cylinder/axis form.',
      steps: [
        {
          title: 'Identify the two principal meridians',
          formula: 'Meridian 1 = Sphere; Meridian 2 = Sphere + Cylinder',
          work: `Meridian 1 = ${formatNumber(meridian1)} D; Meridian 2 = ${formatNumber(meridian1)} + (${formatNumber(rx.cylinder)}) = ${formatNumber(meridian2)} D`,
        },
        {
          title: 'Calculate vertex distance change',
          formula: 'd = (original vertex - new vertex) ÷ 1000',
          work: `d = (${formatNumber(originalMm)} - ${formatNumber(newMm)}) ÷ 1000 = ${formatNumber(d, 6)} m`,
        },
        {
          title: 'Compensate Meridian 1 (sphere)',
          formula: 'F_new = F ÷ (1 - d × F)',
          work: `F_new = ${formatNumber(meridian1)} ÷ (1 - ${formatNumber(d, 6)} × ${formatNumber(meridian1)}) = ${formatNumber(meridian1)} ÷ ${formatNumber(denom1, 6)} = ${formatNumber(newMeridian1)} D`,
        },
        {
          title: 'Compensate Meridian 2 (sphere + cylinder)',
          formula: 'F_new = F ÷ (1 - d × F)',
          work: `F_new = ${formatNumber(meridian2)} ÷ (1 - ${formatNumber(d, 6)} × ${formatNumber(meridian2)}) = ${formatNumber(meridian2)} ÷ ${formatNumber(denom2, 6)} = ${formatNumber(newMeridian2)} D`,
        },
        {
          title: 'Recombine into Rx form',
          formula: 'New Sphere = Meridian 1; New Cylinder = Meridian 2 - Meridian 1; Axis unchanged',
          work: `Sphere = ${formatNumber(newMeridian1)}; Cylinder = ${formatNumber(newMeridian2)} - ${formatNumber(newMeridian1)} = ${formatNumber(newMeridian2 - newMeridian1)}; Axis = ${formatNumber(rx.axis)}°`,
        },
        {
          title: 'Round to nearest 0.25 D dispensing step',
          formula: 'Snap sphere & cylinder to 0.25 D',
          work: `New Rx: ${formatRx(result)}`,
        },
      ],
    };
  }

  // Simple sphere-only mode (original behavior)
  const d = (originalMm - newMm) / 1000;
  const denominator = 1 - d * power;
  const compensated = denominator !== 0 ? power / denominator : Infinity;

  return {
    conceptTitle: 'Vertex Distance Compensation',
    conceptDescription:
      'When a lens is moved closer to or farther from the eye, its effective power changes. This is critical when converting a glasses prescription to contact lenses (moving from ~12mm to 0mm).',
    steps: [
      {
        title: 'Calculate vertex distance change',
        formula: 'd = (original vertex - new vertex) ÷ 1000',
        work: `d = (${originalMm} - ${newMm}) ÷ 1000 = ${formatNumber(d, 6)} m`,
      },
      {
        title: 'Apply compensation formula',
        formula: 'F_new = F ÷ (1 - d × F)',
        work: `F_new = ${formatNumber(power)} ÷ (1 - ${formatNumber(d, 6)} × ${formatNumber(power)})`,
      },
      {
        title: 'Calculate denominator',
        work: `1 - (${formatNumber(d, 6)} × ${formatNumber(power)}) = 1 - ${formatNumber(d * power, 6)} = ${formatNumber(denominator, 6)}`,
      },
      {
        title: 'Calculate compensated power',
        work: `F_new = ${formatNumber(power)} ÷ ${formatNumber(denominator, 6)} = ${formatNumber(compensated)} D`,
      },
      {
        title: 'Round to nearest 0.25 D dispensing step',
        formula: 'Snap to 0.25 D',
        work: `Compensated Power ≈ ${formatNumber(roundToStep(compensated, 0.25))} D`,
      },
    ],
  };
}

// ─── Lens Thickness Learning ───────────────────────────────

export function getThicknessLearning(
  power: number,
  diameter: number,
  refractiveIndex: number,
  minThickness: number
): LearningContent {
  const r = diameter / 2;
  const sag = (r * r * Math.abs(power)) / (2000 * (refractiveIndex - 1));
  const isPlusLens = power >= 0;

  const steps: LearningStep[] = [
    {
      title: 'Calculate semi-diameter',
      formula: 'r = diameter ÷ 2',
      work: `r = ${formatNumber(diameter)} ÷ 2 = ${formatNumber(r)} mm`,
    },
    {
      title: 'Calculate sag (thickness difference)',
      formula: 'sag = r² × |F| ÷ (2000 × (n - 1))',
      work: `sag = ${formatNumber(r)}² × ${formatNumber(Math.abs(power))} ÷ (2000 × (${formatNumber(refractiveIndex)} - 1))`,
    },
    {
      title: 'Solve sag',
      work: `sag = ${formatNumber(r * r)} × ${formatNumber(Math.abs(power))} ÷ ${formatNumber(2000 * (refractiveIndex - 1))} = ${formatNumber(sag)} mm`,
    },
  ];

  if (isPlusLens) {
    const edge = minThickness;
    const center = edge + sag;
    steps.push({
      title: 'Plus lens: center is thicker',
      formula: 'center thickness = edge thickness + sag',
      work: `center = ${formatNumber(edge)} + ${formatNumber(sag)} = ${formatNumber(center)} mm`,
    });
  } else {
    const center = minThickness;
    const edge = center + sag;
    steps.push({
      title: 'Minus lens: edge is thicker',
      formula: 'edge thickness = center thickness + sag',
      work: `edge = ${formatNumber(center)} + ${formatNumber(sag)} = ${formatNumber(edge)} mm`,
    });
  }

  return {
    conceptTitle: 'Lens Thickness Estimation',
    conceptDescription:
      'Lens thickness depends on power, diameter, and refractive index. Plus lenses are thickest at the center; minus lenses are thickest at the edge. Higher index materials produce thinner lenses.',
    steps,
  };
}

// ─── Transposition Learning ────────────────────────────────

export function getTransposeLearning(
  sphere: number,
  cylinder: number,
  axis: number
): LearningContent {
  const original: SpheroCylRx = { sphere, cylinder, axis };
  const result = transposeRx(original);
  // Use the normalized axis so the displayed rotation arithmetic matches the
  // result even if an out-of-range axis was typed (e.g. 200° → 20°).
  const normAxis = normalizeAxis(axis);

  return {
    conceptTitle: 'Rx Transposition',
    conceptDescription:
      'Transposition converts a prescription between plus and minus cylinder forms. Both forms describe the same optical correction. The three steps are: add sphere and cylinder for new sphere, negate the cylinder, and rotate the axis by 90 degrees.',
    steps: [
      {
        title: 'Original Rx',
        work: `${formatRx(original)}`,
      },
      {
        title: 'New Sphere = old Sphere + old Cylinder',
        formula: 'New Sphere = Sphere + Cylinder',
        work: `New Sphere = ${formatNumber(sphere)} + (${formatNumber(cylinder)}) = ${formatNumber(result.sphere)}`,
      },
      {
        title: 'New Cylinder = negate old Cylinder',
        formula: 'New Cylinder = -(old Cylinder)',
        work: `New Cylinder = -(${formatNumber(cylinder)}) = ${formatNumber(result.cylinder)}`,
      },
      {
        title: 'New Axis = rotate by 90°',
        formula: 'If axis ≤ 90: new axis = axis + 90; else: new axis = axis - 90',
        work: `New Axis = ${formatNumber(normAxis)} ${normAxis <= 90 ? '+' : '-'} 90 = ${formatNumber(result.axis)}`,
      },
      {
        title: 'Transposed Rx',
        work: `${formatRx(result)}`,
      },
    ],
  };
}

// ─── Spherical Equivalent Learning ─────────────────────────

export function getSphEquivLearning(
  sphere: number,
  cylinder: number
): LearningContent {
  const se = sphericalEquivalent(sphere, cylinder);
  const halfCyl = cylinder / 2;

  return {
    conceptTitle: 'Spherical Equivalent',
    conceptDescription:
      'The spherical equivalent collapses a spherocylindrical prescription into a single sphere power. It represents the average power of the Rx and is commonly used for contact lens fitting and IOL calculations.',
    steps: [
      {
        title: 'Start with the formula',
        formula: 'SE = Sphere + (Cylinder ÷ 2)',
        work: `SE = ${formatNumber(sphere)} + (${formatNumber(cylinder)} ÷ 2)`,
      },
      {
        title: 'Calculate half of cylinder',
        work: `${formatNumber(cylinder)} ÷ 2 = ${formatNumber(halfCyl)}`,
      },
      {
        title: 'Add sphere and half-cylinder',
        work: `SE = ${formatNumber(sphere)} + (${formatNumber(halfCyl)}) = ${formatNumber(se)} D`,
      },
    ],
  };
}

// ─── Minimum Blank Size Learning ───────────────────────────

export function getMBSLearning(
  ed: number,
  framePd: number,
  patientPd: number
): LearningContent {
  const input: MBSInput = { ed, framePd, patientPd };
  const result = calculateMBS(input);

  return {
    conceptTitle: 'Minimum Blank Size (MBS)',
    conceptDescription:
      'The minimum blank size determines the smallest lens blank that can be used for a given frame and patient PD. It accounts for the effective diameter of the frame, the required decentration, and a 2mm safety margin.',
    steps: [
      {
        title: 'Calculate decentration per eye',
        formula: 'Decentration = (Frame PD - Patient PD) ÷ 2',
        work: `Decentration = (${formatNumber(framePd)} - ${formatNumber(patientPd)}) ÷ 2 = ${formatNumber(result.decentration)} mm`,
      },
      {
        title: 'Take the absolute value of decentration',
        work: `|Decentration| = ${formatNumber(Math.abs(result.decentration))} mm`,
      },
      {
        title: 'Calculate MBS',
        formula: 'MBS = ED + 2 × |Decentration| + 2',
        work: `MBS = ${formatNumber(ed)} + 2 × ${formatNumber(Math.abs(result.decentration))} + 2 = ${formatNumber(ed)} + ${formatNumber(2 * Math.abs(result.decentration))} + 2 = ${formatNumber(result.mbs)} mm`,
      },
    ],
  };
}

// ─── Prentice's Rule Learning ──────────────────────────────

export function getPrenticeLearning(
  decentrationMm: number,
  powerD: number
): LearningContent {
  const decentrationCm = decentrationMm / 10;
  const prism = prenticeRule(decentrationMm, powerD);

  return {
    conceptTitle: "Prentice's Rule",
    conceptDescription:
      "Prentice's Rule calculates the prismatic effect induced when looking through a point away from the optical center of a lens. It is essential for understanding unwanted prism from decentration.",
    steps: [
      {
        title: 'Convert decentration to centimeters',
        formula: 'c (cm) = decentration (mm) ÷ 10',
        work: `c = ${formatNumber(decentrationMm)} ÷ 10 = ${formatNumber(decentrationCm)} cm`,
      },
      {
        title: "Apply Prentice's Rule",
        formula: 'P (Δ) = c (cm) × F (D)',
        work: `P = ${formatNumber(decentrationCm)} × ${formatNumber(powerD)} = ${formatNumber(decentrationCm * powerD)}`,
      },
      {
        title: 'Take absolute value for prism magnitude',
        work: `P = |${formatNumber(decentrationCm * powerD)}| = ${formatNumber(prism)} Δ`,
      },
    ],
  };
}

// ─── Javal's Rule Learning ─────────────────────────────────

export function getJavalLearning(
  k1: number,
  k2: number,
  k1Axis: number,
  k2Axis: number
): LearningContent {
  const result = javalsRule(k1, k2, k1Axis, k2Axis);
  const cornealCyl = Math.abs(k1 - k2);
  const steepK = k1 > k2 ? k1 : k2;
  const steepAxis = normalizeAxis(k1 > k2 ? k1Axis : k2Axis);
  const flatAxis = normalizeAxis(k1 > k2 ? k2Axis : k1Axis);
  const isWTR = steepAxis >= 60 && steepAxis <= 120;
  const rawPredicted = isWTR ? 1.25 * cornealCyl - 0.5 : 1.25 * cornealCyl + 0.5;
  const clamped = rawPredicted < 0;

  return {
    conceptTitle: "Javal's Rule",
    conceptDescription:
      "Javal's Rule estimates the expected refractive cylinder from keratometry readings. It accounts for the contribution of the posterior corneal surface (the \"lenticular\" astigmatism factor of -0.50 for WTR or +0.50 for ATR).",
    steps: [
      {
        title: 'Calculate corneal cylinder',
        formula: 'Corneal Cyl = |K1 - K2|',
        work: `Corneal Cyl = |${formatNumber(k1)} - ${formatNumber(k2)}| = ${formatNumber(cornealCyl)} D`,
      },
      {
        title: 'Determine the rule (WTR or ATR)',
        formula: 'WTR if steep meridian axis is 60°-120°; ATR otherwise',
        work: `Steep K = ${formatNumber(steepK)} D @ ${formatNumber(steepAxis)}° → ${result.rule}`,
      },
      {
        title: "Apply Javal's Rule",
        formula: `Predicted Cyl = (1.25 × Corneal Cyl) ${isWTR ? '-' : '+'} 0.50`,
        work: `Predicted Cyl = (1.25 × ${formatNumber(cornealCyl)}) ${isWTR ? '-' : '+'} 0.50 = ${formatNumber(1.25 * cornealCyl)} ${isWTR ? '-' : '+'} 0.50 = ${clamped ? `${formatNumber(rawPredicted)} → 0.00 (clamped at 0)` : formatNumber(result.cornealCyl)} D`,
      },
      {
        title: 'Predicted cylinder axis (at flat meridian)',
        work: `Predicted axis = ${formatNumber(flatAxis)}° (flat meridian axis)`,
      },
    ],
  };
}

// ─── Frame PD Learning ─────────────────────────────────────

export function getFramePdLearning(
  aSize: number,
  dbl: number,
  patientPd: number
): LearningContent {
  const result = calculateFramePd(aSize, dbl, patientPd);

  return {
    conceptTitle: 'Frame PD & Decentration',
    conceptDescription:
      'Frame PD (also called Frame GCD) is the geometric center distance of the frame, calculated as A size + DBL. Decentration is the difference between frame PD and patient PD, indicating how much the optical center must be moved inward.',
    steps: [
      {
        title: 'Calculate Frame PD',
        formula: 'Frame PD = A size + DBL',
        work: `Frame PD = ${formatNumber(aSize)} + ${formatNumber(dbl)} = ${formatNumber(result.framePd)} mm`,
      },
      {
        title: 'Calculate total decentration',
        formula: 'Total Decentration = Frame PD - Patient PD',
        work: `Total Decentration = ${formatNumber(result.framePd)} - ${formatNumber(patientPd)} = ${formatNumber(result.totalDecentration)} mm`,
      },
      {
        title: 'Calculate decentration per eye',
        formula: 'Decentration per eye = Total Decentration ÷ 2',
        work: `Decentration per eye = ${formatNumber(result.totalDecentration)} ÷ 2 = ${formatNumber(result.decentrationPerEye)} mm`,
      },
    ],
  };
}

// ─── Near PD Learning ──────────────────────────────────────

export function getNearPdLearning(
  distancePd: number,
  workingDistanceCm: number
): LearningContent {
  const nearPd = calculateNearPd(distancePd, workingDistanceCm);
  const vertexToRotation = 27; // mm
  const workingDistanceMm = workingDistanceCm * 10;
  const factor = workingDistanceMm / (workingDistanceMm + vertexToRotation);

  return {
    conceptTitle: 'Near PD Approximation',
    conceptDescription:
      'When looking at near objects, the eyes converge inward, making the near PD smaller than the distance PD. The visual axes pivot at the centers of rotation, ~27mm behind the spectacle plane, so by similar triangles the near PD scales by the working distance over (working distance + 27mm).',
    steps: [
      {
        title: 'Convert working distance to mm',
        formula: 'Working Distance (mm) = Working Distance (cm) × 10',
        work: `Working Distance = ${formatNumber(workingDistanceCm)} × 10 = ${formatNumber(workingDistanceMm)} mm`,
      },
      {
        title: 'Calculate convergence factor',
        formula: 'Factor = WD ÷ (WD + 27)',
        work: `Factor = ${formatNumber(workingDistanceMm)} ÷ (${formatNumber(workingDistanceMm)} + ${formatNumber(vertexToRotation)}) = ${formatNumber(workingDistanceMm)} ÷ ${formatNumber(workingDistanceMm + vertexToRotation)} = ${formatNumber(factor)}`,
      },
      {
        title: 'Calculate Near PD',
        formula: 'Near PD = Distance PD × Factor',
        work: `Near PD = ${formatNumber(distancePd)} × ${formatNumber(factor)} = ${formatNumber(nearPd)} mm`,
      },
    ],
  };
}

// ─── Base Curve Learning (Vogel's Rule) ────────────────────

export function getBaseCurveLearning(
  sphere: number,
  cylinder: number
): LearningContent {
  const result = calculateBaseCurve(sphere, cylinder);
  const halfCyl = cylinder / 2;
  const sphEquiv = sphere + halfCyl;
  const isPlus = sphEquiv >= 0;

  return {
    conceptTitle: "Base Curve Selection (Vogel's Rule)",
    conceptDescription:
      "Vogel's Rule provides a starting-point base curve for ophthalmic lenses. For plus Rx it adds +6.00 D to the spherical equivalent; for minus Rx it adds +6.00 D to half the spherical equivalent. The result helps select an appropriate front surface power for the lens.",
    steps: [
      {
        title: 'Calculate half of cylinder',
        formula: 'Cylinder ÷ 2',
        work: `${formatNumber(cylinder)} ÷ 2 = ${formatNumber(halfCyl)}`,
      },
      {
        title: 'Calculate spherical equivalent',
        formula: 'SE = Sphere + (Cylinder ÷ 2)',
        work: `SE = ${formatNumber(sphere)} + (${formatNumber(halfCyl)}) = ${formatNumber(sphEquiv)}`,
      },
      {
        title: isPlus ? 'Plus Rx — apply the plus form' : 'Minus Rx — apply the minus form',
        formula: isPlus ? 'Base Curve = SE + 6.00' : 'Base Curve = (SE ÷ 2) + 6.00',
        work: isPlus
          ? `Base Curve = ${formatNumber(sphEquiv)} + 6 = ${formatNumber(result.vogel)} D`
          : `Base Curve = (${formatNumber(sphEquiv)} ÷ 2) + 6 = ${formatNumber(sphEquiv / 2)} + 6 = ${formatNumber(result.vogel)} D`,
      },
      {
        title: 'Interpretation',
        work: `${result.description}`,
      },
    ],
  };
}

// ─── Spectacle Magnification Learning ──────────────────────

export function getMagnificationLearning(
  power: number,
  centerThickness: number,
  frontCurve: number,
  refractiveIndex: number,
  vertexDistance: number
): LearningContent {
  const input: MagnificationInput = {
    power,
    centerThickness,
    frontCurve,
    refractiveIndex,
    vertexDistance,
  };
  const result = calculateMagnification(input);

  const tMeters = centerThickness / 1000;
  const dMeters = vertexDistance / 1000;
  const tnRatio = tMeters / refractiveIndex;
  const shapeDenom = 1 - tnRatio * frontCurve;
  const powerDenom = 1 - dMeters * power;

  return {
    conceptTitle: 'Spectacle Magnification',
    conceptDescription:
      'Spectacle magnification describes how much larger (or smaller) a corrective lens makes the retinal image compared to the standard eye. It has two components: the shape factor (from lens thickness and front curve) and the power factor (from back vertex power and vertex distance).',
    steps: [
      {
        title: 'Convert thickness and vertex distance to meters',
        work: `t = ${formatNumber(centerThickness)} mm = ${formatNumber(tMeters, 6)} m; d = ${formatNumber(vertexDistance)} mm = ${formatNumber(dMeters, 6)} m`,
      },
      {
        title: 'Calculate Shape Factor',
        formula: 'Shape Factor = 1 ÷ (1 - (t ÷ n) × F1)',
        work: `Shape Factor = 1 ÷ (1 - (${formatNumber(tMeters, 6)} ÷ ${formatNumber(refractiveIndex)}) × ${formatNumber(frontCurve)}) = 1 ÷ (1 - ${formatNumber(tnRatio, 6)} × ${formatNumber(frontCurve)}) = 1 ÷ ${formatNumber(shapeDenom, 6)} = ${formatNumber(result.shapeFactor)}`,
      },
      {
        title: 'Calculate Power Factor',
        formula: 'Power Factor = 1 ÷ (1 - d × Fv)',
        work: `Power Factor = 1 ÷ (1 - ${formatNumber(dMeters, 6)} × ${formatNumber(power)}) = 1 ÷ ${formatNumber(powerDenom, 6)} = ${formatNumber(result.powerFactor)}`,
      },
      {
        title: 'Calculate Total Magnification',
        formula: 'SM = Shape Factor × Power Factor',
        work: `SM = ${formatNumber(result.shapeFactor)} × ${formatNumber(result.powerFactor)} = ${formatNumber(result.totalMagnification)}`,
      },
      {
        title: 'Convert to percent change',
        formula: '% Change = (SM - 1) × 100',
        work: `% Change = (${formatNumber(result.totalMagnification)} - 1) × 100 = ${formatNumber(result.percentChange)}%`,
      },
    ],
  };
}

// ─── As-Worn / Pantoscopic Tilt Learning ───────────────────

export function getAsWornLearning(
  power: number,
  tiltDeg: number,
  n: number
): LearningContent {
  const theta = (tiltDeg * Math.PI) / 180;
  const sin2 = Math.sin(theta) * Math.sin(theta);
  const tan2 = Math.tan(theta) * Math.tan(theta);
  const result = pantoscopicTilt(power, tiltDeg, n);
  const asWornRx: SpheroCylRx = {
    sphere: roundToStep(result.asWornSphere, 0.25),
    cylinder: roundToStep(result.inducedCylinder, 0.25),
    axis: result.inducedAxis,
  };

  return {
    conceptTitle: 'As-Worn Power (Pantoscopic Tilt)',
    conceptDescription:
      "When a lens is tilted toward the cheek (pantoscopic tilt), light passes through it obliquely. Martin's approximation shows the effect: the sphere power increases slightly and a cylinder is induced with its axis along the horizontal (axis 180), parallel to the tilt's rotation axis. Higher powers and larger tilts make the effect bigger.",
    steps: [
      {
        title: 'Convert the tilt angle to radians',
        formula: 'θ = tilt° × π ÷ 180',
        work: `θ = ${formatNumber(tiltDeg)}° × π ÷ 180 = ${formatNumber(theta, 6)} rad`,
      },
      {
        title: 'Compute sin²θ and tan²θ',
        work: `sin²θ = ${formatNumber(sin2, 6)};  tan²θ = ${formatNumber(tan2, 6)}`,
      },
      {
        title: 'New sphere power',
        formula: "S' = F × (1 + sin²θ ÷ 2n)",
        work: `S' = ${formatNumber(power)} × (1 + ${formatNumber(sin2, 6)} ÷ ${formatNumber(2 * n)}) = ${formatNumber(result.asWornSphere, 4)} D`,
      },
      {
        title: 'Induced cylinder (axis 180)',
        formula: 'C = F × tan²θ',
        work: `C = ${formatNumber(power)} × ${formatNumber(tan2, 6)} = ${formatNumber(result.inducedCylinder, 4)} D × 180`,
      },
      {
        title: 'Sphere power change from tilt',
        work: `ΔS = ${formatNumber(result.asWornSphere, 4)} − ${formatNumber(power)} = ${formatNumber(result.sphereChange, 4)} D`,
      },
      {
        title: 'As-worn Rx (rounded to 0.25 D)',
        work: `${formatRx(asWornRx)}`,
      },
    ],
  };
}

// ─── Master dispatcher ─────────────────────────────────────

export function getLearningContent(
  category: Category,
  params: Record<string, any>
): LearningContent | null {
  switch (category) {
    case 'length':
      return getLengthLearning(params.value, params.fromUnit);
    case 'diopters':
      return getDiopterLearning(params.value, params.fromUnit);
    case 'prism':
      return getPrismLearning(params.value, params.fromUnit);
    case 'asWorn':
      return getAsWornLearning(params.power, params.tiltDeg, params.refractiveIndex);
    case 'vertex':
      return getVertexLearning(
        params.power,
        params.originalMm,
        params.newMm,
        params.cylinder,
        params.axis
      );
    case 'thickness':
      return getThicknessLearning(
        params.power,
        params.diameter,
        params.refractiveIndex,
        params.minThickness
      );
    case 'transpose':
      return getTransposeLearning(params.sphere, params.cylinder, params.axis);
    case 'sphEquiv':
      return getSphEquivLearning(params.sphere, params.cylinder);
    case 'mbs':
      return getMBSLearning(params.ed, params.framePd, params.patientPd);
    case 'prentice':
      return getPrenticeLearning(params.decentrationMm, params.powerDiopters);
    case 'javal':
      return getJavalLearning(params.k1, params.k2, params.k1Axis, params.k2Axis);
    case 'framePd':
      return getFramePdLearning(params.aSize, params.dbl, params.patientPd);
    case 'nearPd':
      return getNearPdLearning(params.distancePd, params.workingDistanceCm);
    case 'baseCurve':
      return getBaseCurveLearning(params.sphere, params.cylinder);
    case 'magnification':
      return getMagnificationLearning(
        params.power,
        params.centerThickness,
        params.frontCurve,
        params.refractiveIndex,
        params.vertexDistance
      );
    default:
      return null;
  }
}
