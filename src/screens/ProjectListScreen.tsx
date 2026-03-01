import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useProjects } from "../store/ProjectsContext";
import { ProjectStatus, STATUS_LABEL } from "../types/project";
import { StatusPill } from "../components/StatusPill";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

type Props = NativeStackScreenProps<RootStackParamList, "Projects">;

function hasActiveFilters(status: ProjectStatus | "all", q: string) {
  return status !== "all" || q.trim().length > 0;
}

const statusFilters: (ProjectStatus | "all")[] = ["all", "active", "on_hold", "completed"];

type SortOption =
  | "start_desc"
  | "start_asc"
  | "name_az"
  | "name_za"
  | "status_priority";

const SORT_LABEL: Record<SortOption, string> = {
  start_desc: "Start date (newest)",
  start_asc: "Start date (oldest)",
  name_az: "Name (A–Z)",
  name_za: "Name (Z–A)",
  status_priority: "Status (Active first)",
};

const statusRank: Record<ProjectStatus, number> = {
  active: 0,
  on_hold: 1,
  completed: 2,
};

export function ProjectListScreen({ navigation }: Props) {
  const { projects, loading, error, refreshing, fetchProjects, favorites, toggleFavorite, recent } = useProjects();
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortOption>("start_desc");
  const [sortOpen, setSortOpen] = useState(false);

  const clearFilters = () => {
    setStatus("all");
    setQ("");
    setSort("start_desc");
    setSortOpen(false);
  };

  const recentProjects = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p]));
    return recent.map((id) => map.get(id)).filter(Boolean);
  }, [projects, recent]);

  const showClear = useMemo(() => {
    return hasActiveFilters(status, q) || sort !== "start_desc";
  }, [status, q, sort]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("CreateProject")}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700" }}>+</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();

    const filtered = projects.filter((p) => {
      const matchesStatus = status === "all" ? true : p.status === status;
      const matchesQuery =
        query.length === 0
          ? true
          : p.name.toLowerCase().includes(query) ||
            p.clientName.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      if(aFav !== bFav) return aFav - bFav;

      if (sort === "start_desc") return b.startDate.localeCompare(a.startDate);
      if (sort === "start_asc") return a.startDate.localeCompare(b.startDate);

      if (sort === "name_az") return a.name.localeCompare(b.name);
      if (sort === "name_za") return b.name.localeCompare(a.name);

      const r = statusRank[a.status] - statusRank[b.status];
      if (r !== 0) return r;
      return b.startDate.localeCompare(a.startDate);
    });

    return sorted;
  }, [projects, status, q, sort, favorites]);

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
        <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by project or client…"
            autoCapitalize="none"
            style={{
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", flex: 1 }}>
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

            <Pressable
            onPress={() => setSortOpen(true)}
            style={{
                marginLeft: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
            }}
            >
            <Text style={{ fontSize: 12 }}>Sort</Text>
            </Pressable>
        </View>

        <Text style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
            Sort: {SORT_LABEL[sort]}
        </Text>

        <View
            style={{
            marginTop: 8,
            padding: 10,
            borderWidth: 1,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            }}
        >
            <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, opacity: 0.75 }}>
                Status: {STATUS_LABEL[status]} • Sort: {SORT_LABEL[sort]}
            </Text>
            <Text style={{ fontSize: 12, opacity: 0.75 }}>
                Search: {q.trim().length > 0 ? `"${q.trim()}"` : "—"}
            </Text>
            <Text style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Results: {visible.length}
            </Text>
            </View>

            {showClear ? (
            <Pressable
                onPress={clearFilters}
                style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                }}
            >
                <Text style={{ fontSize: 12, fontWeight: "600" }}>Clear</Text>
            </Pressable>
            ) : null}
        </View>

        <FlatList
            style={{ marginTop: 12 }}
            data={visible}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={() => fetchProjects({ refreshing: true })}
            ListHeaderComponent={
              recentProjects.length > 0 ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: "700", marginBottom: 8 }}>Recently viewed</Text>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {recentProjects.map((p: any) => (
                      <Pressable
                        key={p.id}
                        onPress={() => navigation.navigate("ProjectDetail", { projectId: p.id })}
                        style={{
                          borderWidth: 1,
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                        }}
                      >
                        <Text numberOfLines={1} style={{ maxWidth: 220, fontSize: 12 }}>
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
            projects.length === 0 ? (
                <EmptyState title="No projects" subtitle="The project list is empty." />
            ) : (
                <EmptyState title="No results" subtitle="Try adjusting filters or search." />
            )
            }
            renderItem={({ item }) => (
              <View
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
                <Pressable  
                  onPress={() => navigation.navigate("ProjectDetail", { projectId: item.id })}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: "600" }}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={{ marginTop: 4, opacity: 0.8 }}>
                    {item.clientName}
                  </Text>
                </Pressable>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pressable
                    onPress={() => toggleFavorite(item.id)}
                    style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {favorites.includes(item.id) ? "★" : "☆"}
                    </Text>
                  </Pressable>

                  <StatusPill status={item.status} />
                </View>
              </View>
          )}
        />

        <Modal
            visible={sortOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSortOpen(false)}
        >
            <Pressable
            onPress={() => setSortOpen(false)}
            style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                padding: 16,
                justifyContent: "center",
            }}
            >
            <Pressable
                onPress={() => {}}
                style={{ backgroundColor: "white", borderRadius: 12, borderWidth: 1, padding: 12 }}
            >
                <Text style={{ fontWeight: "700", marginBottom: 8 }}>Sort by</Text>

                {(Object.keys(SORT_LABEL) as SortOption[]).map((opt) => {
                const active = opt === sort;
                return (
                    <Pressable
                    key={opt}
                    onPress={() => {
                        setSort(opt);
                        setSortOpen(false);
                    }}
                    style={{
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        borderWidth: 1,
                        marginBottom: 8,
                        opacity: active ? 1 : 0.75,
                    }}
                    >
                    <Text style={{ fontWeight: active ? "700" : "400" }}>
                        {SORT_LABEL[opt]}
                    </Text>
                    </Pressable>
                );
                })}
            </Pressable>
            </Pressable>
        </Modal>
    </View>
  );
}