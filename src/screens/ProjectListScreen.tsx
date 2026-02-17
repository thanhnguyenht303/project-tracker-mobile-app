import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useProjects } from "../store/ProjectsContext";
import { ProjectStatus, STATUS_LABEL } from "../types/project";
import { StatusPill } from "../components/StatusPill";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

type Props = NativeStackScreenProps<RootStackParamList, "Projects">;

const statusFilters: (ProjectStatus | "all")[] = ["all", "active", "on_hold", "completed"];

export function ProjectListScreen({ navigation }: Props) {
    const { projects, loading, error, refreshing, fetchProjects } = useProjects();
    const [status, setStatus] = useState<ProjectStatus | "all">("all");
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return projects.filter((p) => {
        const matchesStatus = status === "all" ? true : p.status === status;
        const matchesQuery =
            query.length === 0
            ? true
            : p.name.toLowerCase().includes(query) || p.clientName.toLowerCase().includes(query);

        return matchesStatus && matchesQuery;
        });
    }, [projects, status, q]);

    if (loading) {
        return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Loading projects…</Text>
        </View>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={() => fetchProjects()} />;
    }

  return (
    <View style={{ flex: 1, padding: 12 }}>
        {/* Search */}
        <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by project or client…"
            autoCapitalize="none"
            style={{ borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
        />

        {/* Filters */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {statusFilters.map((s) => {
            const active = s === status;
            return (
                <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    opacity: active ? 1 : 0.6,
                }}
                >
                <Text style={{ fontSize: 12 }}>{STATUS_LABEL[s]}</Text>
                </Pressable>
            );
            })}
        </View>

        {/* List */}
        <FlatList
            style={{ marginTop: 12 }}
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={() => fetchProjects({ refreshing: true })}
            ListEmptyComponent={
            projects.length === 0 ? (
                <EmptyState title="No projects" subtitle="The project list is empty." />
            ) : (
                <EmptyState title="No results" subtitle="Try adjusting filters or search." />
            )
            }
            renderItem={({ item }) => (
            <Pressable
                onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
                style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                }}
            >
                {/* Long-name safe layout */}
                <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: "600" }}>
                    {item.name}
                </Text>
                <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 4, opacity: 0.8 }}>
                    {item.clientName}
                </Text>
                </View>
                <StatusPill status={item.status} />
            </Pressable>
            )}
        />
    </View>
  );
}
