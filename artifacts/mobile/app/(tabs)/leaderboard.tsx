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

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api, type UserProfile } from "@/utils/api";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function LeaderRow({ user, rank, isMe, index }: { user: UserProfile; rank: number; isMe: boolean; index: number }) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : null;
  const bg = isMe ? colors.primary + "18" : colors.card;
  const borderColor = isMe ? colors.primary + "44" : colors.border;

  return (
    <Animated.View
      style={[
        styles.row,
        { backgroundColor: bg, borderColor, transform: [{ translateX: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: medalColor ? medalColor + "22" : colors.secondary }]}>
        {rank <= 3 ? (
          <Text style={[styles.rankMedal, { color: medalColor! }]}>
            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
          </Text>
        ) : (
          <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{rank}</Text>
        )}
      </View>

      <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {(user.displayName || "?")[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: isMe ? colors.primary : colors.foreground }]} numberOfLines={1}>
            {user.displayName || "Anonymous"}
          </Text>
          {isMe && (
            <View style={[styles.youBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.youText, { color: colors.primaryForeground }]}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={[styles.stats, { color: colors.mutedForeground }]}>
          {user.reportsVerified ?? 0} verified · {user.reportsSubmitted ?? 0} submitted
        </Text>
      </View>

      <View style={styles.pointsWrap}>
        <Text style={[styles.points, { color: medalColor ?? (isMe ? colors.primary : colors.foreground) }]}>
          {user.points}
        </Text>
        <Text style={[styles.ptLabel, { color: colors.mutedForeground }]}>pts</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    const { data } = await api.getLeaderboard();
    if (data) setLeaders(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const myRank = user ? leaders.findIndex((l) => l.uid === user.uid) + 1 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FlatList
        data={leaders}
        keyExtractor={(item) => item.uid}
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
            <Text style={[styles.title, { color: colors.foreground }]}>Community Leaderboard</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Top reporters ranked by contribution points
            </Text>

            <View style={[styles.pointsGuide, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.guideTitle, { color: colors.foreground }]}>How points work</Text>
              <View style={styles.guideRows}>
                {[
                  { action: "Submit a report", pts: "+5", color: colors.primary },
                  { action: "Report verified by admin", pts: "+20", color: colors.riskLow },
                  { action: "Report rejected", pts: "-10", color: colors.riskHigh },
                ].map((g) => (
                  <View key={g.action} style={styles.guideRow}>
                    <Text style={[styles.guideAction, { color: colors.mutedForeground }]}>{g.action}</Text>
                    <Text style={[styles.guidePts, { color: g.color }]}>{g.pts} pts</Text>
                  </View>
                ))}
              </View>
            </View>

            {user && myRank > 0 && (
              <View style={[styles.myRankCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}>
                <Feather name="user" size={14} color={colors.primary} />
                <Text style={[styles.myRankText, { color: colors.primary }]}>
                  Your rank: #{myRank} · {user.points} points
                </Text>
              </View>
            )}

            {loading && (
              <View style={styles.loadingWrap}>
                {[...Array(5)].map((_, i) => (
                  <View key={i} style={[styles.skeleton, { backgroundColor: colors.secondary, opacity: 1 - i * 0.15 }]} />
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.rowWrap}>
            <LeaderRow
              user={item}
              rank={index + 1}
              isMe={user?.uid === item.uid}
              index={index}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="award" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No reporters yet. Be the first to report a scam!
              </Text>
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
  header: { gap: 14, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: -6 },
  pointsGuide: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  guideTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  guideRows: { gap: 8 },
  guideRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  guideAction: { fontFamily: "Inter_400Regular", fontSize: 12 },
  guidePts: { fontFamily: "Inter_700Bold", fontSize: 13 },
  myRankCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  myRankText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  loadingWrap: { gap: 10, marginTop: 4 },
  skeleton: { height: 64, borderRadius: 14 },
  rowWrap: { marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankMedal: { fontSize: 18 },
  rankNum: { fontFamily: "Inter_700Bold", fontSize: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.5 },
  stats: { fontFamily: "Inter_400Regular", fontSize: 11 },
  pointsWrap: { alignItems: "flex-end" },
  points: { fontFamily: "Inter_700Bold", fontSize: 18 },
  ptLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 30 },
});
