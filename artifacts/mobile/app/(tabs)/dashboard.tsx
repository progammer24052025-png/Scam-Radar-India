import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useScam } from "@/context/ScamContext";
import { useColors } from "@/hooks/useColors";
import HistoryCard from "@/components/HistoryCard";
import type { InputType } from "@/utils/scamAnalyzer";

type FilterType = "all" | InputType;

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "layers" },
  { key: "phone", label: "Phone", icon: "phone" },
  { key: "upi", label: "UPI", icon: "credit-card" },
  { key: "message", label: "Message", icon: "message-square" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearAllHistory } = useScam();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? history : history.filter((h) => h.inputType === filter);

  const highRisk = history.filter((h) => h.result.riskLevel === "HIGH").length;
  const medRisk = history.filter((h) => h.result.riskLevel === "MEDIUM").length;

  const handleClear = () => {
    Alert.alert("Clear History", "This will delete all your check history. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearAllHistory();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>Check History</Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                  <Feather name="trash-2" size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {history.length > 0 && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>{history.length}</Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Total Checks</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: colors.riskHigh }]}>{highRisk}</Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>High Risk</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statNum, { color: colors.riskMedium }]}>{medRisk}</Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Medium Risk</Text>
                </View>
              </View>
            )}

            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.75}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: filter === f.key ? colors.primary : colors.secondary,
                      borderColor: filter === f.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={f.icon as any}
                    size={12}
                    color={filter === f.key ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <View style={styles.item}><HistoryCard record={item} /></View>}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={28} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No checks yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {filter !== "all"
                ? `No ${filter} checks found. Try a different filter.`
                : "Start by checking a phone number, UPI ID, or suspicious message on the Check tab."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    gap: 0,
  },
  header: {
    gap: 14,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 3,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  statLbl: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  item: {
    marginBottom: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
