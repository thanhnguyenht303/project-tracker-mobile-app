import React, { useLayoutEffect, useMemo, useState } from "react";
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useProjects } from "../store/ProjectsContext";

type Props = NativeStackScreenProps<RootStackParamList, "CreateProject">;

function isValidDateYYYYMMDD(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function CreateProjectScreen({ navigation }: Props) {
  const { createProject, updatingId } = useProjects();
  const busy = updatingId !== null;

  const [draft, setDraft] = useState({
    name: "",
    clientName: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Create Project" });
  }, [navigation]);

  const canSubmit = useMemo(() => {
    return draft.name.trim() && draft.clientName.trim() && draft.startDate.trim();
  }, [draft]);

  const onCreate = async () => {
    const name = draft.name.trim();
    const clientName = draft.clientName.trim();
    const startDate = draft.startDate.trim();
    const endDateRaw = draft.endDate.trim();
    const descriptionRaw = draft.description.trim();

    if (!name) return Alert.alert("Validation", "Name is required.");
    if (!clientName) return Alert.alert("Validation", "Client name is required.");
    if (!startDate) return Alert.alert("Validation", "Start date is required.");
    if (!isValidDateYYYYMMDD(startDate)) return Alert.alert("Validation", "Start date must be YYYY-MM-DD.");

    if (endDateRaw && !isValidDateYYYYMMDD(endDateRaw)) {
      return Alert.alert("Validation", "End date must be YYYY-MM-DD (or empty).");
    }
    if (endDateRaw && endDateRaw < startDate) {
      return Alert.alert("Validation", "End date cannot be earlier than start date.");
    }

    const created = await createProject({
      name,
      clientName,
      startDate,
      endDate: endDateRaw ? endDateRaw : undefined,
      description: descriptionRaw ? descriptionRaw : undefined,
    });

    navigation.replace("ProjectDetail", { projectId: created.id });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Project Name</Text>
          <TextInput
            value={draft.name}
            onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            placeholder="Enter project name"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Client Name</Text>
          <TextInput
            value={draft.clientName}
            onChangeText={(t) => setDraft((d) => ({ ...d, clientName: t }))}
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            placeholder="Enter client name"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Start Date (YYYY-MM-DD)</Text>
          <TextInput
            value={draft.startDate}
            onChangeText={(t) => setDraft((d) => ({ ...d, startDate: t }))}
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            placeholder="2025-11-10"
            autoCapitalize="none"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>End Date (optional)</Text>
          <TextInput
            value={draft.endDate}
            onChangeText={(t) => setDraft((d) => ({ ...d, endDate: t }))}
            style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
            placeholder="2025-12-20"
            autoCapitalize="none"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "600" }}>Description (optional)</Text>
          <TextInput
            value={draft.description}
            onChangeText={(t) => setDraft((d) => ({ ...d, description: t }))}
            style={{ borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 90 }}
            placeholder="Write a short description"
            multiline
            textAlignVertical="top"
          />
        </View>

        <Button title={busy ? "Creating…" : "Create Project"} onPress={onCreate} disabled={busy || !canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}