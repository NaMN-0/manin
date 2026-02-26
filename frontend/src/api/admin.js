
import client from "./client";

export const adminApi = {
    getLogs: async (lines = 100) => {
        const { data } = await client.get("/api/admin/logs", { params: { lines } });
        return data;
    },
    getStats: async () => {
        const { data } = await client.get("/api/admin/stats");
        return data;
    }
};
