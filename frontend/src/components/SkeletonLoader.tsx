import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: "#E8E0D5", opacity },
        style,
      ]}
    />
  );
}

// ── Pre-built skeleton layouts for each tab ────────────────────────────────

export function HomeScreenSkeleton() {
  return (
    <View style={s.scrollContent}>
      {/* Wellness card */}
      <SkeletonBox height={148} borderRadius={20} style={{ marginBottom: 12 }} />
      {/* Log button */}
      <SkeletonBox height={52} borderRadius={14} style={{ marginBottom: 20 }} />
      {/* Section header */}
      <View style={s.rowBetween}>
        <SkeletonBox width={120} height={14} borderRadius={7} />
        <SkeletonBox width={50} height={14} borderRadius={7} />
      </View>
      <View style={{ marginTop: 10 }} />
      {/* 3 symptom cards */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.cardRow}>
          <SkeletonBox width={42} height={42} borderRadius={10} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="70%" height={14} borderRadius={7} />
            <SkeletonBox width="45%" height={11} borderRadius={6} />
          </View>
          <SkeletonBox width={30} height={22} borderRadius={6} />
        </View>
      ))}
      {/* AI banner */}
      <SkeletonBox height={64} borderRadius={14} style={{ marginTop: 12 }} />
    </View>
  );
}

export function InsightsScreenSkeleton() {
  return (
    <View style={s.scrollContent}>
      {/* Chart card */}
      <SkeletonBox height={130} borderRadius={20} style={{ marginBottom: 12 }} />
      {/* 2 stat cards */}
      <View style={s.rowGap}>
        <SkeletonBox height={90} borderRadius={14} style={{ flex: 1 }} />
        <SkeletonBox height={90} borderRadius={14} style={{ flex: 1 }} />
      </View>
      <View style={{ marginTop: 16, marginBottom: 8 }}>
        <SkeletonBox width={110} height={11} borderRadius={6} />
      </View>
      {/* 3 finding cards */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.cardRow, { alignItems: "flex-start", marginBottom: 10 }]}>
          <SkeletonBox width={44} height={44} borderRadius={10} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="60%" height={14} borderRadius={7} />
            <SkeletonBox width="100%" height={11} borderRadius={6} />
            <SkeletonBox width="80%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TimelineScreenSkeleton() {
  return (
    <View style={s.scrollContent}>
      {/* Search bar */}
      <SkeletonBox height={44} borderRadius={12} style={{ marginBottom: 16 }} />
      {/* Filter chips */}
      <View style={[s.rowGap, { marginBottom: 16 }]}>
        {[80, 90, 70, 95].map((w, i) => (
          <SkeletonBox key={i} width={w} height={32} borderRadius={16} />
        ))}
      </View>
      {/* 5 timeline cards */}
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={[s.cardRow, { marginBottom: 10 }]}>
          <SkeletonBox width={42} height={42} borderRadius={10} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="65%" height={14} borderRadius={7} />
            <SkeletonBox width="40%" height={11} borderRadius={6} />
          </View>
          <SkeletonBox width={28} height={20} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

export function SummaryScreenSkeleton() {
  return (
    <View style={s.scrollContent}>
      {/* Header card */}
      <SkeletonBox height={100} borderRadius={20} style={{ marginBottom: 12 }} />
      {/* 2 stat boxes */}
      <View style={[s.rowGap, { marginBottom: 12 }]}>
        <SkeletonBox height={80} borderRadius={14} style={{ flex: 1 }} />
        <SkeletonBox height={80} borderRadius={14} style={{ flex: 1 }} />
      </View>
      {/* Section */}
      <SkeletonBox width={130} height={11} borderRadius={6} style={{ marginBottom: 10 }} />
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} height={54} borderRadius={12} style={{ marginBottom: 8 }} />
      ))}
      <SkeletonBox width={130} height={11} borderRadius={6} style={{ marginBottom: 10, marginTop: 6 }} />
      {[0, 1].map((i) => (
        <SkeletonBox key={i} height={54} borderRadius={12} style={{ marginBottom: 8 }} />
      ))}
      {/* Export button */}
      <SkeletonBox height={52} borderRadius={14} style={{ marginTop: 8 }} />
    </View>
  );
}

export function ProfileScreenSkeleton() {
  return (
    <View style={s.scrollContent}>
      {/* Profile hero */}
      <SkeletonBox height={180} borderRadius={20} style={{ marginBottom: 16 }} />
      {/* Stats row */}
      <View style={[s.rowGap, { marginBottom: 16 }]}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} height={70} borderRadius={14} style={{ flex: 1 }} />
        ))}
      </View>
      {/* Achievements header */}
      <SkeletonBox width={130} height={11} borderRadius={6} style={{ marginBottom: 12 }} />
      {/* 3 achievement rows */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.cardRow, { marginBottom: 10 }]}>
          <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="55%" height={14} borderRadius={7} />
            <SkeletonBox width="80%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowGap: {
    flexDirection: "row",
    gap: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EDE5D8",
  },
});
