import React from 'react';
import Svg, { Line, Polygon, Text as SvgText, Path } from 'react-native-svg';
import { Colors } from '../constants/theme';

export default function PrismDiagram() {
  const w = 280;
  const h = 140;
  const centerY = h / 2;

  // Prism triangle
  const prismLeft = 100;
  const prismRight = 170;
  const prismTop = 25;
  const prismBottom = h - 25;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Prism */}
      <Polygon
        points={`${(prismLeft + prismRight) / 2},${prismTop} ${prismLeft},${prismBottom} ${prismRight},${prismBottom}`}
        fill={Colors.surfaceAlt}
        stroke={Colors.primary}
        strokeWidth={2}
      />

      {/* Incoming light ray */}
      <Line
        x1={20}
        y1={centerY}
        x2={prismLeft + 15}
        y2={centerY}
        stroke={Colors.accent}
        strokeWidth={2}
      />

      {/* Refracted ray inside prism */}
      <Line
        x1={prismLeft + 15}
        y1={centerY}
        x2={prismRight - 5}
        y2={centerY + 15}
        stroke={Colors.accent}
        strokeWidth={2}
      />

      {/* Exiting ray (deviated) */}
      <Line
        x1={prismRight - 5}
        y1={centerY + 15}
        x2={w - 15}
        y2={centerY + 40}
        stroke={Colors.accent}
        strokeWidth={2}
      />

      {/* Original path (dashed) */}
      <Line
        x1={prismRight - 5}
        y1={centerY + 15}
        x2={w - 15}
        y2={centerY + 15}
        stroke={Colors.textSecondary}
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Deviation angle arc */}
      <Path
        d={`M ${w - 50} ${centerY + 15} A 30 30 0 0 1 ${w - 55} ${centerY + 30}`}
        stroke={Colors.primary}
        strokeWidth={1.5}
        fill="none"
      />
      <SvgText x={w - 38} y={centerY + 28} fontSize={12} fill={Colors.primary} fontWeight="600">
        θ
      </SvgText>

      {/* Labels */}
      <SvgText x={30} y={centerY - 8} fontSize={10} fill={Colors.textSecondary} textAnchor="middle">
        Light
      </SvgText>

      {/* 1m distance marker */}
      <Line x1={w - 15} y1={centerY + 8} x2={w - 15} y2={centerY + 48} stroke={Colors.primary} strokeWidth={1} />
      <SvgText x={w - 8} y={centerY + 32} fontSize={9} fill={Colors.primary} textAnchor="start" fontWeight="500">
        d
      </SvgText>

      {/* Formula */}
      <SvgText x={w / 2} y={h - 5} fontSize={11} fill={Colors.accent} textAnchor="middle" fontWeight="600" fontStyle="italic">
        Δ = 100 × tan(θ)
      </SvgText>

      {/* Base label */}
      <SvgText x={(prismLeft + prismRight) / 2} y={prismBottom + 12} fontSize={9} fill={Colors.textSecondary} textAnchor="middle">
        Base
      </SvgText>
      <SvgText x={(prismLeft + prismRight) / 2} y={prismTop - 5} fontSize={9} fill={Colors.textSecondary} textAnchor="middle">
        Apex
      </SvgText>
    </Svg>
  );
}
