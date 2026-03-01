import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@favorites_v1";

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export const favoriteApi = {
    async getFavorites(): Promise<string[]> {
        await delay(120);
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    },

    async setFavorites(ids: string[]): Promise<void> {
        await delay(120);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    },
};