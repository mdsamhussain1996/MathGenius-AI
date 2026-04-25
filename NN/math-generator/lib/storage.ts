import { ProblemData, UserPreferences } from "./types";

const STORAGE_KEY = "math_gen_history";
const PREFS_KEY = "math_gen_prefs";

export function saveProblem(problem: ProblemData) {
  if (typeof window === "undefined") return;
  const existing = getHistory();
  // Keep only the last 50 problems to avoid local storage limits
  const updated = [problem, ...existing].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getHistory(): ProblemData[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function savePreferences(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return { defaultDifficulty: "Medium", darkMode: false, apiKey: "" };
  try {
    const data = localStorage.getItem(PREFS_KEY);
    return data ? JSON.parse(data) : { defaultDifficulty: "Medium", darkMode: false, apiKey: "" };
  } catch (e) {
    return { defaultDifficulty: "Medium", darkMode: false, apiKey: "" };
  }
}
