export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
  difficulty: Difficulty;
  points: number;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}
