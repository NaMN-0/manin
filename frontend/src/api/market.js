import client from "./client";

export const marketApi = {
  getOverview: async () => {
    const { data } = await client.get("/api/market/overview");
    return data;
  },

  getPennyStocks: async (filters = {}) => {
    const { data } = await client.get("/api/penny/list", { params: filters });
    return data;
  },

  // Future: Sensei/Quant integration
  getQuantAnalysis: async (ticker) => {
    // This endpoint will be created in the next phase
    const { data } = await client.get(`/api/market/analyze/${ticker}`);
    return data;
  },

  getSenseiAnalysis: async (ticker) => {
    const { data } = await client.get(
      `/api/sensei/tactical-analysis/${ticker}`,
    );
    return data.data; // The backend wraps the result in a 'data' key
  },

  scanSmartBatch: async (letter, universe, strategy, sector) => {
    const { data } = await client.get("/api/market/smart-scan", {
      params: { letter, universe, strategy, sector },
    });
    return data;
  },
};
