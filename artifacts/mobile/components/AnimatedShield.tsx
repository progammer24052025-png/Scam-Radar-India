import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AnimatedShieldProps {
  size?: number;
  riskLevel?: "HIGH" | "MEDIUM" | "LOW" | null;
}

export default function AnimatedShield({ size = 38, riskLevel = null }: AnimatedShieldProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const color =
    riskLevel === "HIGH"
      ? colors.riskHigh
      : riskLevel === "MEDIUM"
      ? colors.riskMedium
      : riskLevel === "LOW"
      ? colors.riskLow
      : colors.primary;

  useEffect(() => {
    // Subtle pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    // Glow fade
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
      ])
    );
    pulse.start();
    glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, [riskLevel]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.25] });
  const iconSize = Math.round(size * 0.47);

  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2, alignItems: "center", justifyContent: "center" }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.9,
            height: size * 1.9,
            borderRadius: size * 0.95,
            borderColor: color,
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Main pulsing badge */}
      <Animated.View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size * 0.26,
            backgroundColor: color + "20",
            borderColor: color + "44",
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Feather name="shield" size={iconSize} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  glowRing: {
    position: "absolute",
    borderWidth: 1.5,
  },
  badge: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
