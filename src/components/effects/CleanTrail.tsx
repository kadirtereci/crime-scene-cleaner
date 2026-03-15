import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ToolType } from '../../game/types';

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface CleanTrailProps {
  points: TrailPoint[];
  tool: ToolType;
}

// Tool-dependent trail colors (base RGB, opacity added per-segment)
const TRAIL_COLORS: Record<ToolType, string> = {
  mop: 'rgba(100, 180, 255, ',       // water blue
  scrubBrush: 'rgba(255, 255, 255, ', // white suds
  trashBag: 'rgba(80, 80, 80, ',      // dark gray
  repairKit: 'rgba(255, 200, 100, ',  // warm yellow
  spray: 'rgba(100, 220, 150, ',      // green mist
};

const TRAIL_LIFETIME = 400; // ms
const BASE_STROKE_WIDTH = 10;

// Each segment is a rotated rectangle connecting two consecutive trail points
function TrailSegment({
  p1,
  p2,
  colorBase,
  now,
  index,
  total,
}: {
  p1: TrailPoint;
  p2: TrailPoint;
  colorBase: string;
  now: number;
  index: number;
  total: number;
}) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const segLen = Math.sqrt(dx * dx + dy * dy);

  if (segLen < 0.5) return null;

  const angle = Math.atan2(dy, dx);

  // Age based on the older point
  const age = now - p1.timestamp;
  const ageFraction = Math.min(age / TRAIL_LIFETIME, 1);

  // Taper: newer segments (higher index) are wider, older (lower index) shrink
  const positionFraction = total > 1 ? index / (total - 1) : 1;

  // Speed factor: faster movement = wider trail
  const speedFactor = Math.min(segLen / 15, 1.5);

  const width = BASE_STROKE_WIDTH * positionFraction * speedFactor;
  if (width < 1) return null;

  // Opacity fades with age, max 0.4
  const opacity = (1 - ageFraction) * 0.4;
  if (opacity <= 0) return null;

  // Position at midpoint between the two points
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: midX - segLen / 2,
        top: midY - width / 2,
        width: segLen,
        height: width,
        borderRadius: width / 2,
        backgroundColor: colorBase + opacity.toFixed(2) + ')',
        transform: [{ rotate: `${angle}rad` }],
      }}
      pointerEvents="none"
    />
  );
}

export default function CleanTrail({ points, tool }: CleanTrailProps) {
  const colorBase = TRAIL_COLORS[tool] || TRAIL_COLORS.mop;
  const now = Date.now();
  const segmentCount = points.length - 1;

  if (segmentCount < 1) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.slice(0, -1).map((point, i) => (
        <TrailSegment
          key={`${point.timestamp}-${i}`}
          p1={point}
          p2={points[i + 1]}
          colorBase={colorBase}
          now={now}
          index={i}
          total={segmentCount}
        />
      ))}
    </View>
  );
}
