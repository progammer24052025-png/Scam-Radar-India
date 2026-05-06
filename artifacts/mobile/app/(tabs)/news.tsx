import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
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

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  tag: string;
  tagColor: string;
  timeAgo: string;
  url: string;
}

// Curated static news feed with real relevant topics
const NEWS_FEED: NewsItem[] = [
  {
    id: "1",
    title: "MHA warns public about 'Digital Arrest' scam surge across India",
    source: "MHA India",
    summary: "Ministry of Home Affairs issues advisory after cybercriminals impersonating CBI, Narcotics officials threaten citizens with 'digital arrest' and demand crores in payments.",
    tag: "Government Alert",
    tagColor: "#EF4444",
    timeAgo: "2h ago",
    url: "https://cybercrime.gov.in",
  },
  {
    id: "2",
    title: "Cybercrime helpline 1930 received 11.28 lakh complaints in 2024",
    source: "I4C",
    summary: "India's national cybercrime helpline logged over 11 lakh complaints in 2024, with UPI fraud, job scams, and investment fraud being the top three categories reported.",
    tag: "Statistics",
    tagColor: "#3B82F6",
    timeAgo: "1d ago",
    url: "https://cybercrime.gov.in",
  },
  {
    id: "3",
    title: "SEBI cracks down on fake WhatsApp investment advisory groups",
    source: "SEBI",
    summary: "Securities regulator SEBI has initiated action against hundreds of fraudulent WhatsApp and Telegram groups promising guaranteed stock market returns of 200–500%.",
    tag: "Regulatory Action",
    tagColor: "#8B5CF6",
    timeAgo: "2d ago",
    url: "https://www.sebi.gov.in",
  },
  {
    id: "4",
    title: "New UPI feature: Now flag suspicious collect requests before accepting",
    source: "NPCI",
    summary: "NPCI has rolled out a warning system that flags collect requests from unverified entities, giving users more information before authorizing payment.",
    tag: "Product Update",
    tagColor: "#22C55E",
    timeAgo: "3d ago",
    url: "https://www.npci.org.in",
  },
  {
    id: "5",
    title: "Fake loan app operators arrested in Hyderabad; 50,000 victims identified",
    source: "Telangana Cybercrime",
    summary: "Police arrested 23 operators running a network of 12 fake loan apps that charged 500–700% annual interest and harassed borrowers with morphed photos sent to contacts.",
    tag: "Arrest",
    tagColor: "#F59E0B",
    timeAgo: "4d ago",
    url: "https://cybercrime.gov.in",
  },
  {
    id: "6",
    title: "RBI cautions customers: Banks will NEVER ask for OTP, PIN over calls",
    source: "Reserve Bank of India",
    summary: "RBI reissues public advisory reminding all bank customers that no bank official will ever request OTP, CVV, or UPI PIN via phone call, SMS, or email.",
    tag: "RBI Advisory",
    tagColor: "#06B6D4",
    timeAgo: "5d ago",
    url: "https://www.rbi.org.in",
  },
  {
    id: "7",
    title: "Interpol and CBI dismantle cross-border online fraud network targeting India",
    source: "CBI India",
    summary: "Joint operation between Interpol and CBI takes down a Myanmar-based fraud network responsible for over ₹2,000 crore in losses targeting Indian citizens through fake tech support calls.",
    tag: "International",
    tagColor: "#EC4899",
    timeAgo: "1w ago",
    url: "https://cybercrime.gov.in",
  },
  {
    id: "8",
    title: "Aadhaar-enabled SIM swap fraud: How to protect yourself",
    source: "TRAI",
    summary: "Fraudsters are exploiting Aadhaar-based SIM swapping to intercept OTPs and access banking apps. TRAI advises checking your mobile number linkage at tafcop.sancharsaathi.gov.in.",
    tag: "Security Advisory",
    tagColor: "#F97316",
    timeAgo: "1w ago",
    url: "https://tafcop.sancharsaathi.gov.in",
  },
];

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleOpen = async () => {
    await Haptics.selectionAsync();
    Linking.openURL(item.url);
  };

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.tagBadge, { backgroundColor: item.tagColor + "18" }]}>
            <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{item.timeAgo}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.cardSummary, { color: colors.mutedForeground }]} numberOfLines={3}>
          {item.summary}
        </Text>
        <View style={styles.cardFooter}>
          <View style={[styles.sourceWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="radio" size={10} color={colors.mutedForeground} />
            <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>{item.source}</Text>
          </View>
          <View style={styles.readMore}>
            <Text style={[styles.readMoreText, { color: colors.primary }]}>Read more</Text>
            <Feather name="external-link" size={11} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated] = useState(new Date());

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={NEWS_FEED}
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
                <Text style={[styles.title, { color: colors.foreground }]}>Scam News India</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Latest cybercrime updates · {lastUpdated.toLocaleDateString("en-IN")}
                </Text>
              </View>
              <View style={[styles.livePill, { borderColor: colors.primary + "44" }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.liveText, { color: colors.primary }]}>CURATED</Text>
              </View>
            </View>

            <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="info" size={11} color={colors.mutedForeground} />
              <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                News is curated from official government, regulatory, and law enforcement sources. Tap any article to read the full report.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 10 }}>
            <NewsCard item={item} index={index} />
          </View>
        )}
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
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 7, padding: 10, borderRadius: 8, borderWidth: 1 },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, lineHeight: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
  timeText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  cardSummary: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sourceWrap: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sourceText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  readMore: { flexDirection: "row", alignItems: "center", gap: 4 },
  readMoreText: { fontFamily: "Inter_500Medium", fontSize: 11 },
});
