import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

import { useColors } from "@/hooks/useColors";
import { api, type ApiReport } from "@/utils/api";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#3B82F6",
  LOW: "#22C55E",
};

const TYPE_ICONS: Record<string, string> = {
  phone: "phone",
  upi: "credit-card",
  message: "message-square",
};

function VerifiedCard({ report, index }: { report: ApiReport; index: number }) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const severity = report.scamInfo?.severity ?? "HIGH";
  const sevColor = SEVERITY_COLORS[severity] ?? colors.riskHigh;
  const timeAgo = getTimeAgo(report.verifiedAt ?? report.submittedAt);

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: sevColor + "18" }]}>
          <Feather name={TYPE_ICONS[report.type] as any} size={14} color={sevColor} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardValue, { color: colors.foreground }]} numberOfLines={1}>
            {report.value}
          </Text>
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{timeAgo}</Text>
        </View>
        <View style={[styles.sevBadge, { backgroundColor: sevColor + "18" }]}>
          <Text style={[styles.sevText, { color: sevColor }]}>{severity}</Text>
        </View>
      </View>

      {report.scamInfo?.title && (
        <Text style={[styles.scamTitle, { color: colors.foreground }]}>
          {report.scamInfo.title}
        </Text>
      )}

      {report.scamInfo?.description && (
        <Text style={[styles.scamDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
          {report.scamInfo.description}
        </Text>
      )}

      {report.scamInfo?.modus && (
        <View style={[styles.modusBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="info" size={10} color={colors.mutedForeground} />
          <Text style={[styles.modusText, { color: colors.mutedForeground }]}>
            Modus: {report.scamInfo.modus}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={[styles.verifiedBadge, { backgroundColor: colors.riskLow + "18" }]}>
          <Feather name="check-circle" size={10} color={colors.riskLow} />
          <Text style={[styles.verifiedText, { color: colors.riskLow }]}>Admin Verified</Text>
        </View>
        <Text style={[styles.catText, { color: colors.mutedForeground }]}>{report.category}</Text>
      </View>
    </Animated.View>
  );
}

function getTimeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function VerifiedReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    const { data } = await api.getVerifiedReports();
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>Verified Reports</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Admin-confirmed scams · {reports.length} total
                </Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.riskLow + "18", borderColor: colors.riskLow + "33" }]}>
                <Feather name="shield" size={12} color={colors.riskLow} />
                <Text style={[styles.verifiedLabel, { color: colors.riskLow }]}>VERIFIED</Text>
              </View>
            </View>

            <View style={[styles.infoNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={11} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Only reports reviewed and confirmed by our admin team appear here. They directly affect risk scores for all users.
              </Text>
            </View>

            {loading && (
              <View style={{ gap: 10 }}>
                {[...Array(4)].map((_, i) => (
                  <View key={i} style={[styles.skeleton, { backgroundColor: colors.secondary, opacity: 1 - i * 0.2 }]} />
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => <VerifiedCard report={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="check-circle" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No verified reports yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Submit a report — if our team verifies it, it will appear here and you'll earn 20 points.
              </Text>
              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/report")}
                activeOpacity={0.8}
              >
                <Feather name="flag" size={14} color={colors.primaryForeground} />
                <Text style={[styles.reportBtnText, { color: colors.primaryForeground }]}>Report a Scam</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 0 },
  header: { gap: 12, paddingBottom: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  verifiedLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  infoNote: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, lineHeight: 16 },
  skeleton: { height: 110, borderRadius: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  cardMeta: { flex: 1, gap: 2 },
  cardValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  cardTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  sevText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.3 },
  scamTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  scamDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  modusBadge: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  modusText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  catText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  reportBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
