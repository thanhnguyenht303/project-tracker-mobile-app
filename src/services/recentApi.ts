import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@recent_v1";
const MAX_ITEMS = 6;

export const recentApi = {
    async getRecent(): Promise<string[]> {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    },

    async setRecent(ids: string[]): Promise<void> {
        const trimmed = ids.slice(0, MAX_ITEMS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    },

    async getMAX_ITEMS(): Promise<number> {
        return MAX_ITEMS;
    }
}