import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface TipItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  summary: string;
  tips: string[];
  tag: string;
}

const TIPS: TipItem[] = [
  {
    id: "upi",
    icon: "credit-card",
    iconColor: "#3B82F6",
    tag: "UPI Safety",
    title: "UPI & Payment Safety",
    summary: "UPI collect requests = money going OUT, not IN. Never accept unknown collect requests.",
    tips: [
      "A UPI collect request asks YOU to authorize payment — it is NOT a refund or cashback",
      "Verify sender identity before accepting any collect request from unknown numbers",
      "Never share your UPI PIN with anyone, including bank officials",
      "Enable transaction notifications in your UPI app",
      "If in doubt, cancel the request and call the sender directly",
    ],
  },
  {
    id: "otp",
    icon: "lock",
    iconColor: "#EF4444",
    tag: "OTP Fraud",
    title: "Never Share OTPs",
    summary: "No bank, govt. agency, or company will ever ask for your OTP. Ever.",
    tips: [
      "Banks never ask for OTP over call, SMS, or email",
      "OTPs expire in 60–180 seconds — sharing one immediately enables fraud",
      "If someone says 'I'm from SBI/HDFC/Jio, give me your OTP' — hang up",
      "Even if the caller knows your name, account number, or card details — hang up",
      "Real customer support never needs your OTP to resolve an issue",
    ],
  },
  {
    id: "calls",
    icon: "phone",
    iconColor: "#F59E0B",
    tag: "Phone Scams",
    title: "Suspicious Call Tactics",
    summary: "Scammers use urgency and authority to panic you. Pause — then verify.",
    tips: [
      "Government agencies (CBI, I4C, TRAI) NEVER threaten arrest over phone",
      "'Digital arrest' is not a real legal concept in India — it's a scam",
      "Hang up immediately if threatened with police, income tax, or narcotics",
      "Never make payments under phone pressure — visit the official office in person",
      "Search the caller's number on Scam Radar before engaging",
    ],
  },
  {
    id: "jobs",
    icon: "briefcase",
    iconColor: "#8B5CF6",
    tag: "Job Scams",
    title: "Fake Job Offers",
    summary: "Legitimate jobs never require an advance fee. Period.",
    tips: [
      "No genuine employer asks for 'registration fee', 'training fee', or 'kit deposit'",
      "Work-from-home jobs promising ₹30,000+/month for data entry are almost always fake",
      "Verify the company on MCA21 (company registry) before applying",
      "Legitimate job offers come from official email domains, not Gmail/Yahoo",
      "Never share Aadhaar, PAN, or bank details in the first interaction",
    ],
  },
  {
    id: "invest",
    icon: "trending-up",
    iconColor: "#22C55E",
    tag: "Investment Fraud",
    title: "Investment & Crypto Scams",
    summary: "If it guarantees returns — it's a scam. Real investments carry risk.",
    tips: [
      "SEBI-registered platforms never guarantee fixed returns on stock/crypto",
      "WhatsApp 'investment groups' with consistent profit screenshots are fake",
      "Initial payouts are a strategy to build trust before the final exit scam",
      "Verify any broker/advisor at sebi.gov.in before investing",
      "Report investment fraud to SEBI's SCORES portal",
    ],
  },
  {
    id: "kyc",
    icon: "file-text",
    iconColor: "#F97316",
    tag: "KYC/Bank Scams",
    title: "Fake KYC & Bank Links",
    summary: "Banks send KYC requests by post — never through WhatsApp links.",
    tips: [
      "Never click unsolicited links claiming your account/KYC will be blocked",
      "Official bank communication comes via registered email or physical post",
      "Use your bank's official app or website to check KYC status",
      "Phishing links often look identical to real bank websites — check the URL",
      "Enable login notifications on your banking app for immediate fraud alerts",
    ],
  },
  {
    id: "social",
    icon: "users",
    iconColor: "#EC4899",
    tag: "Social Engineering",
    title: "Social Media & Impersonation",
    summary: "Scammers clone profiles of friends and family to ask for money.",
    tips: [
      "If a 'friend' messages asking for urgent money, call them directly to verify",
      "Enable two-factor authentication on all social media accounts",
      "Never share intimate photos with online contacts — blackmail is real",
      "Lottery and prize scams often come via Facebook, Instagram, or WhatsApp",
      "Report fake profiles to the platform and file at cybercrime.gov.in",
    ],
  },
  {
    id: "report",
    icon: "shield",
    iconColor: "#06B6D4",
    tag: "If You're Scammed",
    title: "Immediate Steps If Scammed",
    summary: "Act fast — the first hour is critical for recovering funds.",
    tips: [
      "Call 1930 (National Cybercrime Helpline) immediately",
      "File a complaint at cybercrime.gov.in within 24 hours",
      "Inform your bank immediately to freeze the destination account",
      "Do not transfer any more money even if promised recovery",
      "Screenshot all conversations, transaction IDs, and phone numbers",
    ],
  },
];

function TipCard({ item, index }: { item: TipItem; index: number }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  const toggle = async () => {
    await Haptics.selectionAsync();
    setExpanded((prev) => {
      Animated.timing(rotateAnim, { toValue: prev ? 0 : 1, duration: 200, useNativeDriver: true }).start();
      return !prev;
    });
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: cardAnim, transform: [{ scale: cardAnim }] },
      ]}
    >
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: item.iconColor + "18" }]}>
          <Feather name={item.icon as any} size={18} color={item.iconColor} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: item.iconColor + "15" }]}>
              <Text style={[styles.tagText, { color: item.iconColor }]}>{item.tag}</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.cardSummary, { color: colors.mutedForeground }]}>{item.summary}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.tipsWrap, { borderTopColor: colors.border }]}>
          {item.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: item.iconColor }]} />
              <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

export default function TipsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const dialHelpline = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL("tel:1930");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={TIPS}
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
            <Text style={[styles.title, { color: colors.foreground }]}>Scam Awareness Tips</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Learn how to protect yourself from the most common scams in India
            </Text>

            <TouchableOpacity
              style={[styles.sosBanner, { backgroundColor: "#1F0A0A", borderColor: colors.riskHigh + "55" }]}
              onPress={dialHelpline}
              activeOpacity={0.8}
            >
              <View style={[styles.sosIconWrap, { backgroundColor: colors.riskHigh + "22" }]}>
                <Feather name="phone-call" size={18} color={colors.riskHigh} />
              </View>
              <View style={styles.sosText}>
                <Text style={[styles.sosTitle, { color: colors.riskHigh }]}>Emergency: Call 1930</Text>
                <Text style={[styles.sosDesc, { color: colors.mutedForeground }]}>
                  National Cybercrime Helpline · Tap to call
                </Text>
              </View>
              <Feather name="phone" size={16} color={colors.riskHigh} />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 10 }}>
            <TipCard item={item} index={index} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 0 },
  header: { gap: 14, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: -6 },
  sosBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sosIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sosText: { flex: 1, gap: 2 },
  sosTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  sosDesc: { fontFamily: "Inter_400Regular", fontSize: 11 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, gap: 4 },
  tagRow: { flexDirection: "row" },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  cardSummary: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  tipsWrap: { borderTopWidth: 1, padding: 14, gap: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
});
