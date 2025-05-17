
import { z } from 'zod';

export const DifficultyEnum = z.enum(["Easy", "Medium", "Hard", "Very Hard"]);
export type Difficulty = z.infer<typeof DifficultyEnum>;

export const AnswerSchema = z.object({
  text: z.string().describe("The text of the answer option."),
  isCorrect: z.boolean().describe("Whether this answer option is correct."),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const QuestionSchema = z.object({
  id: z.string().describe("A unique identifier for the question (e.g., generated UUID or sequential)."),
  text: z.string().describe("The text of the trivia question."),
  answers: z.array(AnswerSchema).length(4).describe("An array of exactly four answer options."),
  difficulty: DifficultyEnum.describe("The difficulty level of the question."),
  points: z.number().optional().describe("Points awarded for this question (will be assigned by the game logic)."), // Points will be assigned later by game logic
  imageUrl: z.string().optional().describe("An optional URL for an image related to the question."),
});
export type Question = z.infer<typeof QuestionSchema>;

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}

export type AudiencePollResults = Record<string, number>; // e.g. { "Option A": 60, "Option B": 20, ... }
