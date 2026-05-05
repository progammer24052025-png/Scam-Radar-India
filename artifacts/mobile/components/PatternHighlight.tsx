import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ScamPattern } from "@/utils/scamAnalyzer";

interface PatternHighlightProps {
  message: string;
  patterns: ScamPattern[];
}

const TYPE_CONFIG = {
  urgency: { label: "Urgency", color: "#F59E0B", icon: "clock" },
  authority: { label: "Authority Impersonation", color: "#EF4444", icon: "shield-off" },
  payment: { label: "Payment Trap", color: "#EF4444", icon: "credit-card" },
  phishing: { label: "Phishing", color: "#8B5CF6", icon: "link" },
};

function HighlightedMessage({ message, patterns }: { message: string; patterns: ScamPattern[] }) {
  const colors = useColors();

  const sortedPatterns = [...patterns].sort((a, b) => a.startIndex - b.startIndex);
  const segments: { text: string; pattern?: ScamPattern }[] = [];

  let lastIndex = 0;
  for (const pattern of sortedPatterns) {
    if (pattern.startIndex > lastIndex) {
      segments.push({ text: message.slice(lastIndex, pattern.startIndex) });
    }
    if (pattern.startIndex >= lastIndex) {
      segments.push({
        text: message.slice(pattern.startIndex, pattern.endIndex),
        pattern,
      });
      lastIndex = pattern.endIndex;
    }
  }
  if (lastIndex < message.length) {
    segments.push({ text: message.slice(lastIndex) });
  }

  return (
    <Text style={[styles.messageText, { color: colors.foreground }]}>
      {segments.map((seg, i) => {
        if (!seg.pattern) {
          return <Text key={i}>{seg.text}</Text>;
        }
        const cfg = TYPE_CONFIG[seg.pattern.type];
        return (
          <Text key={i} style={{ color: cfg.color, fontFamily: "Inter_600SemiBold", backgroundColor: cfg.color + "22" }}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

export default function PatternHighlight({ message, patterns }: PatternHighlightProps) {
  const colors = useColors();

  if (patterns.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Pattern Detection</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.emptyRow}>
          <Feather name="check-circle" size={16} color={colors.riskLow} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No suspicious patterns detected</Text>
        </View>
      </View>
    );
  }

  const typeGroups: Record<string, ScamPattern[]> = {};
  for (const p of patterns) {
    if (!typeGroups[p.type]) typeGroups[p.type] = [];
    typeGroups[p.type].push(p);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Pattern Detection</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView style={styles.messageScroll} scrollEnabled={false}>
        <HighlightedMessage message={message} patterns={patterns} />
      </ScrollView>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.detectedLabel, { color: colors.mutedForeground }]}>Detected Patterns</Text>

      {Object.entries(typeGroups).map(([type, group]) => {
        const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
        return (
          <View key={type} style={[styles.patternGroup, { borderLeftColor: cfg.color }]}>
            <View style={styles.patternHeader}>
              <Feather name={cfg.icon as any} size={13} color={cfg.color} />
              <Text style={[styles.patternType, { color: cfg.color }]}>{cfg.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: cfg.color + "22" }]}>
                <Text style={[styles.countText, { color: cfg.color }]}>{group.length}</Text>
              </View>
            </View>
            {group.slice(0, 2).map((p, i) => (
              <View key={i} style={styles.explanationRow}>
                <Text style={[styles.phraseText, { color: colors.foreground }]}>"{p.phrase}"</Text>
                <Text style={[styles.explanationText, { color: colors.mutedForeground }]}>{p.explanation}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  messageScroll: {
    maxHeight: 120,
  },
  messageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  detectedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  patternGroup: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    gap: 6,
  },
  patternHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  patternType: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  explanationRow: {
    gap: 2,
  },
  phraseText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  explanationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
});
