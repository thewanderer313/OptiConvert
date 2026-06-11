import React from 'react';
import Svg, { Line, Path, Circle, Text as SvgText, Defs, Marker } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  focalLengthLabel?: string;
  diopterLabel?: string;
}

export default function FocalLengthDiagram({
  focalLengthLabel = 'f',
  diopterLabel = 'D',
}: Props) {
  const w = 280;
  const h = 140;
  const lensX = 100;
  const focalX = 220;
  const centerY = h / 2;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Optical axis */}
      <Line
        x1={20}
        y1={centerY}
        x2={w - 10}
        y2={centerY}
        stroke={Colors.border}
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Lens */}
      <Path
        d={`M ${lensX} ${centerY - 45} Q ${lensX + 12} ${centerY} ${lensX} ${centerY + 45}`}
        stroke={Colors.primary}
        strokeWidth={2.5}
        fill="none"
      />
      <Path
        d={`M ${lensX} ${centerY - 45} Q ${lensX - 12} ${centerY} ${lensX} ${centerY + 45}`}
        stroke={Colors.primary}
        strokeWidth={2.5}
        fill="none"
      />

      {/* Light rays coming in (parallel) */}
      <Line x1={20} y1={centerY - 25} x2={lensX} y2={centerY - 25} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={20} y1={centerY} x2={lensX} y2={centerY} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={20} y1={centerY + 25} x2={lensX} y2={centerY + 25} stroke={Colors.accent} strokeWidth={1.5} />

      {/* Light rays converging to focal point */}
      <Line x1={lensX} y1={centerY - 25} x2={focalX} y2={centerY} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={lensX} y1={centerY} x2={focalX} y2={centerY} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={lensX} y1={centerY + 25} x2={focalX} y2={centerY} stroke={Colors.accent} strokeWidth={1.5} />

      {/* Focal point */}
      <Circle cx={focalX} cy={centerY} r={4} fill={Colors.accent} />
      <SvgText x={focalX} y={centerY - 12} fontSize={12} fill={Colors.accent} textAnchor="middle" fontWeight="600">
        F
      </SvgText>

      {/* Focal length dimension */}
      <Line x1={lensX} y1={centerY + 55} x2={focalX} y2={centerY + 55} stroke={Colors.primary} strokeWidth={1.5} />
      <Line x1={lensX} y1={centerY + 50} x2={lensX} y2={centerY + 60} stroke={Colors.primary} strokeWidth={1.5} />
      <Line x1={focalX} y1={centerY + 50} x2={focalX} y2={centerY + 60} stroke={Colors.primary} strokeWidth={1.5} />
      <SvgText x={(lensX + focalX) / 2} y={centerY + 52} fontSize={11} fill={Colors.primary} textAnchor="middle" fontWeight="500">
        {focalLengthLabel}
      </SvgText>

      {/* Labels */}
      <SvgText x={lensX} y={18} fontSize={11} fill={Colors.primary} textAnchor="middle" fontWeight="600">
        Lens
      </SvgText>
      <SvgText x={40} y={centerY - 35} fontSize={10} fill={Colors.textSecondary} textAnchor="middle">
        Parallel
      </SvgText>
      <SvgText x={40} y={centerY - 25} fontSize={10} fill={Colors.textSecondary} textAnchor="middle">
        light
      </SvgText>

      {/* Formula */}
      <SvgText x={w - 15} y={h - 8} fontSize={11} fill={Colors.accent} textAnchor="end" fontWeight="600" fontStyle="italic">
        D = 1/f
      </SvgText>
    </Svg>
  );
}
