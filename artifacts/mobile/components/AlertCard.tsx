import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reportCount: number;
  location: string;
  timeAgo: string;
  trend: "rising" | "stable" | "declining";
  indicators: string[];
}

interface AlertCardProps {
  item: AlertItem;
  onPress?: () => void;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: "#FF2D55", label: "CRITICAL" },
  HIGH: { color: "#EF4444", label: "HIGH" },
  MEDIUM: { color: "#F59E0B", label: "MEDIUM" },
  LOW: { color: "#22C55E", label: "LOW" },
};

const TREND_CONFIG = {
  rising: { icon: "trending-up", color: "#EF4444" },
  stable: { icon: "minus", color: "#F59E0B" },
  declining: { icon: "trending-down", color: "#22C55E" },
};

export default function AlertCard({ item, onPress }: AlertCardProps) {
  const colors = useColors();
  const sev = SEVERITY_CONFIG[item.severity];
  const trend = TREND_CONFIG[item.trend];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sev.color }]}
    >
      <View style={styles.header}>
        <View style={[styles.severityBadge, { backgroundColor: sev.color + "20" }]}>
          <View style={[styles.dot, { backgroundColor: sev.color }]} />
          <Text style={[styles.severityText, { color: sev.color }]}>{sev.label}</Text>
        </View>
        <View style={styles.headerRight}>
          <Feather name={trend.icon as any} size={13} color={trend.color} />
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{item.timeAgo}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="alert-triangle" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.reportCount.toLocaleString()} reports</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>{item.category}</Text>
        </View>
      </View>

      {item.indicators.length > 0 && (
        <View style={styles.indicators}>
          {item.indicators.slice(0, 3).map((ind, i) => (
            <View key={i} style={[styles.indicator, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.indicatorText, { color: colors.secondaryForeground }]}>{ind}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  severityText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  indicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  indicator: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  indicatorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
});
