import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { RiskLevel } from "@/utils/scamAnalyzer";

interface SuggestedActionsProps {
  actions: string[];
  riskLevel: RiskLevel;
}

const ACTION_ICONS: Record<string, string> = {
  "Do not make any payments": "x-circle",
  "Do not make": "x-circle",
  "Block this": "slash",
  "Report to": "flag",
  "File complaint": "file-text",
  "Alert your bank": "alert-triangle",
  "Verify the sender": "search",
  "Do not share": "eye-off",
  "Call the organization": "phone",
  "Do not click": "link",
  "Always confirm": "check-circle",
  "Never share": "lock",
  "When in doubt": "help-circle",
};

function getIcon(action: string): string {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.startsWith(key)) return icon;
  }
  return "info";
}

export default function SuggestedActions({ actions, riskLevel }: SuggestedActionsProps) {
  const colors = useColors();

  const accentColor =
    riskLevel === "HIGH" ? colors.riskHigh : riskLevel === "MEDIUM" ? colors.riskMedium : colors.primary;

  const handleCallHelpline = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("tel:1930").catch(() => {});
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Suggested Actions</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {actions.map((action, i) => (
        <View key={i} style={styles.actionRow}>
          <View style={[styles.iconWrap, { backgroundColor: accentColor + "18" }]}>
            <Feather name={getIcon(action) as any} size={14} color={accentColor} />
          </View>
          <Text style={[styles.actionText, { color: colors.foreground }]}>{action}</Text>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <TouchableOpacity
        style={[styles.helplineBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}
        onPress={handleCallHelpline}
        activeOpacity={0.75}
      >
        <Feather name="phone" size={14} color={colors.primary} />
        <View style={styles.helplineContent}>
          <Text style={[styles.helplineTitle, { color: colors.primary }]}>National Cybercrime Helpline</Text>
          <Text style={[styles.helplineNumber, { color: colors.foreground }]}>Dial 1930</Text>
        </View>
        <Feather name="chevron-right" size={14} color={colors.primary} />
      </TouchableOpacity>
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
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  actionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  helplineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  helplineContent: {
    flex: 1,
    gap: 1,
  },
  helplineTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  helplineNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
});
