import React from "react";
import { View, Text, Button } from "react-native";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "600" }}>Something went wrong</Text>
      <Text style={{ marginTop: 8, textAlign: "center" }}>{message}</Text>
      <View style={{ marginTop: 12 }}>
        <Button title="Retry" onPress={onRetry} />
      </View>
    </View>
  );
}
