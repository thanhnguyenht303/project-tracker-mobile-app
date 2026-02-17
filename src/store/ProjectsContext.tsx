import React, { createContext, useContext, useMemo, useReducer } from "react";
import { Alert } from "react-native";
import { projectsApi } from "../services/projectsApi";
import { Project, ProjectStatus, ProjectUpdate } from "../types/project";

type State = {
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  updatingId: string | null;
};

type Ctx = State & {
    fetchProjects: (opts?: { refreshing?: boolean }) => Promise<void>;
    updateStatus: (id: string, status: ProjectStatus) => Promise<void>;
    getById: (id: string) => Project | undefined;
    updateProjectFields: (id: string, patch: ProjectUpdate) => Promise<void>;
};

const ProjectsContext = createContext<Ctx | null>(null);

type Action =
{ type: "FETCH_START"; refreshing: boolean } |
{ type: "FETCH_SUCCESS"; projects: Project[] } |
{ type: "FETCH_ERROR"; error: string } |
{ type: "UPDATE_OPTIMISTIC"; id: string; status: ProjectStatus } |
{ type: "UPDATE_CONFIRMED"; updated: Project } |
{ type: "UPDATE_ROLLBACK"; prev: Project[] } |
{ type: "UPDATE_DONE" } | 
{ type: "MERGE_OPTIMISTIC"; id: string; patch: ProjectUpdate };


const initial: State = {
    projects: [],
    loading: false,
    refreshing: false,
    error: null,
    updatingId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
        return {
            ...state,
            error: null,
            loading: !action.refreshing,
            refreshing: action.refreshing,
        };
    case "FETCH_SUCCESS":
        return { ...state, loading: false, refreshing: false, projects: action.projects };
    case "FETCH_ERROR":
        return { ...state, loading: false, refreshing: false, error: action.error };

    case "UPDATE_OPTIMISTIC":
        return {
            ...state,
            updatingId: action.id,
            projects: state.projects.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
        };
    case "UPDATE_CONFIRMED":
        return {
            ...state,
            projects: state.projects.map((p) => (p.id === action.updated.id ? action.updated : p)),
        };
    case "UPDATE_ROLLBACK":
        return { ...state, updatingId: null, projects: action.prev };
    case "UPDATE_DONE":
        return { ...state, updatingId: null };
    case "MERGE_OPTIMISTIC":
        return {
            ...state,
            updatingId: action.id,
            projects: state.projects.map((p) =>
            p.id === action.id ? { ...p, ...action.patch } : p
            ),
        };
    default:
        return state;
  }
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initial);

    const fetchProjects: Ctx["fetchProjects"] = async (opts) => {
        const refreshing = !!opts?.refreshing;
        dispatch({ type: "FETCH_START", refreshing });
        try {
        const projects = await projectsApi.getProjects();
        dispatch({ type: "FETCH_SUCCESS", projects });
        } catch (e: any) {
        dispatch({ type: "FETCH_ERROR", error: e?.message ?? "Unknown error" });
        }
    };

    const updateStatus: Ctx["updateStatus"] = async (id, status) => {
        const prev = state.projects;
        dispatch({ type: "UPDATE_OPTIMISTIC", id, status });

        try {
        const updated = await projectsApi.updateProjectStatus(id, status);
        dispatch({ type: "UPDATE_CONFIRMED", updated });
        dispatch({ type: "UPDATE_DONE" });
        } catch (e: any) {
        dispatch({ type: "UPDATE_ROLLBACK", prev });
        Alert.alert("Update failed", e?.message ?? "Unknown error");
        }
    };

    const getById: Ctx["getById"] = (id) => state.projects.find((p) => p.id === id);

    const updateProjectFields: Ctx["updateProjectFields"] = async (id, patch) => {
        const prev = state.projects;
        dispatch({ type: "MERGE_OPTIMISTIC", id, patch });

        try {
            const updated = await projectsApi.updateProject(id, patch);
            dispatch({ type: "UPDATE_CONFIRMED", updated });
            dispatch({ type: "UPDATE_DONE" });
        } catch (e: any) {
            dispatch({ type: "UPDATE_ROLLBACK", prev });
            Alert.alert("Save failed", e?.message ?? "Unknown error");
        }
        };


    const value: Ctx = useMemo(
        () => ({ ...state, fetchProjects, updateStatus, getById, updateProjectFields }),
        [state]
    );

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
    return ctx;
}
