export type Difficulty = "Easy" | "Medium" | "Hard" | "Research";

export interface ProblemData {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  problem: string;
  solution: string;
  createdAt: number;
}

export interface UserPreferences {
  defaultDifficulty: Difficulty;
  darkMode: boolean;
  apiKey?: string;
}
