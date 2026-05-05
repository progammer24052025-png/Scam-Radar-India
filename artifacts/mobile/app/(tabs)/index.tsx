import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useScam } from "@/context/ScamContext";
import { useColors } from "@/hooks/useColors";
import { detectInputType } from "@/utils/scamAnalyzer";
import HistoryCard from "@/components/HistoryCard";

const PLACEHOLDERS = [
  "Enter phone number, e.g. +91 98765 43210",
  "Paste suspicious message here...",
  "Enter UPI ID, e.g. name@upi",
  "Check any number, UPI, or message",
];

const LOADING_TEXTS = [
  "Analyzing input type...",
  "Scanning pattern database...",
  "Cross-referencing 847,392 verified reports...",
  "Calculating risk score...",
  "Preparing results...",
];

const TYPE_LABELS: Record<string, string> = {
  phone: "Phone Number",
  upi: "UPI ID",
  message: "Message",
  unknown: "Auto-detect",
};

const TYPE_ICONS: Record<string, string> = {
  phone: "phone",
  upi: "credit-card",
  message: "message-square",
  unknown: "search",
};

export default function CheckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyzeText, isAnalyzing, history } = useScam();

  const [input, setInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const focusAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  const detectedType = input.trim() ? detectInputType(input) : "unknown";

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAnalyzing) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_TEXTS.length;
      setLoadingTextIndex(i);
    }, 450);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  const handleCheck = async () => {
    if (!input.trim() || isAnalyzing) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analyzeText(input.trim()).then(() => {
      router.push("/results");
    });
  };

  const recentHistory = history.slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <FlatList
          data={recentHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <View style={styles.brand}>
                <View style={[styles.shieldIcon, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                  <Feather name="shield" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.brandName, { color: colors.foreground }]}>SCAM RADAR</Text>
                  <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>India Scam Intelligence Platform</Text>
                </View>
              </View>

              <Text style={[styles.headline, { color: colors.foreground }]}>
                Check Before You Trust{"\n"}Any Payment or Message
              </Text>

              <Animated.View
                style={[
                  styles.inputCard,
                  {
                    backgroundColor: colors.card,
                    borderColor,
                    shadowColor: colors.primary,
                    shadowOpacity,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 0,
                  },
                ]}
              >
                {input.trim() && detectedType !== "unknown" && (
                  <View style={[styles.typeTag, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name={TYPE_ICONS[detectedType] as any} size={11} color={colors.primary} />
                    <Text style={[styles.typeTagText, { color: colors.primary }]}>{TYPE_LABELS[detectedType]}</Text>
                  </View>
                )}

                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={PLACEHOLDERS[placeholderIndex]}
                  placeholderTextColor={colors.mutedForeground}
                  value={input}
                  onChangeText={setInput}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isAnalyzing}
                />

                {input.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => setInput("")}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </Animated.View>

              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Feather name="check-circle" size={11} color={colors.riskLow} />
                  <Text style={[styles.trustText, { color: colors.mutedForeground }]}>Verified reports only affect results</Text>
                </View>
                <View style={styles.trustItem}>
                  <Feather name="cpu" size={11} color={colors.primary} />
                  <Text style={[styles.trustText, { color: colors.mutedForeground }]}>AI + human moderation</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkBtn,
                  {
                    backgroundColor: input.trim() && !isAnalyzing ? colors.primary : colors.secondary,
                    opacity: input.trim() && !isAnalyzing ? 1 : 0.6,
                  },
                ]}
                onPress={handleCheck}
                activeOpacity={0.8}
                disabled={!input.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                    <Text style={[styles.loadingText, { color: colors.primaryForeground }]}>
                      {LOADING_TEXTS[loadingTextIndex]}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Feather name="shield" size={16} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
                    <Text style={[styles.btnText, { color: input.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                      Analyze Now
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={[styles.statsRow, { borderColor: colors.border }]}>
                {[
                  { value: "847K+", label: "Scams Detected" },
                  { value: "99.2%", label: "Accuracy Rate" },
                  { value: "1930", label: "Helpline" },
                ].map((stat, i) => (
                  <View key={i} style={[styles.statItem, i < 2 ? { borderRightWidth: 1, borderRightColor: colors.border } : {}]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {recentHistory.length > 0 && (
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Checks</Text>
              )}
            </View>
          }
          renderItem={({ item }) => <View style={styles.historyItem}><HistoryCard record={item} /></View>}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={null}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 18,
    gap: 0,
  },
  headerSection: {
    gap: 18,
    paddingBottom: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 2,
  },
  brandSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  headline: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    lineHeight: 32,
  },
  inputCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
    minHeight: 90,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 48,
  },
  clearBtn: {
    alignSelf: "flex-end",
    padding: 4,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trustText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  checkBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 4,
  },
  historyItem: {
    marginBottom: 8,
  },
});
