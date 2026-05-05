import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
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

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "1",
    title: "SBI KYC Update Scam — Nationwide",
    description: "Fraudsters posing as SBI officials on WhatsApp, sending fake KYC update links that redirect to credential-harvesting pages. Victims report unauthorized transactions after visiting link.",
    category: "Bank Scam",
    severity: "CRITICAL",
    reportCount: 2847,
    location: "Pan India",
    timeAgo: "1h ago",
    trend: "rising",
    indicators: ["Fake SBI WhatsApp", "Phishing URL", "KYC urgency"],
  },
  {
    id: "2",
    title: "Work-From-Home Job Offer Surge",
    description: "Fake job offers promising ₹30,000–₹80,000/month for data entry work from home. Targets recent graduates and homemakers. Requires advance registration fee of ₹500–₹2,000.",
    category: "Job Scam",
    severity: "HIGH",
    reportCount: 1193,
    location: "Delhi, Mumbai, Bengaluru",
    timeAgo: "3h ago",
    trend: "rising",
    indicators: ["Advance fee required", "Unverified company", "WFH promise"],
  },
  {
    id: "3",
    title: "UPI Collect Request Fraud",
    description: "Scammers sending UPI collect requests disguised as cashback or refunds. Victims who accept requests unknowingly authorize debit from their account instead of receiving credit.",
    category: "UPI Fraud",
    severity: "HIGH",
    reportCount: 4102,
    location: "All states",
    timeAgo: "5h ago",
    trend: "stable",
    indicators: ["Fake collect request", "Cashback pretext", "Unknown UPI ID"],
  },
  {
    id: "4",
    title: "I4C Impersonation — Digital Arrest Scam",
    description: "Callers claiming to be I4C or CBI officers threaten 'digital arrest' for alleged illegal online activity. Demand payments of ₹50,000–₹5,00,000 to avoid arrest.",
    category: "Authority Impersonation",
    severity: "HIGH",
    reportCount: 867,
    location: "Metro cities",
    timeAgo: "8h ago",
    trend: "rising",
    indicators: ["Arrest threat", "Authority impersonation", "Large payment demand"],
  },
  {
    id: "5",
    title: "TRAI SIM Card Disconnection Threat",
    description: "Automated calls claiming TRAI will disconnect SIM cards for illegal activity. Victims are transferred to fake police who demand immediate payment to retain service.",
    category: "Authority Impersonation",
    severity: "MEDIUM",
    reportCount: 645,
    location: "Tier-2 cities",
    timeAgo: "12h ago",
    trend: "stable",
    indicators: ["SIM disconnect threat", "TRAI impersonation", "Automated call"],
  },
  {
    id: "6",
    title: "KBC Lottery SMS Wave",
    description: "Bulk SMS claiming lottery win of ₹25 lakh from KBC. Directs victims to call a number and pay processing fee of ₹2,000–₹10,000 via UPI to claim prize.",
    category: "Lottery Scam",
    severity: "MEDIUM",
    reportCount: 512,
    location: "Rural areas, Tier-3 cities",
    timeAgo: "1d ago",
    trend: "declining",
    indicators: ["KBC branding", "Processing fee", "Bulk SMS"],
  },
  {
    id: "7",
    title: "AnyDesk RAT Installation Scam",
    description: "Scammers posing as bank customer support ask victims to install AnyDesk for 'technical assistance'. Once installed, they access the victim's banking app and transfer funds.",
    category: "Bank Scam",
    severity: "HIGH",
    reportCount: 378,
    location: "Urban areas",
    timeAgo: "2d ago",
    trend: "declining",
    indicators: ["Remote access tool", "Bank impersonation", "App installation request"],
  },
  {
    id: "8",
    title: "Fake Investment Platform Scam",
    description: "WhatsApp groups promoting fake stock trading and crypto platforms offering guaranteed 3x returns. Initial small returns paid to build trust, then victims lose large deposits.",
    category: "Investment Scam",
    severity: "MEDIUM",
    reportCount: 289,
    location: "Urban, semi-urban",
    timeAgo: "3d ago",
    trend: "rising",
    indicators: ["Guaranteed returns", "WhatsApp groups", "Fake platform"],
  },
];

type SeverityFilter = "all" | "CRITICAL" | "HIGH" | "MEDIUM";

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "HIGH", label: "High" },
  { key: "MEDIUM", label: "Medium" },
];

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filter === "all" ? MOCK_ALERTS : MOCK_ALERTS.filter((a) => a.severity === filter);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const criticalAlerts = MOCK_ALERTS.filter((a) => a.severity === "CRITICAL");

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
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Updated continuously · India</Text>
              </View>
              <View style={[styles.liveDot, { borderColor: colors.riskHigh + "44" }]}>
                <View style={[styles.liveInner, { backgroundColor: colors.riskHigh }]} />
                <Text style={[styles.liveText, { color: colors.riskHigh }]}>LIVE</Text>
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
            <Feather name="bell-off" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No alerts for this filter</Text>
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
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  item: {
    marginBottom: 10,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
});
