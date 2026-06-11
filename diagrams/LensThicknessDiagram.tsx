import React from 'react';
import Svg, { Path, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface Props {
  isPlusLens: boolean;
  centerThickness?: number;
  edgeThickness?: number;
}

export default function LensThicknessDiagram({
  isPlusLens = true,
  centerThickness,
  edgeThickness,
}: Props) {
  const w = 280;
  const h = 140;
  const centerX = w / 2;
  const centerY = h / 2;
  const lensHeight = 80;

  // Plus lens: convex (thick center), Minus lens: concave (thick edge)
  const curvature = isPlusLens ? 25 : -20;

  const topY = centerY - lensHeight / 2;
  const bottomY = centerY + lensHeight / 2;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Lens cross-section */}
      <Path
        d={`
          M ${centerX - curvature} ${topY}
          Q ${centerX - curvature * 2} ${centerY} ${centerX - curvature} ${bottomY}
          L ${centerX + curvature} ${bottomY}
          Q ${centerX + curvature * 2} ${centerY} ${centerX + curvature} ${topY}
          Z
        `}
        fill={Colors.primaryLight}
        opacity={0.15}
        stroke={Colors.primary}
        strokeWidth={2}
      />

      {/* Center thickness dimension */}
      <Line
        x1={centerX}
        y1={centerY - 3}
        x2={centerX}
        y2={centerY + 3}
        stroke={Colors.accent}
        strokeWidth={2}
      />

      {/* Center thickness line (horizontal) */}
      {isPlusLens ? (
        <>
          <Line
            x1={centerX - Math.abs(curvature) * 2}
            y1={centerY}
            x2={centerX + Math.abs(curvature) * 2}
            y2={centerY}
            stroke={Colors.accent}
            strokeWidth={1.5}
          />
          <SvgText
            x={centerX}
            y={centerY - 8}
            fontSize={10}
            fill={Colors.accent}
            textAnchor="middle"
            fontWeight="600"
          >
            {centerThickness ? `${centerThickness.toFixed(2)} mm` : 'Center (thick)'}
          </SvgText>
        </>
      ) : (
        <>
          <Line
            x1={centerX - 5}
            y1={centerY}
            x2={centerX + 5}
            y2={centerY}
            stroke={Colors.accent}
            strokeWidth={1.5}
          />
          <SvgText
            x={centerX}
            y={centerY - 8}
            fontSize={10}
            fill={Colors.accent}
            textAnchor="middle"
            fontWeight="600"
          >
            {centerThickness ? `${centerThickness.toFixed(2)} mm` : 'Center (thin)'}
          </SvgText>
        </>
      )}

      {/* Edge thickness markers */}
      <SvgText
        x={isPlusLens ? centerX - curvature - 10 : centerX - Math.abs(curvature) - 25}
        y={topY - 5}
        fontSize={10}
        fill={Colors.primary}
        textAnchor="middle"
        fontWeight="600"
      >
        {edgeThickness ? `${edgeThickness.toFixed(2)} mm` : (isPlusLens ? 'Edge (thin)' : 'Edge (thick)')}
      </SvgText>

      {/* Labels */}
      <SvgText x={30} y={20} fontSize={12} fill={Colors.primary} fontWeight="700">
        {isPlusLens ? 'Plus Lens (+)' : 'Minus Lens (-)'}
      </SvgText>

      <SvgText x={30} y={h - 8} fontSize={10} fill={Colors.textSecondary}>
        {isPlusLens ? 'Thickest at center' : 'Thickest at edge'}
      </SvgText>

      {/* Optical axis */}
      <Line
        x1={centerX}
        y1={topY - 10}
        x2={centerX}
        y2={bottomY + 10}
        stroke={Colors.border}
        strokeWidth={1}
        strokeDasharray="3,3"
      />
    </Svg>
  );
}
