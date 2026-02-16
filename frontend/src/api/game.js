import client from "./client";

export const gameApi = {
  getStats: async (userId, token = null) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const { data } = await client.get(`/api/meta/stats/${userId}`, config);
    return data;
  },

  addXp: async (userId, amount, action) => {
    const { data } = await client.post("/api/meta/xp", {
      userId,
      amount,
      action,
    });
    return data;
  },
};
