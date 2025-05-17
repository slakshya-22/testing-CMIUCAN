
'use server';
/**
 * @fileOverview A Genkit flow to generate a set of trivia questions for the game.
 *
 * - generateTriviaQuestions - A function that generates a specified number of trivia questions.
 * - GenerateTriviaQuestionsInput - The input type for the generateTriviaQuestions function.
 * - GenerateTriviaQuestionsOutput - The return type for the generateTriviaQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { QuestionSchema } from '@/lib/types'; // Reusing the Question schema

const GenerateTriviaQuestionsInputSchema = z.object({
  numberOfQuestions: z.number().int().positive().describe('The number of trivia questions to generate.'),
  // We might add difficulty distribution hints here later if needed
});
export type GenerateTriviaQuestionsInput = z.infer<typeof GenerateTriviaQuestionsInputSchema>;

// The output will be an array of Question objects, conforming to QuestionSchema
const GenerateTriviaQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('An array of generated trivia questions.'),
});
export type GenerateTriviaQuestionsOutput = z.infer<typeof GenerateTriviaQuestionsOutputSchema>;

export async function generateTriviaQuestions(input: GenerateTriviaQuestionsInput): Promise<GenerateTriviaQuestionsOutput> {
  return generateTriviaQuestionsFlow(input);
}

const triviaQuestionsPrompt = ai.definePrompt({
  name: 'generateTriviaQuestionsPrompt',
  input: {schema: GenerateTriviaQuestionsInputSchema},
  output: {schema: GenerateTriviaQuestionsOutputSchema},
  prompt: `You are a trivia question generator for a game show like "Kaun Banega Crorepati" (KBC).
  Generate {{{numberOfQuestions}}} unique trivia questions.
  For each question, provide:
  1. A unique 'id' (e.g., "q1", "q2", ... or a random string).
  2. The 'text' of the question.
  3. An array 'answers' containing exactly four objects, each with:
     - 'text': The answer option.
     - 'isCorrect': A boolean (true for the correct answer, false otherwise). Only one answer should be correct.
  4. A 'difficulty' level chosen from: "Easy", "Medium", "Hard", "Very Hard".
     Try to make the questions progressively more difficult if possible, or ensure a good mix covering these difficulties.

  Ensure the questions cover a variety of general knowledge topics (history, geography, science, arts, sports, current events, etc.).
  The questions should be engaging and suitable for a general audience.
  Avoid questions that are too niche, ambiguous, or require external knowledge beyond common understanding.
  The 'points' for each question will be assigned by the game logic later, so you don't need to include them in the output.
  `,
  // Example for the AI for one question (though Zod schema description is the primary guide):
  // {
  //   "id": "q1_gen",
  //   "text": "What is the capital of France?",
  //   "answers": [
  //     { "text": "Berlin", "isCorrect": false },
  //     { "text": "Madrid", "isCorrect": false },
  //     { "text": "Paris", "isCorrect": true },
  //     { "text": "Rome", "isCorrect": false }
  //   ],
  //   "difficulty": "Easy"
  // }
});

const generateTriviaQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTriviaQuestionsFlow',
    inputSchema: GenerateTriviaQuestionsInputSchema,
    outputSchema: GenerateTriviaQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await triviaQuestionsPrompt(input);
    if (!output || !output.questions || output.questions.length !== input.numberOfQuestions) {
      throw new Error('AI failed to generate the correct number of questions or in the correct format.');
    }
    // Basic validation for each question structure (Genkit handles Zod schema validation for output)
    output.questions.forEach((q, index) => {
      if (!q.id || !q.text || q.answers.length !== 4 || !q.difficulty) {
        throw new Error(`Generated question at index ${index} is malformed.`);
      }
      const correctAnswers = q.answers.filter(a => a.isCorrect).length;
      if (correctAnswers !== 1) {
        throw new Error(`Generated question "${q.text}" must have exactly one correct answer, found ${correctAnswers}.`);
      }
    });
    return output;
  }
);
