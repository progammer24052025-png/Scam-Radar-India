import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AlertCard, { type AlertItem } from "@/components/AlertCard";
import { useColors } from "@/hooks/useColors";
import { api, type ApiAlert } from "@/utils/api";

function apiAlertToAlertItem(a: ApiAlert): AlertItem {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    severity: a.severity,
    reportCount: a.reportCount,
    location: a.location,
    timeAgo: a.timeAgo,
    trend: a.trend,
    indicators: a.indicators,
  };
}

type SeverityFilter = "all" | "CRITICAL" | "HIGH" | "MEDIUM";

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "HIGH", label: "High" },
  { key: "MEDIUM", label: "Medium" },
];

function PulsingDot({ color }: { color: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={{ width: 10, height: 10, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAlerts = async () => {
    const { data } = await api.getAlerts();
    if (data) {
      setAlerts(data.map(apiAlertToAlertItem));
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);
  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL");

  const updatedText = lastUpdated
    ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · India`
    : "Loading...";

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>Threat Intelligence</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{updatedText}</Text>
              </View>
              <View style={[styles.liveDot, { borderColor: (loading ? colors.mutedForeground : colors.riskHigh) + "44" }]}>
                <PulsingDot color={loading ? colors.mutedForeground : colors.riskHigh} />
                <Text style={[styles.liveText, { color: loading ? colors.mutedForeground : colors.riskHigh }]}>
                  {loading ? "..." : "LIVE"}
                </Text>
              </View>
            </View>

            {criticalAlerts.length > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: "#1F0A0A", borderColor: colors.riskHigh + "55" }]}>
                <Feather name="alert-triangle" size={14} color={colors.riskHigh} />
                <Text style={[styles.bannerText, { color: colors.riskHigh }]}>
                  {criticalAlerts.length} critical threat{criticalAlerts.length > 1 ? "s" : ""} active — exercise extreme caution
                </Text>
              </View>
            )}

            <View style={[styles.sourceNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={11} color={colors.mutedForeground} />
              <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                Alerts are curated by our security team and updated from the admin panel. Pull down to refresh.
              </Text>
            </View>

            <View style={styles.filterRow}>
              {SEVERITY_FILTERS.map((f) => (
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
        renderItem={({ item }) => <View style={styles.item}><AlertCard item={item} /></View>}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name={loading ? "loader" : "bell-off"} size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {loading ? "Loading alerts..." : "No alerts for this filter"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 0 },
  header: { gap: 12, paddingBottom: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveInner: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  sourceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  item: { marginBottom: 10 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
