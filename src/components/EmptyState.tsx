import React from "react";
import { View, Text } from "react-native";

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>{title}</Text>
      {!!subtitle && <Text style={{ marginTop: 8, textAlign: "center" }}>{subtitle}</Text>}
    </View>
  );
}
