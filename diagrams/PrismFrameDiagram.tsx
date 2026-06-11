import React from 'react';
import Svg, { Rect, Line, Circle, Polygon, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  width: number;
  hMag: number;
  hBase: 'BI' | 'BO';
  vMag: number;
  vBase: 'BU' | 'BD';
  resultant: number;
  baseLabel: string;
}

// Arrowhead polygon points for an arrow ending at (x2,y2) coming from (x1,y1).
function headPoints(x1: number, y1: number, x2: number, y2: number, size = 9, spread = 0.45) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1x = x2 - size * Math.cos(a - spread);
  const p1y = y2 - size * Math.sin(a - spread);
  const p2x = x2 - size * Math.cos(a + spread);
  const p2y = y2 - size * Math.sin(a + spread);
  return `${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`;
}

export default function PrismFrameDiagram({
  width,
  hMag,
  hBase,
  vMag,
  vBase,
  resultant,
  baseLabel,
}: Props) {
  const h = 210;
  const cx = width / 2;
  const cy = h / 2;
  const ewW = Math.min(width - 90, 210);
  const ewH = 130;
  const left = cx - ewW / 2;
  const top = cy - ewH / 2;
  const usable = Math.min(ewW, ewH) / 2 - 16;

  const scale = resultant > 0 ? (usable * 0.92) / resultant : 0;
  const hx = (hBase === 'BO' ? 1 : -1) * hMag * scale;
  const vy = (vBase === 'BU' ? -1 : 1) * vMag * scale; // screen y is inverted
  const rx = cx + hx;
  const ry = cy + vy;

  const showH = hMag > 0.001;
  const showV = vMag > 0.001;

  return (
    <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
      {/* Bridge (nasal / IN side, left) */}
      <Line x1={left} y1={cy} x2={left - 16} y2={cy} stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" />
      <Line x1={left - 16} y1={cy} x2={left - 16} y2={cy - 10} stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" />

      {/* Temple (temporal / OUT side, right) */}
      <Line x1={left + ewW} y1={cy} x2={left + ewW + 20} y2={cy - 4} stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" />

      {/* Eyewire / lens */}
      <Rect
        x={left}
        y={top}
        width={ewW}
        height={ewH}
        rx={28}
        ry={40}
        fill="rgba(27, 42, 74, 0.04)"
        stroke={Colors.primary}
        strokeWidth={2.5}
      />

      {/* Side orientation labels */}
      <SvgText x={left + 8} y={cy - 4} fontSize={9} fill={Colors.textSecondary} fontWeight="600">IN</SvgText>
      <SvgText x={left + ewW - 8} y={cy - 4} fontSize={9} fill={Colors.textSecondary} fontWeight="600" textAnchor="end">OUT</SvgText>
      <SvgText x={cx} y={top + 14} fontSize={9} fill={Colors.textSecondary} fontWeight="600" textAnchor="middle">UP</SvgText>
      <SvgText x={cx} y={top + ewH - 6} fontSize={9} fill={Colors.textSecondary} fontWeight="600" textAnchor="middle">DOWN</SvgText>

      {/* Axes through optical center */}
      <Line x1={left + 10} y1={cy} x2={left + ewW - 10} y2={cy} stroke={Colors.border} strokeWidth={1} strokeDasharray="2,4" />
      <Line x1={cx} y1={top + 10} x2={cx} y2={top + ewH - 10} stroke={Colors.border} strokeWidth={1} strokeDasharray="2,4" />

      {resultant > 0 && (
        <G>
          {/* Decomposition guide lines from resultant tip to the axes */}
          {showH && showV && (
            <>
              <Line x1={rx} y1={ry} x2={rx} y2={cy} stroke={Colors.accent} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
              <Line x1={rx} y1={ry} x2={cx} y2={ry} stroke={Colors.accent} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
            </>
          )}

          {/* Horizontal component arrow */}
          {showH && (
            <G>
              <Line x1={cx} y1={cy} x2={cx + hx} y2={cy} stroke={Colors.accent} strokeWidth={2} />
              <Polygon points={headPoints(cx, cy, cx + hx, cy)} fill={Colors.accent} />
              <SvgText x={cx + hx / 2} y={cy + (vy <= 0 ? 16 : -8)} fontSize={9} fill={Colors.accent} textAnchor="middle" fontWeight="600">
                {`${hMag.toFixed(2)}Δ ${hBase}`}
              </SvgText>
            </G>
          )}

          {/* Vertical component arrow */}
          {showV && (
            <G>
              <Line x1={cx} y1={cy} x2={cx} y2={cy + vy} stroke={Colors.accent} strokeWidth={2} />
              <Polygon points={headPoints(cx, cy, cx, cy + vy)} fill={Colors.accent} />
              <SvgText x={cx + (hx >= 0 ? -10 : 10)} y={cy + vy / 2} fontSize={9} fill={Colors.accent} textAnchor={hx >= 0 ? 'end' : 'start'} fontWeight="600">
                {`${vMag.toFixed(2)}Δ ${vBase}`}
              </SvgText>
            </G>
          )}

          {/* Resultant arrow */}
          <Line x1={cx} y1={cy} x2={rx} y2={ry} stroke={Colors.error} strokeWidth={3} />
          <Polygon points={headPoints(cx, cy, rx, ry, 11, 0.5)} fill={Colors.error} />
        </G>
      )}

      {/* Optical center */}
      <Circle cx={cx} cy={cy} r={3.5} fill={Colors.primary} />

      {/* Resultant label */}
      {resultant > 0 && (
        <SvgText x={cx} y={h - 6} fontSize={11} fill={Colors.error} textAnchor="middle" fontWeight="700">
          {`Resultant ${resultant.toFixed(2)}Δ  ${baseLabel}`}
        </SvgText>
      )}
    </Svg>
  );
}
