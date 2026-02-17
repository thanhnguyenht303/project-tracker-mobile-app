import React from "react";
import { View, Text } from "react-native";
import { ProjectStatus, STATUS_LABEL } from "../types/project";

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 }}>
      <Text style={{ fontSize: 12 }}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}
