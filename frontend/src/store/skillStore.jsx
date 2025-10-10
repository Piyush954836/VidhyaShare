import { create } from "zustand";
import axios from "axios";

const useSkillStore = create((set) => ({
  skills: [],
  setSkills: (skills) => set({ skills }),
  addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),

  // New: fetch offered skills from backend
  fetchSkills: async () => {
    try {
      const { data } = await axios.get("/user-skills/offered"); // your new endpoint
      set({ skills: data });
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  },
}));

export default useSkillStore;
