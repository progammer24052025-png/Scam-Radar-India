import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { AnalysisResult } from "@/utils/scamAnalyzer";

interface EvidencePanelProps {
  result: AnalysisResult;
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Feather name={icon as any} size={14} color={colors.mutedForeground} />
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function EvidencePanel({ result }: EvidencePanelProps) {
  const colors = useColors();
  const { verifiedReports, pendingReports, reportCount, lastReported, scamCategory, geographicDistribution } = result;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Evidence Panel</Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.reportGrid}>
        <View style={[styles.reportBox, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.reportNum, { color: colors.riskHigh }]}>{verifiedReports}</Text>
          <Text style={[styles.reportLbl, { color: colors.mutedForeground }]}>Verified Reports</Text>
        </View>
        <View style={[styles.reportBox, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.reportNum, { color: colors.riskMedium }]}>{pendingReports}</Text>
          <Text style={[styles.reportLbl, { color: colors.mutedForeground }]}>Pending Review</Text>
        </View>
        <View style={[styles.reportBox, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.reportNum, { color: colors.foreground }]}>{reportCount}</Text>
          <Text style={[styles.reportLbl, { color: colors.mutedForeground }]}>Total Reports</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <StatRow icon="clock" label="Last Reported" value={lastReported ?? "No reports yet"} />
      <StatRow icon="tag" label="Scam Category" value={scamCategory} color={scamCategory !== "Unknown" ? colors.riskMedium : undefined} />

      {geographicDistribution.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.geoLabel, { color: colors.mutedForeground }]}>Geographic Distribution</Text>
          {geographicDistribution.map((g) => (
            <View key={g.state} style={styles.geoRow}>
              <Text style={[styles.geoState, { color: colors.foreground }]}>{g.state}</Text>
              <View style={styles.geoBarWrap}>
                <View
                  style={[
                    styles.geoBar,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min((g.count / (geographicDistribution[0]?.count || 1)) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.geoCount, { color: colors.mutedForeground }]}>{g.count}</Text>
            </View>
          ))}
        </>
      )}
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
  reportGrid: {
    flexDirection: "row",
    gap: 8,
  },
  reportBox: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  reportNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  reportLbl: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  geoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  geoState: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    width: 90,
  },
  geoBarWrap: {
    flex: 1,
    height: 5,
    backgroundColor: "#1E2A3D",
    borderRadius: 3,
    overflow: "hidden",
  },
  geoBar: {
    height: 5,
    borderRadius: 3,
    opacity: 0.7,
  },
  geoCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    width: 24,
    textAlign: "right",
  },
});
