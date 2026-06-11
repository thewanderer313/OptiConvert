import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../constants/theme';

const SCALE = 2.2; // pixels per mm
const LENS_RADIUS_MM = 28; // 56mm lens diameter
const LENS_RADIUS_PX = LENS_RADIUS_MM * SCALE;
const MARKER_SIZE = 22;

interface PrismResult {
  horizontal: number;
  vertical: number;
  hDirection: string;
  vDirection: string;
  hPowerUsed: number;
  vPowerUsed: number;
  resultant: number;
  angle: number; // degrees from horizontal, 0-360
}

/**
 * For a spherocylindrical lens Sph / Cyl × Axis:
 * Power at any meridian φ = Sphere + Cylinder × sin²(φ - Axis)
 *
 * Horizontal prism uses power at the 180° meridian.
 * Vertical prism uses power at the 90° meridian.
 */
function powerAtMeridian(sphere: number, cylinder: number, axis: number, meridian: number): number {
  const angleDeg = meridian - axis;
  const angleRad = (angleDeg * Math.PI) / 180;
  return sphere + cylinder * Math.sin(angleRad) * Math.sin(angleRad);
}

function getPrismDirection(
  decentration: number,
  powerInMeridian: number,
  orientation: 'horizontal' | 'vertical',
  eye: 'OD' | 'OS'
): string {
  if (Math.abs(decentration) < 0.01 || Math.abs(powerInMeridian) < 0.01) return '';

  // Standard rule: a PLUS lens behaves like base-to-base prisms (base at the
  // optical center), so the induced base is on the SAME side as the OC shift.
  // A MINUS lens is apex-to-apex (base at the edge), so the base is on the
  // OPPOSITE side of the OC shift.
  const isMinus = powerInMeridian < 0;

  if (orientation === 'horizontal') {
    if (eye === 'OD') {
      // OD: positive dx = OC moved nasally (right on screen = toward nose)
      const isNasal = decentration > 0;
      if (isMinus) return isNasal ? 'BO' : 'BI';
      return isNasal ? 'BI' : 'BO';
    } else {
      // OS: negative dx = OC moved nasally (left on screen = toward nose)
      const isNasal = decentration < 0;
      if (isMinus) return isNasal ? 'BO' : 'BI';
      return isNasal ? 'BI' : 'BO';
    }
  } else {
    // Vertical: decentrationYMm > 0 means the OC was moved up (optical up).
    const isUp = decentration > 0;
    if (isMinus) return isUp ? 'BD' : 'BU';
    return isUp ? 'BU' : 'BD';
  }
}

function calculateInducedPrism(
  decentrationXMm: number,
  decentrationYMm: number,
  sphere: number,
  cylinder: number,
  axis: number,
  eye: 'OD' | 'OS'
): PrismResult {
  // Power in the horizontal meridian (180°)
  const hPower = powerAtMeridian(sphere, cylinder, axis, 180);
  // Power in the vertical meridian (90°)
  const vPower = powerAtMeridian(sphere, cylinder, axis, 90);

  // P = c (cm) × F (D)
  const hPrism = Math.abs(decentrationXMm / 10) * Math.abs(hPower);
  const vPrism = Math.abs(decentrationYMm / 10) * Math.abs(vPower);

  const hDirection = getPrismDirection(decentrationXMm, hPower, 'horizontal', eye);
  const vDirection = getPrismDirection(decentrationYMm, vPower, 'vertical', eye);

  // Resultant prism = vector sum
  const resultant = Math.sqrt(hPrism * hPrism + vPrism * vPrism);

  // Angle from horizontal (base direction angle in degrees)
  // atan2(vertical, horizontal) gives angle from H axis
  let angle = 0;
  if (hPrism > 0.001 || vPrism > 0.001) {
    angle = (Math.atan2(vPrism, hPrism) * 180) / Math.PI;
  }

  return {
    horizontal: Math.round(hPrism * 100) / 100,
    vertical: Math.round(vPrism * 100) / 100,
    hDirection,
    vDirection,
    hPowerUsed: Math.round(hPower * 100) / 100,
    vPowerUsed: Math.round(vPower * 100) / 100,
    resultant: Math.round(resultant * 100) / 100,
    angle: Math.round(angle * 10) / 10,
  };
}

