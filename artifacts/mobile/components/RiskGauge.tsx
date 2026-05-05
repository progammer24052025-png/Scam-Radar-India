import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import type { RiskLevel } from "@/utils/scamAnalyzer";

interface RiskGaugeProps {
  score: number;
  riskLevel: RiskLevel;
  size?: number;
}

function describeArc(cx: number, cy: number, r: number, startAngleDeg: number, endAngleDeg: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const start = {
    x: cx + r * Math.cos(toRad(startAngleDeg)),
    y: cy + r * Math.sin(toRad(startAngleDeg)),
  };
  const end = {
    x: cx + r * Math.cos(toRad(endAngleDeg)),
    y: cy + r * Math.sin(toRad(endAngleDeg)),
  };
  const largeArc = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function RiskGauge({ score, riskLevel, size = 200 }: RiskGaugeProps) {
  const colors = useColors();
  const animScore = useRef(new Animated.Value(0)).current;
  const animatedScore = useRef(0);

  useEffect(() => {
    animScore.addListener(({ value }) => {
      animatedScore.current = Math.round(value);
    });
    Animated.timing(animScore, {
      toValue: score,
      duration: 1400,
      useNativeDriver: false,
    }).start();
    return () => animScore.removeAllListeners();
  }, [score]);

  const riskColor =
    riskLevel === "HIGH"
      ? colors.riskHigh
      : riskLevel === "MEDIUM"
      ? colors.riskMedium
      : colors.riskLow;

  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = 180;
  const endAngle = 0;
  const scoreAngle = 180 - (score / 100) * 180;

  const bgPath = describeArc(cx, cy, r, startAngle, endAngle);
  const fgPath = score > 0 ? describeArc(cx, cy, r, startAngle, scoreAngle) : "";

  const label = riskLevel === "HIGH" ? "HIGH RISK" : riskLevel === "MEDIUM" ? "MEDIUM RISK" : "LOW RISK";

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size / 2 + 24, alignItems: "center" }}>
        <Svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
          <Path d={bgPath} stroke={colors.border} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
          {fgPath ? (
            <Path d={fgPath} stroke={riskColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
          ) : null}
          <Circle cx={cx} cy={size / 2} r={4} fill={riskColor} />
        </Svg>
        <Animated.Text
          style={[
            styles.score,
            { color: riskColor, fontSize: size * 0.26 },
          ]}
        >
          {score}
        </Animated.Text>
        <Text style={[styles.outOf, { color: colors.mutedForeground }]}>/100</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: riskColor + "22", borderColor: riskColor + "55" }]}>
        <View style={[styles.dot, { backgroundColor: riskColor }]} />
        <Text style={[styles.label, { color: riskColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
  },
  score: {
    fontFamily: "Inter_700Bold",
    position: "absolute",
    bottom: 16,
  },
  outOf: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    position: "absolute",
    bottom: 10,
    right: 62,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1.2,
  },
});
