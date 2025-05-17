
'use server';
/**
 * @fileOverview A Genkit flow to generate a set of trivia questions for the game.
 *
 * - generateTriviaQuestions - A function that generates a specified number of trivia questions.
 * - GenerateTriviaQuestionsInput - The input type for the generateTriviaQuestions function.
 * - GenerateTriviaQuestionsOutput - The return type for the generateTriviaQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; // Genkit re-exports Zod as z
import type { Question } from '@/lib/types'; // Keep this for the final Question type
import { AnswerSchema, DifficultyEnum } from '@/lib/types'; // QuestionSchema from here is for client-side

const GenerateTriviaQuestionsInputSchema = z.object({
  numberOfQuestions: z.number().int().positive().describe('The number of trivia questions to generate.'),
  difficulty: z.string().optional().describe('Optional: The desired difficulty for all questions (e.g., "Easy", "Medium", "Hard"). If "Mixed" or not provided, a range of difficulties will be generated.'),
  category: z.string().optional().describe('Optional: The desired category for all questions (e.g., "Sports", "History"). If "General Knowledge" or not provided, questions will cover various topics.'),
  requestIdentifier: z.string().optional().describe('An optional unique identifier for the game session to help ensure question variety across multiple plays.'),
  variationHint: z.string().optional().describe('An optional random string to further encourage unique question sets for each request.'),
});
export type GenerateTriviaQuestionsInput = z.infer<typeof GenerateTriviaQuestionsInputSchema>;

// This schema is what the AI is prompted to return for each question.
// Note: It doesn't include `points` as that's added client-side.
// It also doesn't include `imageUrl` as we are not prompting for images.
const AIQuestionOutputSchema = z.object({
  id: z.string().describe("A unique identifier for the question (e.g., generated UUID or sequential)."),
  text: z.string().min(1).describe("The text of the trivia question."),
  answers: z.array(AnswerSchema).length(4).describe("An array of exactly four answer options."),
  difficulty: DifficultyEnum.describe("The difficulty level of the question."),
});

const GenerateTriviaQuestionsOutputSchema = z.object({
  questions: z.array(AIQuestionOutputSchema).describe('An array of generated trivia questions, matching the AIQuestionOutputSchema structure.'),
});
// This type represents the direct output from the AI based on the prompt's output schema
export type AIResponseType = z.infer<typeof GenerateTriviaQuestionsOutputSchema>;


// The public function returns Promise<{ questions: Question[] }> where Question includes points.
export async function generateTriviaQuestions(input: GenerateTriviaQuestionsInput): Promise<{ questions: Question[] }> {
  const flowResult = await generateTriviaQuestionsFlow(input);
  // The flow returns questions matching AIQuestionOutputSchema.
  // Points and imageUrl (if any) would be added by the client or another layer.
  // For now, we cast as Question[], assuming points will be added later by game logic.
  return { questions: flowResult.questions as Question[] };
}

const triviaQuestionsPrompt = ai.definePrompt({
  name: 'generateTriviaQuestionsPrompt',
  input: {schema: GenerateTriviaQuestionsInputSchema},
  output: {schema: GenerateTriviaQuestionsOutputSchema},
  config: {
    temperature: 0.95,
  },
  prompt: `You are a trivia question generator for a game show.
  Request Identifier: {{{requestIdentifier}}}
  Variation Hint for this specific request (use this to ensure a truly unique set of questions, do not include this hint in the questions themselves): {{{variationHint}}}

  Generate {{{numberOfQuestions}}} unique trivia questions.

  It is CRITICAL that for each request (even with similar category or difficulty requests), you generate a FRESH and DISTINCT set of questions. Avoid repeating questions that might have been generated in previous requests. The game is played multiple times, so variety is key. DO NOT REPEAT QUESTIONS. EACH GAME SESSION MUST HAVE NEW QUESTIONS. Use the Request Identifier and Variation Hint to ensure this uniqueness.

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
  `,
});

const generateTriviaQuestionsFlow = ai.defineFlow(
  {
    name: 'generateTriviaQuestionsFlow',
    inputSchema: GenerateTriviaQuestionsInputSchema,
    // The flow's direct output (before points are added by client) uses AIQuestionOutputSchema structure for its questions.
    outputSchema: z.object({ questions: z.array(AIQuestionOutputSchema) }),
  },
  async (input) => {
    let promptResult;
    let aiOutput: AIResponseType | null | undefined = null;

    try {
      promptResult = await triviaQuestionsPrompt(input);
      aiOutput = promptResult.output; // output can be null if parsing failed or AI returned nothing matching schema

      if (!aiOutput) {
        console.error('[generateTriviaQuestionsFlow] AI prompt returned no structured output (output is null or undefined). Input:', JSON.stringify(input, null, 2), 'Full Genkit Result:', JSON.stringify(promptResult, null, 2));
        throw new Error('AI prompt returned no structured output. The AI response might be malformed or empty.');
      }

    } catch (e: any) {
      // This catch block handles errors from `triviaQuestionsPrompt` (e.g., LLM API errors)
      // or if Zod parsing by Genkit itself failed and threw an error.
      console.error('[generateTriviaQuestionsFlow] Critical error during AI prompt execution or initial parsing. Input:', JSON.stringify(input, null, 2), 'Error:', e);
      
      let errorMessage = 'AI prompt execution failed or returned malformed data.';
      if (e instanceof z.ZodError) {
        errorMessage = `AI output failed Zod validation: ${e.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ')}`;
        console.error('[generateTriviaQuestionsFlow] Zod validation issues (details):', JSON.stringify(e.errors, null, 2));
      } else if (e instanceof Error) {
        errorMessage = e.message;
      }
      throw new Error(`AI Flow Error: ${errorMessage}`);
    }
    
    // At this point, aiOutput should be valid as per GenerateTriviaQuestionsOutputSchema,
    // but we perform additional checks for robustness.
    if (!aiOutput.questions || !Array.isArray(aiOutput.questions)) {
      console.error('[generateTriviaQuestionsFlow] AI output for "questions" is not an array, even after initial Genkit parsing. Input:', JSON.stringify(input, null, 2), 'Received Output:', JSON.stringify(aiOutput, null, 2));
      throw new Error('AI returned malformed data: "questions" field was not an array.');
    }

    if (aiOutput.questions.length === 0 && input.numberOfQuestions > 0) {
      console.warn('[generateTriviaQuestionsFlow] AI returned an empty list of questions when questions were requested. Input:', JSON.stringify(input, null, 2));
      // Depending on requirements, you might throw an error here. For now, an empty array will pass through to be handled by subsequent checks.
    }
    
    const validatedQuestions: (Omit<Question, 'points' | 'imageUrl'>)[] = [];

    for (const [index, qSource] of aiOutput.questions.entries()) {
      let currentQuestionForLog = `Question at index ${index}`;
      try {
        let questionId = qSource.id;
        if (!questionId || typeof questionId !== 'string' || questionId.trim() === "") {
           console.warn(`[Validation] ${currentQuestionForLog} has missing/invalid ID "${qSource.id}". Assigning fallback.`);
           questionId = `gen_q_fallback_${index}_${Date.now()}`;
        }
        currentQuestionForLog = `Question (ID: ${questionId})`; // Update for subsequent logs

        if (!qSource.text || typeof qSource.text !== 'string' || qSource.text.trim() === "") {
          throw new Error(`${currentQuestionForLog} has missing or empty text.`);
        }

        if (!qSource.answers || !Array.isArray(qSource.answers) || qSource.answers.length !== 4) {
          throw new Error(`${currentQuestionForLog} (Text: "${qSource.text.substring(0,30)}...") must have exactly four answers, found ${qSource.answers?.length || 0}.`);
        }

        const correctAnswers = qSource.answers.filter(a => a.isCorrect === true).length;
        if (correctAnswers !== 1) {
          throw new Error(`${currentQuestionForLog} (Text: "${qSource.text.substring(0,30)}...") must have exactly one correct answer, found ${correctAnswers}.`);
        }
        
        for (const [ansIdx, ans] of qSource.answers.entries()) {
            if (!ans.text || typeof ans.text !== 'string' || ans.text.trim() === '') {
                throw new Error(`Answer option ${ansIdx + 1} for ${currentQuestionForLog} (Text: "${qSource.text.substring(0,30)}...") is missing text.`);
            }
            if (typeof ans.isCorrect !== 'boolean') {
                throw new Error(`Answer option ${ansIdx + 1} for ${currentQuestionForLog} (Text: "${qSource.text.substring(0,30)}...") has an invalid 'isCorrect' field (must be boolean).`);
            }
        }

        let questionDifficulty = qSource.difficulty;
        if (!DifficultyEnum.safeParse(questionDifficulty).success) {
           console.warn(`[Validation] ${currentQuestionForLog} (Text: "${qSource.text.substring(0,30)}...") has invalid/missing difficulty "${qSource.difficulty}". Defaulting to "Medium".`);
           questionDifficulty = "Medium";
        }
        
        validatedQuestions.push({
          id: questionId,
          text: qSource.text,
          answers: qSource.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })), // Ensure answer structure
          difficulty: questionDifficulty as Question['difficulty'], // Cast to the specific enum type
        });

      } catch (validationError: any) {
        console.warn(`[generateTriviaQuestionsFlow] Skipping question at index ${index} due to validation error: ${validationError.message}. Original data:`, JSON.stringify(qSource, (key, value) => typeof value === 'string' && value.length > 100 ? value.substring(0,100) + '...' : value, 2));
        // Continue to next question, allowing other valid questions to pass
      }
    }

    if (validatedQuestions.length === 0 && input.numberOfQuestions > 0) {
      console.error('[generateTriviaQuestionsFlow] No questions passed validation, or AI returned no usable questions initially. Input:', JSON.stringify(input, null, 2));
      throw new Error('AI-generated questions failed validation, or no questions were returned by the AI that could be used.');
    }
    
    if (validatedQuestions.length < input.numberOfQuestions) {
      console.warn(`[generateTriviaQuestionsFlow] Returning ${validatedQuestions.length} valid questions, but ${input.numberOfQuestions} were requested. Some AI-generated questions may have failed validation. Input:`, JSON.stringify(input, null, 2));
    }

    return { questions: validatedQuestions };
  }
);

    