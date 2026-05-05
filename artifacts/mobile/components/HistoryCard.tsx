import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useScam } from "@/context/ScamContext";
import type { CheckRecord } from "@/utils/storage";

interface HistoryCardProps {
  record: CheckRecord;
}

const TYPE_ICONS: Record<string, string> = {
  phone: "phone",
  upi: "credit-card",
  message: "message-square",
  unknown: "help-circle",
};

const TYPE_LABELS: Record<string, string> = {
  phone: "Phone",
  upi: "UPI ID",
  message: "Message",
  unknown: "Unknown",
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function HistoryCard({ record }: HistoryCardProps) {
  const colors = useColors();
  const { result } = record;

  const riskColor =
    result.riskLevel === "HIGH"
      ? colors.riskHigh
      : result.riskLevel === "MEDIUM"
      ? colors.riskMedium
      : colors.riskLow;

  const iconName = TYPE_ICONS[record.inputType] ?? "help-circle";
  const typeLabel = TYPE_LABELS[record.inputType] ?? "Unknown";

  const displayInput =
    record.inputType === "message" && record.input.length > 40
      ? record.input.slice(0, 40) + "..."
      : record.input;

  const { analyzeText } = useScam();

  const handlePress = async () => {
    await analyzeText(record.input);
    router.push("/results");
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={iconName as any} size={16} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.input, { color: colors.foreground }]} numberOfLines={1}>
          {displayInput}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.typeLabel, { color: colors.mutedForeground }]}>{typeLabel}</Text>
          <Text style={[styles.dot, { color: colors.border }]}>•</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeAgo(record.timestamp)}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.scoreBadge, { backgroundColor: riskColor + "22" }]}>
          <Text style={[styles.scoreText, { color: riskColor }]}>{result.riskScore}</Text>
        </View>
        <Text style={[styles.riskLabel, { color: riskColor }]}>{result.riskLevel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  typeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  dot: {
    fontSize: 10,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  right: {
    alignItems: "center",
    gap: 2,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  riskLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
