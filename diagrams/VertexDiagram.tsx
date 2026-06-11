import React from 'react';
import Svg, { Line, Ellipse, Rect, Text as SvgText, Path, Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

export default function VertexDiagram() {
  const w = 280;
  const h = 130;
  const centerY = h / 2;
  const eyeX = 230;
  const glassesX = 110;
  const contactX = 215;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Eye */}
      <Ellipse
        cx={eyeX}
        cy={centerY}
        rx={25}
        ry={28}
        fill={Colors.surfaceAlt}
        stroke={Colors.primary}
        strokeWidth={2}
      />
      {/* Iris */}
      <Circle cx={eyeX - 12} cy={centerY} r={12} fill={Colors.primaryLight} opacity={0.3} />
      <Circle cx={eyeX - 12} cy={centerY} r={6} fill={Colors.primary} />
      {/* Pupil */}
      <Circle cx={eyeX - 12} cy={centerY} r={3} fill="#000" />

      {/* Cornea */}
      <Path
        d={`M ${eyeX - 25} ${centerY - 15} Q ${eyeX - 30} ${centerY} ${eyeX - 25} ${centerY + 15}`}
        stroke={Colors.primary}
        strokeWidth={2}
        fill="none"
      />

      {/* Glasses lens */}
      <Rect
        x={glassesX - 3}
        y={centerY - 30}
        width={6}
        height={60}
        rx={3}
        fill={Colors.accent}
        opacity={0.4}
      />
      <Rect
        x={glassesX - 3}
        y={centerY - 30}
        width={6}
        height={60}
        rx={3}
        stroke={Colors.accent}
        strokeWidth={1.5}
        fill="none"
      />

      {/* Contact lens (closer to eye) */}
      <Path
        d={`M ${contactX} ${centerY - 18} Q ${contactX - 6} ${centerY} ${contactX} ${centerY + 18}`}
        stroke={Colors.success}
        strokeWidth={2}
        fill="none"
        strokeDasharray="3,3"
      />

      {/* Vertex distance - glasses */}
      <Line x1={glassesX} y1={centerY + 40} x2={eyeX - 25} y2={centerY + 40} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={glassesX} y1={centerY + 35} x2={glassesX} y2={centerY + 45} stroke={Colors.accent} strokeWidth={1.5} />
      <Line x1={eyeX - 25} y1={centerY + 35} x2={eyeX - 25} y2={centerY + 45} stroke={Colors.accent} strokeWidth={1.5} />
      <SvgText x={(glassesX + eyeX - 25) / 2} y={centerY + 38} fontSize={9} fill={Colors.accent} textAnchor="middle" fontWeight="600">
        12mm
      </SvgText>

      {/* Vertex distance - contacts */}
      <SvgText x={contactX - 8} y={centerY + 50} fontSize={9} fill={Colors.success} textAnchor="middle" fontWeight="600">
        0mm
      </SvgText>

      {/* Labels */}
      <SvgText x={glassesX} y={15} fontSize={10} fill={Colors.accent} textAnchor="middle" fontWeight="600">
        Glasses
      </SvgText>
      <SvgText x={contactX - 15} y={15} fontSize={10} fill={Colors.success} textAnchor="middle" fontWeight="600">
        Contact
      </SvgText>
      <SvgText x={eyeX + 5} y={15} fontSize={10} fill={Colors.primary} textAnchor="middle" fontWeight="600">
        Eye
      </SvgText>

      {/* Light rays */}
      <Line x1={20} y1={centerY - 10} x2={glassesX - 3} y2={centerY - 10} stroke={Colors.accent} strokeWidth={1} opacity={0.6} />
      <Line x1={20} y1={centerY + 10} x2={glassesX - 3} y2={centerY + 10} stroke={Colors.accent} strokeWidth={1} opacity={0.6} />

      {/* Formula */}
      <SvgText x={w / 2} y={h - 4} fontSize={10} fill={Colors.accent} textAnchor="middle" fontWeight="600" fontStyle="italic">
        F_new = F / (1 - d×F)
      </SvgText>
    </Svg>
  );
}
