import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // ou seu backend

export const VisitanteRepository = {
  getPortfolio: async (username: string) => {
    try {
      const res = await axios.get(`${API_URL}/visitante/${username}`);
      return res.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};
