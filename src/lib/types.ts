
export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard"; // Added Very Hard

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[]; // Original full list of answers
  difficulty: Difficulty;
  points: number;
  imageUrl?: string; // Optional for questions with images
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}

export type AudiencePollResults = Record<string, number>; // e.g. { "Option A": 60, "Option B": 20, ... }

    