function DraggableLens({
  eye,
  centerX,
  centerY,
  sphere,
  cylinder,
  axis,
  onPrismChange,
}: {
  eye: 'OD' | 'OS';
  centerX: number;
  centerY: number;
  sphere: number;
  cylinder: number;
  axis: number;
  onPrismChange: (eye: 'OD' | 'OS', result: PrismResult, dx: number, dy: number) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const updatePrism = useCallback(
    (dx: number, dy: number) => {
      const decentrationXMm = dx / SCALE;
      const decentrationYMm = -dy / SCALE; // invert Y: screen down = optical up
      const result = calculateInducedPrism(decentrationXMm, decentrationYMm, sphere, cylinder, axis, eye);
      onPrismChange(eye, result, dx, dy);
    },
    [sphere, cylinder, axis, eye, onPrismChange]
  );

  const gesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newX = startX.value + e.translationX;
      const newY = startY.value + e.translationY;
      const dist = Math.sqrt(newX * newX + newY * newY);
      const maxDist = LENS_RADIUS_PX - MARKER_SIZE / 2;
      if (dist <= maxDist) {
        translateX.value = newX;
        translateY.value = newY;
      } else {
        const ratio = maxDist / dist;
        translateX.value = newX * ratio;
        translateY.value = newY * ratio;
      }
      runOnJS(updatePrism)(translateX.value, translateY.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.ocMarker,
          {
            position: 'absolute',
            left: centerX - MARKER_SIZE / 2,
            top: centerY - MARKER_SIZE / 2,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.ocCrosshairH} />
        <View style={styles.ocCrosshairV} />
        <Text style={styles.ocLabel}>OC</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export default function InteractivePrism() {
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = screenWidth - Spacing.md * 2;
  const canvasHeight = 220;
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  const [sphere, setSphere] = useState('-4.00');
  const [cylinder, setCylinder] = useState('-1.50');
  const [axis, setAxis] = useState('180');
  const [pd, setPd] = useState('64');

  const sphNum = parseFloat(sphere) || 0;
  const cylNum = parseFloat(cylinder) || 0;
  const axisNum = parseFloat(axis) || 180;
  const pdNum = parseFloat(pd) || 64;

  // Power at each meridian for display
  const hPower = powerAtMeridian(sphNum, cylNum, axisNum, 180);
  const vPower = powerAtMeridian(sphNum, cylNum, axisNum, 90);

  // Lens centers based on PD
  const halfPdPx = (pdNum / 2) * SCALE;
  const odCenterX = canvasCenterX - halfPdPx;
  const osCenterX = canvasCenterX + halfPdPx;

  const [odPrism, setOdPrism] = useState<PrismResult>({
    horizontal: 0, vertical: 0, hDirection: '', vDirection: '', hPowerUsed: 0, vPowerUsed: 0, resultant: 0, angle: 0,
  });
  const [osPrism, setOsPrism] = useState<PrismResult>({
    horizontal: 0, vertical: 0, hDirection: '', vDirection: '', hPowerUsed: 0, vPowerUsed: 0, resultant: 0, angle: 0,
  });
  const [odOffset, setOdOffset] = useState({ dx: 0, dy: 0 });
  const [osOffset, setOsOffset] = useState({ dx: 0, dy: 0 });

  const handlePrismChange = useCallback(
    (eye: 'OD' | 'OS', result: PrismResult, dx: number, dy: number) => {
      if (eye === 'OD') {
        setOdPrism(result);
        setOdOffset({ dx, dy });
      } else {
        setOsPrism(result);
        setOsOffset({ dx, dy });
      }
    },
    []
  );

  const formatPrismComponents = (p: PrismResult) => {
    const parts: string[] = [];
    if (p.horizontal > 0.01) parts.push(`${p.horizontal.toFixed(2)}Δ ${p.hDirection}`);
    if (p.vertical > 0.01) parts.push(`${p.vertical.toFixed(2)}Δ ${p.vDirection}`);
    return parts.length > 0 ? parts.join(', ') : 'No prism';
  };

  const formatResultant = (p: PrismResult) => {
    if (p.resultant < 0.01) return '';
    return `${p.resultant.toFixed(2)}Δ @ ${p.angle.toFixed(1)}°`;
  };

  const formatDecentration = (dx: number, dy: number) => {
    const xMm = Math.abs(dx / SCALE).toFixed(1);
    const yMm = Math.abs(dy / SCALE).toFixed(1);
    return `${xMm}mm H, ${yMm}mm V`;
  };

  return (
    <View style={styles.container}>
      {/* Rx input fields */}
      <View style={styles.inputRow}>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>SPHERE (D)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={sphere}
              onChangeText={setSphere}
              keyboardType="decimal-pad"
              placeholder="-4.00"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
          </View>
        </View>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>CYLINDER (D)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={cylinder}
              onChangeText={setCylinder}
              keyboardType="decimal-pad"
              placeholder="-1.50"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
          </View>
        </View>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>AXIS (°)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={axis}
              onChangeText={setAxis}
              keyboardType="number-pad"
              placeholder="180"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
          </View>
        </View>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>PATIENT PD (mm)</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={pd}
              onChangeText={setPd}
              keyboardType="decimal-pad"
              placeholder="64"
              placeholderTextColor={Colors.border}
              selectionColor={Colors.accent}
            />
          </View>
        </View>
      </View>

      {/* Meridian powers */}
      <View style={styles.meridianRow}>
        <Text style={styles.meridianText}>
          Power @ 180°: {hPower.toFixed(2)} D
        </Text>
        <Text style={styles.meridianDivider}>|</Text>
        <Text style={styles.meridianText}>
          Power @ 90°: {vPower.toFixed(2)} D
        </Text>
      </View>

      <Text style={styles.instruction}>Drag the OC markers to see induced prism</Text>

      {/* Interactive canvas */}
      <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
        <Svg
          width={canvasWidth}
          height={canvasHeight}
          style={StyleSheet.absoluteFill}
        >
          {/* Bridge */}
          <Line
            x1={odCenterX + LENS_RADIUS_PX}
            y1={canvasCenterY}
            x2={osCenterX - LENS_RADIUS_PX}
            y2={canvasCenterY}
            stroke={Colors.primary}
            strokeWidth={3}
          />

          {/* OD lens rim */}
          <Circle
            cx={odCenterX}
            cy={canvasCenterY}
            r={LENS_RADIUS_PX}
            fill="rgba(27, 42, 74, 0.04)"
            stroke={Colors.primary}
            strokeWidth={2.5}
          />

          {/* OS lens rim */}
          <Circle
            cx={osCenterX}
            cy={canvasCenterY}
            r={LENS_RADIUS_PX}
            fill="rgba(27, 42, 74, 0.04)"
            stroke={Colors.primary}
            strokeWidth={2.5}
          />

          {/* Axis lines on each lens */}
          {[odCenterX, osCenterX].map((cx, i) => {
            const axisRad = (axisNum * Math.PI) / 180;
            const lineLen = LENS_RADIUS_PX - 4;
            return (
              <Line
                key={i}
                x1={cx - Math.cos(axisRad) * lineLen}
                y1={canvasCenterY + Math.sin(axisRad) * lineLen}
                x2={cx + Math.cos(axisRad) * lineLen}
                y2={canvasCenterY - Math.sin(axisRad) * lineLen}
                stroke={Colors.accent}
                strokeWidth={1}
                strokeDasharray="3,4"
                opacity={0.5}
              />
            );
          })}

          {/* Temple arms */}
          <Line
            x1={odCenterX - LENS_RADIUS_PX}
            y1={canvasCenterY}
            x2={odCenterX - LENS_RADIUS_PX - 20}
            y2={canvasCenterY - 5}
            stroke={Colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Line
            x1={osCenterX + LENS_RADIUS_PX}
            y1={canvasCenterY}
            x2={osCenterX + LENS_RADIUS_PX + 20}
            y2={canvasCenterY - 5}
            stroke={Colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* OD pupil */}
          <Circle cx={odCenterX} cy={canvasCenterY} r={5} fill={Colors.accent} />
          <Circle cx={odCenterX} cy={canvasCenterY} r={2} fill={Colors.primaryDark} />

          {/* OS pupil */}
          <Circle cx={osCenterX} cy={canvasCenterY} r={5} fill={Colors.accent} />
          <Circle cx={osCenterX} cy={canvasCenterY} r={2} fill={Colors.primaryDark} />

          {/* Decentration lines */}
          {(Math.abs(odOffset.dx) > 1 || Math.abs(odOffset.dy) > 1) && (
            <Line
              x1={odCenterX}
              y1={canvasCenterY}
              x2={odCenterX + odOffset.dx}
              y2={canvasCenterY + odOffset.dy}
              stroke={Colors.error}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          )}
          {(Math.abs(osOffset.dx) > 1 || Math.abs(osOffset.dy) > 1) && (
            <Line
              x1={osCenterX}
              y1={canvasCenterY}
              x2={osCenterX + osOffset.dx}
              y2={canvasCenterY + osOffset.dy}
              stroke={Colors.error}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          )}

          {/* Labels */}
          <SvgText
            x={odCenterX}
            y={canvasCenterY - LENS_RADIUS_PX - 8}
            fontSize={12}
            fill={Colors.primary}
            textAnchor="middle"
            fontWeight="700"
          >
            OD (Right)
          </SvgText>
          <SvgText
            x={osCenterX}
            y={canvasCenterY - LENS_RADIUS_PX - 8}
            fontSize={12}
            fill={Colors.primary}
            textAnchor="middle"
            fontWeight="700"
          >
            OS (Left)
          </SvgText>

          {/* Pupil labels */}
          <SvgText x={odCenterX} y={canvasCenterY + 16} fontSize={8} fill={Colors.accent} textAnchor="middle" fontWeight="600">
            Pupil
          </SvgText>
          <SvgText x={osCenterX} y={canvasCenterY + 16} fontSize={8} fill={Colors.accent} textAnchor="middle" fontWeight="600">
            Pupil
          </SvgText>

          {/* Axis label */}
          <SvgText
            x={canvasCenterX}
            y={canvasHeight - 6}
            fontSize={9}
            fill={Colors.accent}
            textAnchor="middle"
            opacity={0.6}
          >
            — axis {axisNum}° —
          </SvgText>
        </Svg>

        {/* Draggable OC markers */}
        <DraggableLens
          eye="OD"
          centerX={odCenterX}
          centerY={canvasCenterY}
          sphere={sphNum}
          cylinder={cylNum}
          axis={axisNum}
          onPrismChange={handlePrismChange}
        />
        <DraggableLens
          eye="OS"
          centerX={osCenterX}
          centerY={canvasCenterY}
          sphere={sphNum}
          cylinder={cylNum}
          axis={axisNum}
          onPrismChange={handlePrismChange}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsCard}>
        <View style={styles.resultRow}>
          <View style={styles.resultEye}>
            <Text style={styles.eyeLabel}>OD</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.prismText}>{formatPrismComponents(odPrism)}</Text>
            {odPrism.resultant > 0.01 && (
              <Text style={styles.resultantText}>
                Resultant: {formatResultant(odPrism)}
              </Text>
            )}
            <Text style={styles.decentrationText}>
              Decentration: {formatDecentration(odOffset.dx, odOffset.dy)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.resultRow}>
          <View style={styles.resultEye}>
            <Text style={styles.eyeLabel}>OS</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.prismText}>{formatPrismComponents(osPrism)}</Text>
            {osPrism.resultant > 0.01 && (
              <Text style={styles.resultantText}>
                Resultant: {formatResultant(osPrism)}
              </Text>
            )}
            <Text style={styles.decentrationText}>
              Decentration: {formatDecentration(osOffset.dx, osOffset.dy)}
            </Text>
          </View>
        </View>

        {(odPrism.vertical > 0.01 || osPrism.vertical > 0.01) && (
          <>
            <View style={styles.divider} />
            <View style={styles.imbalanceRow}>
              <Text style={styles.imbalanceLabel}>Vertical Imbalance:</Text>
              <Text style={styles.imbalanceValue}>
                {Math.abs(odPrism.vertical - osPrism.vertical).toFixed(2)}Δ
              </Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.formulaReminder}>
        P = c (cm) × F(meridian)  |  Power varies by meridian for cyl lenses
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  input: {
    ...Typography.result,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  meridianRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs + 2,
    marginBottom: Spacing.sm,
  },
  meridianText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentLight,
  },
  meridianDivider: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  instruction: {
    ...Typography.label,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  canvas: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  ocMarker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: 'rgba(192, 57, 43, 0.15)',
    borderWidth: 2,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ocCrosshairH: {
    position: 'absolute',
    width: MARKER_SIZE - 6,
    height: 1.5,
    backgroundColor: Colors.error,
  },
  ocCrosshairV: {
    position: 'absolute',
    width: 1.5,
    height: MARKER_SIZE - 6,
    backgroundColor: Colors.error,
  },
  ocLabel: {
    position: 'absolute',
    top: -14,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.error,
  },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadow.card,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  resultEye: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  resultContent: {
    flex: 1,
  },
  prismText: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  resultantText: {
    ...Typography.label,
    color: Colors.accent,
    marginTop: 2,
  },
  decentrationText: {
    ...Typography.resultUnit,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  imbalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  imbalanceLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  imbalanceValue: {
    ...Typography.bodyBold,
    color: Colors.error,
  },
  formulaReminder: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
