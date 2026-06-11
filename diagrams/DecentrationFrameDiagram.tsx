import React from 'react';
import Svg, { Circle, Line, Polygon, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

export interface EyeShift {
  hMm: number;
  hDir: 'IN' | 'OUT' | '';
  vMm: number;
  vDir: 'UP' | 'DOWN' | '';
  active: boolean;
}

interface Props {
  width: number;
  od: EyeShift;
  os: EyeShift;
}

function headPoints(x1: number, y1: number, x2: number, y2: number, size = 9, spread = 0.5) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1x = x2 - size * Math.cos(a - spread);
  const p1y = y2 - size * Math.sin(a - spread);
  const p2x = x2 - size * Math.cos(a + spread);
  const p2y = y2 - size * Math.sin(a + spread);
  return `${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`;
}

export default function DecentrationFrameDiagram({ width, od, os }: Props) {
  const h = 210;
  const cy = 100;
  const margin = 16;
  const temple = 18;
  const bridge = 26;
  const available = width - 2 * margin - 2 * temple - bridge;
  const r = Math.min(available / 4, 62);
  const odCx = margin + temple + r;
  const osCx = width - margin - temple - r;
  const usable = r - 12;

  const maxMm = Math.max(
    od.active ? Math.max(od.hMm, od.vMm) : 0,
    os.active ? Math.max(os.hMm, os.vMm) : 0,
    0.0001
  );
  const scale = (usable * 0.8) / maxMm;

  const renderEye = (cx: number, eye: 'OD' | 'OS', s: EyeShift) => {
    // Nasal (IN) points toward the bridge: right for OD (left lens), left for OS.
    const nasalSign = eye === 'OD' ? 1 : -1;
    const sx = s.hDir === 'IN' ? nasalSign : s.hDir === 'OUT' ? -nasalSign : 0;
    const sy = s.vDir === 'DOWN' ? 1 : s.vDir === 'UP' ? -1 : 0;
    const ocx = cx + sx * s.hMm * scale;
    const ocy = cy + sy * s.vMm * scale;
    const hasShift = s.active && (s.hMm > 0.01 || s.vMm > 0.01);

    return (
      <G key={eye}>
        {/* Eyewire */}
        <Circle cx={cx} cy={cy} r={r} fill="rgba(27, 42, 74, 0.04)" stroke={Colors.primary} strokeWidth={2.5} />

        {/* Axes through the visual point */}
        <Line x1={cx - r + 6} y1={cy} x2={cx + r - 6} y2={cy} stroke={Colors.border} strokeWidth={1} strokeDasharray="2,4" />
        <Line x1={cx} y1={cy - r + 6} x2={cx} y2={cy + r - 6} stroke={Colors.border} strokeWidth={1} strokeDasharray="2,4" />

        {/* Decentration arrow */}
        {hasShift && (
          <>
            <Line x1={cx} y1={cy} x2={ocx} y2={ocy} stroke={Colors.error} strokeWidth={2.5} />
            <Polygon points={headPoints(cx, cy, ocx, ocy, 10, 0.5)} fill={Colors.error} />
          </>
        )}

        {/* Visual point / pupil */}
        <Circle cx={cx} cy={cy} r={4.5} fill={Colors.accent} />
        <Circle cx={cx} cy={cy} r={2} fill={Colors.primaryDark} />

        {/* OC marker */}
        {hasShift && (
          <G>
            <Circle cx={ocx} cy={ocy} r={8} fill="rgba(192,57,43,0.12)" stroke={Colors.error} strokeWidth={2} />
            <Line x1={ocx - 5} y1={ocy} x2={ocx + 5} y2={ocy} stroke={Colors.error} strokeWidth={1.5} />
            <Line x1={ocx} y1={ocy - 5} x2={ocx} y2={ocy + 5} stroke={Colors.error} strokeWidth={1.5} />
            <SvgText x={ocx} y={ocy - 12} fontSize={8} fill={Colors.error} textAnchor="middle" fontWeight="700">OC</SvgText>
          </G>
        )}

        {/* Eye label */}
        <SvgText x={cx} y={cy - r - 8} fontSize={11} fill={Colors.primary} textAnchor="middle" fontWeight="700">
          {eye}
        </SvgText>
      </G>
    );
  };

  return (
    <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
      {/* Bridge */}
      <Line x1={odCx + r} y1={cy} x2={osCx - r} y2={cy} stroke={Colors.primary} strokeWidth={3} />
      {/* Temples */}
      <Line x1={odCx - r} y1={cy} x2={odCx - r - temple} y2={cy - 4} stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" />
      <Line x1={osCx + r} y1={cy} x2={osCx + r + temple} y2={cy - 4} stroke={Colors.primary} strokeWidth={3} strokeLinecap="round" />

      {renderEye(odCx, 'OD', od)}
      {renderEye(osCx, 'OS', os)}

      {/* Nose hint between the lenses */}
      <SvgText x={width / 2} y={cy + 4} fontSize={8} fill={Colors.textSecondary} textAnchor="middle">nose</SvgText>

      {/* Caption */}
      <SvgText x={width / 2} y={h - 6} fontSize={10} fill={Colors.primary} textAnchor="middle" fontWeight="600">
        Move each optical center to its OC marker
      </SvgText>
    </Svg>
  );
}
