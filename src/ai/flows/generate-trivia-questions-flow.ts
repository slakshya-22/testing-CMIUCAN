
'use server';
/**
 * @fileOverview A Genkit flow to generate a set of trivia questions for the game.
 *
 * - generateTriviaQuestions - A function that generates a specified number of trivia questions.
 * - GenerateTriviaQuestionsInput - The input type for the generateTriviaQuestions function.
 * - GenerateTriviaQuestionsOutput - The return type for the generateTriviaQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z, ZodError} from 'genkit';
import { QuestionSchema } from '@/lib/types'; 

const GenerateTriviaQuestionsInputSchema = z.object({
  numberOfQuestions: z.number().int().positive().describe('The number of trivia questions to generate.'),
  difficulty: z.string().optional().describe('Optional: The desired difficulty for all questions (e.g., "Easy", "Medium", "Hard"). If "Mixed" or not provided, a range of difficulties will be generated.'),
  category: z.string().optional().describe('Optional: The desired category for all questions (e.g., "Sports", "History"). If "General Knowledge" or not provided, questions will cover various topics.'),
  sessionId: z.string().optional().describe('An optional unique identifier for the game session to help ensure question variety across multiple plays.'),
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
  output: {schema: GenerateTriviaQuestionsOutputSchema}, // Genkit will attempt to parse AI output to this schema
  prompt: `You are a trivia question generator for a game show.
  Generate {{{numberOfQuestions}}} unique trivia questions.

  It is CRITICAL that for each request (even with similar category or difficulty requests), you generate a FRESH and DISTINCT set of questions. Avoid repeating questions that might have been generated in previous requests. The game is played multiple times, so variety is key.

  {{#if category}}
  All questions should ideally be from the '{{category}}' category.
  {{else}}
  Ensure the questions cover a variety of general knowledge topics (e.g. history, geography, science, arts, sports, current events, etc.).
  {{/if}}

  {{#if difficulty}}
  All questions should ideally be of '{{difficulty}}' difficulty.
  {{else}}
  Ensure a good mix covering "Easy", "Medium", "Hard", and "Very Hard" difficulties. Try to make the questions progressively more difficult if possible.
  {{/if}}

  For each question, provide:
  1. A unique 'id' (e.g., "q1", "q2", ... or a random string that is unique within this set of questions).
  2. The 'text' of the question.
  3. An array 'answers' containing exactly four objects, each with:
     - 'text': The answer option.
     - 'isCorrect': A boolean (true for the correct answer, false otherwise). Only one answer should be correct.
  4. A 'difficulty' level chosen from: "Easy", "Medium", "Hard", "Very Hard". This should match the overall difficulty hint if one was provided.

  Ensure the questions are engaging and suitable for a general audience.
  Avoid questions that are too niche, ambiguous, or require external knowledge beyond common understanding.
  The 'points' for each question will be assigned by the game logic later, so you don't need to include them in the output.
  Session ID for this request (for your internal reference if needed, not for output): {{{sessionId}}}
  `,
});

const generateTriviaQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTriviaQuestionsFlow',
    inputSchema: GenerateTriviaQuestionsInputSchema,
    outputSchema: GenerateTriviaQuestionsOutputSchema,
  },
  async (input) => {
    let rawAiOutputFromPrompt; // Variable to store raw output for logging
    try {
      const result = await triviaQuestionsPrompt(input);
      rawAiOutputFromPrompt = result.output; // This is the Zod-parsed output from Genkit

      if (!rawAiOutputFromPrompt) {
        console.error('[generateTriviaQuestionsFlow] AI prompt execution failed to produce a structured output. Input:', input);
        throw new Error('AI prompt execution failed to produce a structured output.');
      }
      
      // Defensive check: ensure questions is an array, even though Zod schema should guarantee it if parsing succeeded.
      if (!Array.isArray(rawAiOutputFromPrompt.questions)) {
        console.error('[generateTriviaQuestionsFlow] AI output for questions is not an array. Input:', input, 'Raw Output:', rawAiOutputFromPrompt);
        throw new Error('AI returned malformed data for questions (expected an array).');
      }

      if (rawAiOutputFromPrompt.questions.length === 0 && input.numberOfQuestions > 0) {
        console.warn('[generateTriviaQuestionsFlow] AI returned an empty list of questions despite being asked for some. Input:', input, 'Raw Output:', rawAiOutputFromPrompt);
        throw new Error('AI returned an empty list of questions.');
      }
      
      const validatedQuestions = rawAiOutputFromPrompt.questions.map((q, index) => {
        // Since Genkit parsed against QuestionSchema, q should largely conform.
        // We perform additional logical validation or assign fallbacks.
        let questionId = q.id;
        if (!questionId || typeof questionId !== 'string' || questionId.trim() === "") {
           console.warn(`[generateTriviaQuestionsFlow] Generated question at index ${index} has a missing or invalid ID. Assigning a fallback. Original ID: ${q.id}`);
           questionId = `gen_q_fallback_${index}_${Date.now()}`;
        }

        if (!q.text || typeof q.text !== 'string' || q.text.trim() === "") {
          console.error(`[generateTriviaQuestionsFlow] Generated question (ID: ${questionId}) at index ${index} has missing or empty text.`);
          // This should ideally be caught by Zod, but as a safeguard:
          throw new Error(`Generated question (ID: ${questionId}) has missing or empty text.`);
        }

        if (!q.answers || !Array.isArray(q.answers) || q.answers.length !== 4) {
          console.error(`[generateTriviaQuestionsFlow] Generated question "${q.text}" (ID: ${questionId}) must have exactly four answers, found ${q.answers?.length || 0}.`);
          throw new Error(`Generated question "${q.text}" (ID: ${questionId}) must have exactly four answers.`);
        }

        const correctAnswers = q.answers.filter(a => a.isCorrect === true).length;
        if (correctAnswers !== 1) {
          console.error(`[generateTriviaQuestionsFlow] Generated question "${q.text}" (ID: ${questionId}) must have exactly one correct answer, found ${correctAnswers}.`);
          throw new Error(`Generated question "${q.text}" (ID: ${questionId}) must have exactly one correct answer.`);
        }
        
        let questionDifficulty = q.difficulty;
        if (!questionDifficulty || !["Easy", "Medium", "Hard", "Very Hard"].includes(questionDifficulty)) {
           console.warn(`[generateTriviaQuestionsFlow] Generated question "${q.text}" (ID: ${questionId}) has an invalid or missing difficulty "${questionDifficulty}". Defaulting to "Medium".`);
           questionDifficulty = "Medium"; // Default if missing or invalid
        }
        
        // Ensure all answer options have text
        q.answers.forEach((ans, ansIdx) => {
            if (!ans.text || typeof ans.text !== 'string' || ans.text.trim() === '') {
                throw new Error(`Answer option ${ansIdx + 1} for question "${q.text}" (ID: ${questionId}) is missing text.`);
            }
        });

        return { ...q, id: questionId, difficulty: questionDifficulty as "Easy" | "Medium" | "Hard" | "Very Hard" };
      });

      if (validatedQuestions.length === 0 && input.numberOfQuestions > 0) {
        console.error('[generateTriviaQuestionsFlow] All questions generated by AI failed validation, or no questions were generated initially. Input:', input, 'Raw Output from AI:', rawAiOutputFromPrompt);
        throw new Error('AI generated questions, but none passed validation, or no questions were returned.');
      }
      
      if (validatedQuestions.length < input.numberOfQuestions) {
        console.warn(`[generateTriviaQuestionsFlow] AI generated fewer valid questions (${validatedQuestions.length}) than requested (${input.numberOfQuestions}). Input:`, input);
      }

      return { questions: validatedQuestions };

    } catch (error: any) {
      console.error('[generateTriviaQuestionsFlow] Error during question generation or validation:', error);
      // Log the raw output if available and an error occurred
      if (rawAiOutputFromPrompt) {
        console.error('[generateTriviaQuestionsFlow] Raw AI output (parsed by Genkit) at time of error:', JSON.stringify(rawAiOutputFromPrompt, null, 2));
      }
      if (error instanceof ZodError) {
        console.error('[generateTriviaQuestionsFlow] Zod validation issues (likely from AI output structure):', error.issues);
        // Construct a more user-friendly message from Zod issues
        const zodIssuesMessage = error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join('; ');
        throw new Error(`AI returned data in an unexpected format. Details: ${zodIssuesMessage}`);
      }
      // Re-throw the error to be caught by the calling client
      throw new Error(error.message || 'An unexpected error occurred while generating questions.');
    }
  }
);
