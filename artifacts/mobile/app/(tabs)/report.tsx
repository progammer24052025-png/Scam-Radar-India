import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

type ScamType = "phone" | "upi" | "message";
type ScamCategory = "UPI Fraud" | "Job Scam" | "Bank Scam" | "KYC Scam" | "OTP Fraud" | "Investment Scam" | "Lottery Scam" | "Other";

const TYPE_OPTIONS: { key: ScamType; label: string; icon: string; placeholder: string }[] = [
  { key: "phone", label: "Phone", icon: "phone", placeholder: "+91 98765 43210" },
  { key: "upi", label: "UPI ID", icon: "credit-card", placeholder: "name@upi" },
  { key: "message", label: "Message", icon: "message-square", placeholder: "Paste the suspicious message here..." },
];

const CATEGORIES: ScamCategory[] = [
  "UPI Fraud", "Job Scam", "Bank Scam", "KYC Scam", "OTP Fraud", "Investment Scam", "Lottery Scam", "Other",
];

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [scamType, setScamType] = useState<ScamType>("phone");
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ScamCategory | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    setError(null);

    const { data, error: apiError } = await api.submitReport({
      type: scamType,
      value: input.trim(),
      category: category ?? "Other",
      description: description.trim(),
      submitterUid: user?.uid,
    });

    if (apiError || !data) {
      setError("Could not submit report. Please try again.");
      setIsSubmitting(false);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReportId(data.id);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setInput("");
    setDescription("");
    setCategory(null);
    setScreenshot(null);
    setSubmitted(false);
    setError(null);
    setReportId(null);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={[styles.successWrap, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.riskLow + "20", borderColor: colors.riskLow + "44" }]}>
            <Feather name="check-circle" size={40} color={colors.riskLow} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Submitted</Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
            Your report is now in our moderation queue. Our admin team will review it and only verify it if it checks out. You won't be notified individually, but verified scams are broadcast to all users.
          </Text>
          {reportId && (
            <View style={[styles.refCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>REPORT REFERENCE ID</Text>
              <Text style={[styles.refId, { color: colors.primary }]}>{reportId}</Text>
            </View>
          )}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "search", text: "Duplicate detection in progress" },
              { icon: "users", text: "User trust score evaluated" },
              { icon: "shield", text: "Admin moderation pending" },
              { icon: "bell", text: "If verified, all users will be notified" },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Feather name={item.icon as any} size={13} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.primary }]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={[styles.resetText, { color: colors.primaryForeground }]}>Submit Another Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentType = TYPE_OPTIONS.find((t) => t.key === scamType)!;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Report a Scam</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            All reports are reviewed by our admin team before affecting any risk scores.
          </Text>

          <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="info" size={13} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
              Reports go through duplicate detection, pattern clustering, and admin moderation. Only verified reports affect risk scores. False reports are rejected and ignored.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHAT ARE YOU REPORTING?</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.75}
                  onPress={() => { setScamType(t.key); setInput(""); }}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: scamType === t.key ? colors.primary + "18" : colors.card,
                      borderColor: scamType === t.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={t.icon as any}
                    size={16}
                    color={scamType === t.key ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[styles.typeBtnText, { color: scamType === t.key ? colors.primary : colors.mutedForeground }]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {scamType === "phone" ? "PHONE NUMBER" : scamType === "upi" ? "UPI ID" : "SUSPICIOUS MESSAGE"}
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  minHeight: scamType === "message" ? 100 : 48,
                },
              ]}
              placeholder={currentType.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline={scamType === "message"}
              numberOfLines={scamType === "message" ? 4 : 1}
              textAlignVertical={scamType === "message" ? "top" : "center"}
              keyboardType={scamType === "phone" ? "phone-pad" : "default"}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === cat ? colors.primary : colors.card,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: category === cat ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  minHeight: 90,
                },
              ]}
              placeholder="Describe what happened — helps our team verify the report faster..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SCREENSHOT (OPTIONAL)</Text>
            {screenshot ? (
              <View style={styles.screenshotWrap}>
                <Image source={{ uri: screenshot }} style={styles.screenshot} />
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setScreenshot(null)}
                >
                  <Feather name="x" size={14} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={handlePickImage}
                activeOpacity={0.75}
              >
                <Feather name="image" size={20} color={colors.mutedForeground} />
                <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Add screenshot of the scam</Text>
              </TouchableOpacity>
            )}
          </View>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.riskHighBg, borderColor: colors.riskHigh + "55" }]}>
              <Feather name="alert-circle" size={13} color={colors.riskHigh} />
              <Text style={[styles.errorText, { color: colors.riskHigh }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: input.trim() && !isSubmitting ? colors.primary : colors.secondary,
                opacity: input.trim() && !isSubmitting ? 1 : 0.5,
              },
            ]}
            onPress={handleSubmit}
            disabled={!input.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <View style={styles.submitRow}>
                <Feather name="flag" size={16} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.submitText, { color: input.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                  Submit Report
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 20 },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  successDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  refCard: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  refLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.8 },
  refId: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.5 },
  infoCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  resetBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  resetText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: -8,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  section: { gap: 10 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeBtnText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  inputField: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  uploadBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  screenshotWrap: { position: "relative", alignSelf: "flex-start" },
  screenshot: { width: 120, height: 120, borderRadius: 10 },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
