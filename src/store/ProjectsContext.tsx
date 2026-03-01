import React, { act, createContext, useContext, useMemo, useReducer } from "react";
import { Alert } from "react-native";
import { projectsApi } from "../services/projectsApi";
import { Project, ProjectCreateInput, ProjectStatus, ProjectUpdate } from "../types/project";
import { favoriteApi } from "../services/favouriteApi";
import { recentApi } from "../services/recentApi";

type State = {
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  updatingId: string | null;
  favorites: string[];
  recent: string[];
};

type Ctx = State & {
    fetchProjects: (opts?: { refreshing?: boolean }) => Promise<void>;
    updateStatus: (id: string, status: ProjectStatus) => Promise<void>;
    getById: (id: string) => Project | undefined;
    updateProjectFields: (id: string, patch: ProjectUpdate) => Promise<void>;
    createProject: (input: ProjectCreateInput) => Promise<Project>;
    loadFavorites: () => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    isFavorite: (id: string) => boolean;
    loadRecent: () => Promise<void>;
    addRecent: (id: string) => Promise<void>;
};

type Action =
{ type: "FETCH_START"; refreshing: boolean } |
{ type: "FETCH_SUCCESS"; projects: Project[] } |
{ type: "FETCH_ERROR"; error: string } |
{ type: "UPDATE_OPTIMISTIC"; id: string; status: ProjectStatus } |
{ type: "UPDATE_CONFIRMED"; updated: Project } |
{ type: "UPDATE_ROLLBACK"; prev: Project[] } |
{ type: "UPDATE_DONE" } | 
{ type: "MERGE_OPTIMISTIC"; id: string; patch: ProjectUpdate } |
{ type: "CREATE_OPTIMISTIC"; project: Project} |
{ type: "FAVORITES_SET"; favorites: string[]} |
{ type: "RECENT_SET"; recent: string[]};

const ProjectsContext = createContext<Ctx | null>(null);


const initial: State = {
    projects: [],
    loading: false,
    refreshing: false,
    error: null,
    updatingId: null,
    favorites: [],
    recent: [],
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
    case "CREATE_OPTIMISTIC":
        return {
            ...state,
            updatingId: action.project.id,
            projects: [action.project, ...state.projects],
        };
    case "FAVORITES_SET":
        return {...state, favorites: action.favorites};
    case "RECENT_SET": 
        return {...state, recent: action.recent};
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
    
    const createProject: Ctx["createProject"] = async (input) => {
        const prev = state.projects;

        const id = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);

        const optimistic: Project = {
            id,
            name: input.name,
            clientName: input.clientName,
            status: "active",
            startDate: input.startDate,
            endDate: input.endDate,
            description: input.description,
        };

        dispatch({ type: "CREATE_OPTIMISTIC", project: optimistic});

        try {
            const created = await projectsApi.createProject({...input, id});
            dispatch({type: "UPDATE_CONFIRMED", updated: created});
            dispatch({type: "UPDATE_DONE"});
            return created;
        } catch (e: any) {
            dispatch({type: "UPDATE_ROLLBACK", prev});
            Alert.alert("Created failed", e?.message ?? "Unknown error");
            throw e;
        }

    }

    const loadFavorites: Ctx["loadFavorites"] = async () => {
        try {
            const favs = await favoriteApi.getFavorites();
            dispatch({ type: "FAVORITES_SET", favorites: favs});
        } catch {
            dispatch({ type: "FAVORITES_SET", favorites: []});
        }
    };

    const isFavorite: Ctx["isFavorite"] = (id) => state.favorites.includes(id);

    const toggleFavorite: Ctx["toggleFavorite"] = async (id) => {
        const prev = state.favorites;
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];

        dispatch({ type: "FAVORITES_SET", favorites: next});

        try {
            await favoriteApi.setFavorites(next);
        } catch(e: any) {
            dispatch({ type: "FAVORITES_SET", favorites: prev})
            Alert.alert("Favorite failed", e?.message ?? "Unknown error");
        }
    };

    const loadRecent: Ctx["loadRecent"] = async () => {
        try {
            const ids = await recentApi.getRecent();
            dispatch({ type: "RECENT_SET", recent: ids});
        } catch {
            dispatch({ type: "RECENT_SET", recent: []});
        }
    };

    const addRecent: Ctx["addRecent"] = async (id) => {
        const prev = state.recent;
        const maxItems = await recentApi.getMAX_ITEMS()
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, maxItems);

        dispatch({ type: "RECENT_SET", recent: next});

        try {
            await recentApi.setRecent(next);
        } catch {
            dispatch({ type: "RECENT_SET", recent: prev});
        }
    }


    const value: Ctx = useMemo(
        () => ({ ...state, fetchProjects, updateStatus, getById, updateProjectFields, createProject, loadFavorites, isFavorite, toggleFavorite, loadRecent, addRecent }),
        [state]
    );

    return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
    return ctx;
}
