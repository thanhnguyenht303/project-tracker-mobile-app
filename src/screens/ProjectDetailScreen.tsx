import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useProjects } from "../store/ProjectsContext";
import { StatusPill } from "../components/StatusPill";
import { ErrorState } from "../components/ErrorState";
import { ProjectStatus, STATUS_LABEL, ProjectUpdate } from "../types/project";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

const statuses: ProjectStatus[] = ["active", "on_hold", "completed"];

function isValidDateYYYYMMDD(v: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function same(a?: string, b?: string) {
    return (a ?? "").trim() === (b ?? "").trim();
}

export function ProjectDetailScreen({ route, navigation }: Props) {
    const { projectId } = route.params;

    const { getById, updateStatus, updateProjectFields, updatingId, fetchProjects, addRecent } = useProjects();
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

    const hasChanges = useMemo(() => {
        if (!project) return false;

        return !(
        same(draft.name, project.name) &&
        same(draft.clientName, project.clientName) &&
        same(draft.startDate, project.startDate) &&
        same(draft.endDate, project.endDate) &&
        same(draft.description, project.description)
        );
    }, [draft, project]);

    const resetDraftFromProject = () => {
        if (!project) return;
        setDraft({
        name: project.name ?? "",
        clientName: project.clientName ?? "",
        startDate: project.startDate ?? "",
        endDate: project.endDate ?? "",
        description: project.description ?? "",
        });
    };

    // Keep draft synced when leaving edit mode
    useEffect(() => {
        if (!project) return;
        if (!isEditing) resetDraftFromProject();
    }, [project?.id, project?.name, project?.clientName, project?.startDate, project?.endDate, project?.description, isEditing]);

    const onPressCancelEdit = () => {
        if (!isEditing || !hasChanges) return;

        Alert.alert(
            "Discard changes?",
            "You have unsaved changes. Are you sure you want to discard them?",
            [
                { text: "Cancel", style: "cancel" }, // stay in edit mode
                {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => {
                        resetDraftFromProject();
                        setIsEditing(false); // back to view mode
                    },
                },
            ]
        );
    };

    const onPressHeaderButton = async () => {
        if (!project) return;

        // Enter edit mode
        if (!isEditing) {
            resetDraftFromProject();
            setIsEditing(true);
            return;
        }

        // Save
        if (!hasChanges) return; // Save button is disabled anyway, but safe

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

    // Disable BACK only when editing + hasChanges
    useLayoutEffect(() => {
        navigation.setOptions({
        gestureEnabled: !(isEditing && hasChanges),                 // disable swipe-back when unsaved changes
        headerLeft: isEditing && hasChanges ? () => null : undefined, // hide back arrow only when unsaved changes exist

        headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isEditing ? (
                <>
                <Pressable
                    onPress={onPressCancelEdit}
                    disabled={!hasChanges || busy}
                    style={{
                        opacity: !hasChanges || busy ? 0.5 : 1,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        marginRight: 8,
                    }}
                >
                    <Text style={{ fontWeight: "600" }}>Cancel</Text>
                </Pressable>

                <Pressable
                    onPress={onPressHeaderButton}
                    disabled={busy || !hasChanges}
                    style={{
                        opacity: busy || !hasChanges ? 0.5 : 1,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Text style={{ fontWeight: "600" }}>Save</Text>
                </Pressable>
                </>
            ) : (
                <Pressable
                    onPress={onPressHeaderButton}
                    disabled={busy}
                    style={{
                        opacity: busy ? 0.5 : 1,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Text style={{ fontWeight: "600" }}>Edit</Text>
                </Pressable>
            )}
            </View>
        ),
        });
    }, [navigation, isEditing, hasChanges, busy, draft]);

    // Block Android hardware back ONLY when editing + hasChanges
    useFocusEffect(
        React.useCallback(() => {
        const onHardwareBack = () => {
            if (isEditing && hasChanges) return true; // block
            return false; // allow default
        };

        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
        }, [isEditing, hasChanges])
    );

    useFocusEffect(
        React.useCallback(() => {
            addRecent(projectId)
        }, [projectId])
    );

    if (!project) {
        return <ErrorState message="Project not found or failed to load." onRetry={() => fetchProjects()} />;
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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

            {/* Status update buttons */}
            <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>Update status</Text>

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