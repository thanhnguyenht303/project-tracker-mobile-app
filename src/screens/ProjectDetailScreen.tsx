import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform, } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useProjects } from "../store/ProjectsContext";
import { StatusPill } from "../components/StatusPill";
import { ErrorState } from "../components/ErrorState";
import { ProjectStatus, STATUS_LABEL, ProjectUpdate } from "../types/project";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

const statuses: ProjectStatus[] = ["active", "on_hold", "completed"];

function isValidDateYYYYMMDD(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function ProjectDetailScreen({ route, navigation }: Props) {
    const { projectId } = route.params;

    const { getById, updateStatus, updateProjectFields, updatingId, fetchProjects } = useProjects();
    const project = getById(projectId);

    const busy = updatingId === projectId;

    useEffect(() => {
        if (!project) fetchProjects();
    }, [projectId]);

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({
        name: "",
        clientName: "",
        startDate: "",
        endDate: "",
        description: "",
    });

    useEffect(() => {
        if (!project) return;
        if (!isEditing) {
        setDraft({
            name: project.name ?? "",
            clientName: project.clientName ?? "",
            startDate: project.startDate ?? "",
            endDate: project.endDate ?? "",
            description: project.description ?? "",
        });
        }
    }, [project?.id, project?.name, project?.clientName, project?.startDate, project?.endDate, project?.description, isEditing]);

    const onPressHeaderButton = async () => {
        if (!project) return;

        if (!isEditing) {
        setIsEditing(true);
        return;
        }

        const name = draft.name.trim();
        const clientName = draft.clientName.trim();
        const startDate = draft.startDate.trim();
        const endDateRaw = draft.endDate.trim();
        const descriptionRaw = draft.description.trim();

        if (!name) return Alert.alert("Validation", "Name is required.");
        if (!clientName) return Alert.alert("Validation", "Client name is required.");
        if (!startDate) return Alert.alert("Validation", "Start date is required.");
        if (!isValidDateYYYYMMDD(startDate)) {
            return Alert.alert("Validation", "Start date must be YYYY-MM-DD.");
        }

        if (endDateRaw && !isValidDateYYYYMMDD(endDateRaw)) {
            return Alert.alert("Validation", "End date must be YYYY-MM-DD (or empty).");
        }

        if (endDateRaw && endDateRaw < startDate) {
            return Alert.alert("Validation", "End date cannot be earlier than start date.");
        }

        const patch: ProjectUpdate = {
            name,
            clientName,
            startDate,
            endDate: endDateRaw ? endDateRaw : undefined,
            description: descriptionRaw ? descriptionRaw : undefined,
        };

        await updateProjectFields(project.id, patch);
        setIsEditing(false);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
        headerRight: () => (
            <Pressable
            onPress={onPressHeaderButton}
            disabled={busy}
            style={{ opacity: busy ? 0.5 : 1, paddingHorizontal: 10, paddingVertical: 6 }}
            >
                <Text style={{ fontWeight: "600" }}>{isEditing ? "Save" : "Edit"}</Text>
            </Pressable>
        ),
        });
    }, [navigation, isEditing, busy, draft]);

    if (!project) {
        return <ErrorState message="Project not found or failed to load." onRetry={() => fetchProjects()} />;
    }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Name */}
            {isEditing ? (
            <View style={{ gap: 6 }}>
                <Text style={{ fontWeight: "600" }}>Project Name</Text>
                <TextInput
                    value={draft.name}
                    onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
                    style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
                    placeholder="Enter project name"
                />
            </View>
            ) : (
            <Text style={{ fontSize: 18, fontWeight: "700" }}>{project.name}</Text>
            )}

            {/* Client */}
            {isEditing ? (
                <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "600" }}>Client Name</Text>
                    <TextInput
                        value={draft.clientName}
                        onChangeText={(t) => setDraft((d) => ({ ...d, clientName: t }))}
                        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
                        placeholder="Enter client name"
                    />
                </View>
                ) : (
                <Text style={{ opacity: 0.8 }}>Client: {project.clientName}</Text>
            )}

            {/* Status (not editable) */}
            <View style={{ alignSelf: "flex-start" }}>
                <StatusPill status={project.status} />
            </View>

            {/* Dates */}
            {isEditing ? (
            <>
                <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "600" }}>Start Date (YYYY-MM-DD)</Text>
                    <TextInput
                        value={draft.startDate}
                        onChangeText={(t) => setDraft((d) => ({ ...d, startDate: t }))}
                        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
                        autoCapitalize="none"
                    />
                    </View>

                    <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "600" }}>End Date (YYYY-MM-DD, optional)</Text>
                    <TextInput
                        value={draft.endDate}
                        onChangeText={(t) => setDraft((d) => ({ ...d, endDate: t }))}
                        style={{ borderWidth: 1, borderRadius: 10, padding: 10 }}
                        autoCapitalize="none"
                    />
                </View>
            </>
            ) : (
            <>
                <Text>Start date: {project.startDate}</Text>
                <Text>End date: {project.endDate ?? "—"}</Text>
            </>
            )}

            {/* Description */}
            {isEditing ? (
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
            ) : (
                !!project.description && <Text style={{ lineHeight: 20 }}>{project.description}</Text>
            )}

            {/* Status update buttons (still available, but disable during edit to avoid conflicts) */}
            <View style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                    Update status
                </Text>

                {statuses.map((s) => (
                    <View key={s} style={{ marginBottom: 8 }}>
                        <Button
                            title={busy ? "Updating…" : `Set to ${STATUS_LABEL[s]}`}
                            onPress={() => updateStatus(project.id, s)}
                            disabled={busy || isEditing || project.status === s}
                        />
                    </View>
                ))}
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
