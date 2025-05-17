
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
import { QuestionSchema } from '@/lib/types'; 

const GenerateTriviaQuestionsInputSchema = z.object({
  numberOfQuestions: z.number().int().positive().describe('The number of trivia questions to generate.'),
  difficulty: z.string().optional().describe('Optional: The desired difficulty for all questions (e.g., "Easy", "Medium", "Hard"). If "Mixed" or not provided, a range of difficulties will be generated.'),
  category: z.string().optional().describe('Optional: The desired category for all questions (e.g., "Sports", "History"). If "General Knowledge" or not provided, questions will cover various topics.'),
});
export type GenerateTriviaQuestionsInput = z.infer<typeof GenerateTriviaQuestionsInputSchema>;

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
  prompt: `You are a trivia question generator for a game show.
  Generate {{{numberOfQuestions}}} unique trivia questions.

  {{#if category}}
  All questions should ideally be from the '{{category}}' category.
  {{else}}
  Ensure the questions cover a variety of general knowledge topics (e.g. history, geography, science, arts, sports, current events, etc.).
  {{/if}}

  {{#if difficulty}}
    {{#if (eq difficulty "Mixed")}}
    Ensure a good mix covering "Easy", "Medium", "Hard", and "Very Hard" difficulties. Try to make the questions progressively more difficult if possible.
    {{else}}
    All questions should ideally be of '{{difficulty}}' difficulty.
    {{/if}}
  {{else}}
  Ensure a good mix covering "Easy", "Medium", "Hard", and "Very Hard" difficulties. Try to make the questions progressively more difficult if possible.
  {{/if}}

  For each question, provide:
  1. A unique 'id' (e.g., "q1", "q2", ... or a random string).
  2. The 'text' of the question.
  3. An array 'answers' containing exactly four objects, each with:
     - 'text': The answer option.
     - 'isCorrect': A boolean (true for the correct answer, false otherwise). Only one answer should be correct.
  4. A 'difficulty' level chosen from: "Easy", "Medium", "Hard", "Very Hard". This should match the overall difficulty hint if one was provided.

  Ensure the questions are engaging and suitable for a general audience.
  Avoid questions that are too niche, ambiguous, or require external knowledge beyond common understanding.
  The 'points' for each question will be assigned by the game logic later, so you don't need to include them in the output.
  `,
});

const generateTriviaQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTriviaQuestionsFlow',
    inputSchema: GenerateTriviaQuestionsInputSchema,
    outputSchema: GenerateTriviaQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await triviaQuestionsPrompt(input);
    if (!output || !output.questions || output.questions.length === 0) { // Check if any questions were generated
      console.error('AI failed to generate questions or in the correct format. Input:', input, 'Output:', output);
      throw new Error('AI failed to generate questions or returned an empty list.');
    }
     if (output.questions.length < input.numberOfQuestions) {
      console.warn(`AI generated fewer questions (${output.questions.length}) than requested (${input.numberOfQuestions}). Input:`, input);
      // Proceeding with fewer questions, game logic should handle this.
    }
    
    output.questions.forEach((q, index) => {
      if (!q.id || typeof q.id !== 'string' || q.id.trim() === "") {
         console.warn(`Generated question at index ${index} has a missing or invalid ID. Assigning a default. Original ID: ${q.id}`);
         q.id = `gen_q_fallback_${index}_${Date.now()}`;
      }
      if (!q.text || typeof q.text !== 'string' || q.text.trim() === "") {
        throw new Error(`Generated question at index ${index} has missing or empty text.`);
      }
      if (!q.answers || !Array.isArray(q.answers) || q.answers.length !== 4) {
        throw new Error(`Generated question "${q.text}" (ID: ${q.id}) must have exactly four answers, found ${q.answers?.length || 0}.`);
      }
      const correctAnswers = q.answers.filter(a => a.isCorrect === true).length;
      if (correctAnswers !== 1) {
        throw new Error(`Generated question "${q.text}" (ID: ${q.id}) must have exactly one correct answer, found ${correctAnswers}.`);
      }
      if (!q.difficulty || !["Easy", "Medium", "Hard", "Very Hard"].includes(q.difficulty)) {
         console.warn(`Generated question "${q.text}" (ID: ${q.id}) has an invalid or missing difficulty "${q.difficulty}". Defaulting to "Medium".`);
         q.difficulty = "Medium"; // Default if not provided or invalid
      }
    });
    return output;
  }
);
