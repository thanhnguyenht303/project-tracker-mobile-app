import AsyncStorage from "@react-native-async-storage/async-storage";
import { projectData } from "../data/projectData";
import { Project, ProjectCreateInput, ProjectStatus, ProjectUpdate } from "../types/project";

const STORAGE_KEY = "@projects_v4";
const NETWORK_DELAY_MS = 350;

const SIMULATE_ERROR = false;        
const SIMULATE_INVALID_RESPONSE = false; 

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function assertProjects(value: unknown): asserts value is Project[] {
  if (!Array.isArray(value)) throw new Error("Invalid response: expected array");
  for (const p of value) {
    if (
        !p ||
        typeof p !== "object" ||
        typeof (p as any).id !== "string" ||
        typeof (p as any).name !== "string" ||
        typeof (p as any).clientName !== "string" ||
        !["active", "on_hold", "completed"].includes((p as any).status) ||
        typeof (p as any).startDate !== "string"
    ) {
        throw new Error("Invalid response: malformed project");
    }
  }
}

function isValidDate(v: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

async function readAll(): Promise<Project[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
        return projectData;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (SIMULATE_INVALID_RESPONSE) {
        // @ts-expect-error - deliberate invalid payload to test error handling
        return { hello: "world" };
    }

    assertProjects(parsed);
    return parsed;
}

async function writeAll(projects: Project[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const projectsApi = {
    async getProjects(): Promise<Project[]> {
        await delay(NETWORK_DELAY_MS);
        if (SIMULATE_ERROR) throw new Error("Network error (simulated)");
        return readAll();
    },

    async updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
        await delay(NETWORK_DELAY_MS);
        if (SIMULATE_ERROR) throw new Error("Network error (simulated)");

        const projects = await readAll();
        const idx = projects.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Not found");

        const updated: Project = { ...projects[idx], status };
        const next = [...projects];
        next[idx] = updated;

        await writeAll(next);
        return updated;
    },

    async updateProject(id: string, patch: ProjectUpdate): Promise<Project> {
        await delay(NETWORK_DELAY_MS);
        if (SIMULATE_ERROR) throw new Error("Network error (simulated)");

        const projects = await readAll();
        const idx = projects.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error("Not found");

        const updated: Project = {
            ...projects[idx],
            ...patch,
        };

        if (!updated.name?.trim()) throw new Error("Name is required");
        if (!updated.clientName?.trim()) throw new Error("Client name is required");
        if (!updated.startDate?.trim()) throw new Error("Start date is required");

        const next = [...projects];
        next[idx] = updated;

        await writeAll(next);
        return updated;
    },

    async createProject(input: ProjectCreateInput & {id: string}): Promise<Project> {
        await delay(NETWORK_DELAY_MS);
        if(SIMULATE_ERROR) throw new Error("Network error");

        const name = input.name.trim();
        const clientName = input.clientName.trim();
        const startDate = input.startDate.trim();
        const endDate = (input.endDate ?? "").trim();
        const description = (input.description ?? "").trim();

        if(!name) throw new Error("Name is required!");
        if(!clientName) throw new Error("Client name is required!");
        if(!startDate) throw new Error("Start date is required!");
        if(!isValidDate(startDate)) throw new Error("Start date must be YYYY-MM-DD");
        if(endDate && !isValidDate(endDate)) throw new Error("End date must be YYYY-MM-DD (or empty)");
        if(endDate && endDate < startDate) throw new Error("End date cannot be earlier than start date");

        const projects = await readAll();
        if(projects.some((p) => p.id === input.id)) throw new Error("ID already exists");
        const created: Project = {
            id: input.id,
            name, 
            clientName,
            status: "active",
            startDate,
            endDate: endDate ? endDate : undefined,
            description: description ? description : undefined,
        };

        const next = [created, ...projects];
        await writeAll(next);
        return created;
    }

};
