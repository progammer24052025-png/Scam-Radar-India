import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EvidencePanel from "@/components/EvidencePanel";
import PatternHighlight from "@/components/PatternHighlight";
import RiskGauge from "@/components/RiskGauge";
import SuggestedActions from "@/components/SuggestedActions";
import { useScam } from "@/context/ScamContext";
import { useColors } from "@/hooks/useColors";

const TYPE_ICONS: Record<string, string> = {
  phone: "phone",
  upi: "credit-card",
  message: "message-square",
  unknown: "help-circle",
};

const TYPE_LABELS: Record<string, string> = {
  phone: "Phone Number",
  upi: "UPI ID",
  message: "Message",
  unknown: "Unknown",
};

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentAnalysis, currentInput } = useScam();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }),
    ]).start();
  }, []);

  if (!currentAnalysis) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.noResult}>
          <Text style={[styles.noResultText, { color: colors.mutedForeground }]}>No analysis available</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Go back and check something</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { riskScore, riskLevel, explanation, confidence, inputType, patterns, suggestedActions } = currentAnalysis;

  const riskColor =
    riskLevel === "HIGH" ? colors.riskHigh : riskLevel === "MEDIUM" ? colors.riskMedium : colors.riskLow;

  const displayInput =
    inputType === "message" && currentInput.length > 60
      ? currentInput.slice(0, 60) + "..."
      : currentInput;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analysis Result</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inputBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.inputIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={TYPE_ICONS[inputType] as any} size={14} color={colors.primary} />
          </View>
          <View style={styles.inputInfo}>
            <Text style={[styles.inputTypeLabel, { color: colors.mutedForeground }]}>{TYPE_LABELS[inputType]}</Text>
            <Text style={[styles.inputValue, { color: colors.foreground }]} numberOfLines={2}>
              {displayInput}
            </Text>
          </View>
        </View>

        <View style={[styles.gaugeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RISK ANALYSIS</Text>
          <RiskGauge score={riskScore} riskLevel={riskLevel} size={200} />
        </View>

        <View style={[styles.explanationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.cardHeading, { color: colors.foreground }]}>Why This Result?</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.explanationText, { color: colors.foreground }]}>{explanation}</Text>
        </View>

        <EvidencePanel result={currentAnalysis} />

        {inputType === "message" && (
          <PatternHighlight message={currentInput} patterns={patterns} />
        )}

        <View style={[styles.confidenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={14} color={colors.primary} />
            <Text style={[styles.cardHeading, { color: colors.foreground }]}>Confidence Level</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBarWrap, { backgroundColor: colors.secondary }]}>
              <View
                style={[styles.confidenceBar, { width: `${confidence}%`, backgroundColor: riskColor }]}
              />
            </View>
            <Text style={[styles.confidenceNum, { color: riskColor }]}>{confidence}%</Text>
          </View>
          <Text style={[styles.confidenceNote, { color: colors.mutedForeground }]}>
            {confidence >= 80
              ? "High confidence — based on strong pattern match and multiple verified reports"
              : confidence >= 60
              ? "Moderate confidence — limited data, but patterns indicate risk"
              : "Low confidence — insufficient data; use independent verification"}
          </Text>
        </View>

        <SuggestedActions actions={suggestedActions} riskLevel={riskLevel} />

        <TouchableOpacity
          style={[styles.reportCta, { borderColor: colors.riskMedium + "66", backgroundColor: colors.riskMedium + "10" }]}
          activeOpacity={0.75}
          onPress={() => router.push("/(tabs)/report")}
        >
          <Feather name="flag" size={14} color={colors.riskMedium} />
          <Text style={[styles.reportCtaText, { color: colors.riskMedium }]}>Report this {TYPE_LABELS[inputType]}</Text>
          <Feather name="chevron-right" size={14} color={colors.riskMedium} />
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerRight: {
    width: 28,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 14,
  },
  inputBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  inputInfo: {
    flex: 1,
    gap: 2,
  },
  inputTypeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  inputValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  gaugeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    alignSelf: "flex-start",
  },
  explanationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardHeading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
  },
  explanationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  confidenceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confidenceBarWrap: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
  },
  confidenceNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    width: 40,
    textAlign: "right",
  },
  confidenceNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  noResult: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  noResultText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  backLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  reportCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  reportCtaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    textAlign: "center",
  },
});
