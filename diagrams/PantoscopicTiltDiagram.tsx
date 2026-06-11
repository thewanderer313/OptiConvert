import React from 'react';
import Svg, { Line, Ellipse, Circle, Path, Text as SvgText, G } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  tiltDeg?: number;
}

export default function PantoscopicTiltDiagram({ tiltDeg = 10 }: Props) {
  const w = 280;
  const h = 150;
  const eyeX = 210;
  const centerY = h / 2;
  const lensX = 110;
  const lensHalf = 34;

  // Clamp drawn tilt so the figure stays legible.
  const drawTilt = Math.max(-25, Math.min(25, tiltDeg));
  const rad = (drawTilt * Math.PI) / 180;
  const dx = Math.sin(rad) * lensHalf;
  const dy = Math.cos(rad) * lensHalf;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Line of sight */}
      <Line x1={20} y1={centerY} x2={eyeX - 22} y2={centerY} stroke={Colors.border} strokeWidth={1} strokeDasharray="4,4" />

      {/* Vertical reference (frontal plane) at the lens */}
      <Line x1={lensX} y1={centerY - lensHalf - 6} x2={lensX} y2={centerY + lensHalf + 6} stroke={Colors.border} strokeWidth={1} strokeDasharray="3,3" />

      {/* Eye */}
      <Ellipse cx={eyeX} cy={centerY} rx={24} ry={26} fill={Colors.surfaceAlt} stroke={Colors.primary} strokeWidth={2} />
      <Circle cx={eyeX - 11} cy={centerY} r={10} fill={Colors.primaryLight} opacity={0.3} />
      <Circle cx={eyeX - 11} cy={centerY} r={5} fill={Colors.primary} />
      <Circle cx={eyeX - 11} cy={centerY} r={2.5} fill="#000" />

      {/* Tilted lens */}
      <G>
        <Line
          x1={lensX - dx}
          y1={centerY + dy}
          x2={lensX + dx}
          y2={centerY - dy}
          stroke={Colors.accent}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </G>

      {/* Tilt angle arc + label */}
      <Path
        d={`M ${lensX} ${centerY - 20} A 20 20 0 0 1 ${lensX + Math.sin(rad) * 20} ${centerY - Math.cos(rad) * 20}`}
        stroke={Colors.error}
        strokeWidth={1.5}
        fill="none"
      />
      <SvgText x={lensX + 24} y={centerY - 22} fontSize={11} fill={Colors.error} fontWeight="700">
        {`${tiltDeg.toFixed(0)}°`}
      </SvgText>

      {/* Light rays into the lens */}
      <Line x1={20} y1={centerY - 12} x2={lensX - dx * 0.5} y2={centerY - 12} stroke={Colors.accent} strokeWidth={1} opacity={0.5} />
      <Line x1={20} y1={centerY + 12} x2={lensX - dx * 0.5} y2={centerY + 12} stroke={Colors.accent} strokeWidth={1} opacity={0.5} />

      {/* Labels */}
      <SvgText x={lensX} y={16} fontSize={10} fill={Colors.accent} textAnchor="middle" fontWeight="600">
        Tilted lens
      </SvgText>
      <SvgText x={eyeX} y={16} fontSize={10} fill={Colors.primary} textAnchor="middle" fontWeight="600">
        Eye
      </SvgText>

      {/* Formula */}
      <SvgText x={w / 2} y={h - 4} fontSize={10} fill={Colors.accent} textAnchor="middle" fontWeight="600" fontStyle="italic">
        S' = F(1 + sin²θ/2n),  C = F·tan²θ
      </SvgText>
    </Svg>
  );
}
