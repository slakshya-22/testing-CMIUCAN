
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, FirestoreScoreEntry, AudiencePollResults } from '@/lib/types';
import { POINTS_LADDER } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';
import { generateTriviaQuestions, type GenerateTriviaQuestionsInput } from '@/ai/flows/generate-trivia-questions-flow';
import { firestore } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const INITIAL_TIMER_DURATION = 30;
const TOTAL_QUESTIONS_IN_GAME = 15;

export type GameStatus = "idle" | "loading_questions" | "playing" | "answered" | "game_over" | "game_won" | "error_loading_questions";

// Helper to shuffle array items
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function useGameState() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerType | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");

  const [isPhoneAFriendUsed, setIsPhoneAFriendUsed] = useState(false);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [isAudiencePollUsed, setIsAudiencePollUsed] = useState(false);
  const [audiencePollResults, setAudiencePollResults] = useState<AudiencePollResults | null>(null);
  const [displayedAnswers, setDisplayedAnswers] = useState<AnswerType[]>([]);

  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameEndTime, setGameEndTime] = useState<number | null>(null);

  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex] || null;

  const goToNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setAudiencePollResults(null); // Reset poll results for next question

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      if (nextQuestion) {
        setDisplayedAnswers(shuffleArray(nextQuestion.answers));
      }
      setCurrentQuestionIndex(nextIndex);
      setGameStatus("playing");
    } else {
      setGameEndTime(Date.now());
      setGameStatus("game_won");
       toast({
          title: "✨ YOU'VE CONQUERED THE GAME! ✨",
          description: `Absolutely brilliant! You've answered all ${questions.length} questions correctly! Your final score: ${score.toLocaleString()} points.`,
          variant: "default",
          duration: 10000,
        });
    }
  }, [currentQuestionIndex, questions, score, toast]);


  const handleSelectAnswer = useCallback((answer: AnswerType) => {
    if (isAnswerRevealed || (gameStatus !== "playing" && gameStatus !== "answered")) return;

    setSelectedAnswer(answer);
    setIsAnswerRevealed(true);
    setGameStatus("answered");

    let newScore = score;
    if (answer.isCorrect) {
      newScore = score + (currentQuestion?.points || 0);
      setScore(newScore);
      toast({
        title: "Correct!",
        description: `You won ${(currentQuestion?.points || 0).toLocaleString()} points.`,
        variant: "default",
        duration: 2000,
      });

      if (currentQuestionIndex === questions.length - 1) {
        setGameEndTime(Date.now());
        setGameStatus("game_won");
        toast({
          title: "✨ YOU'VE CONQUERED THE GAME! ✨",
          description: `Absolutely brilliant! You've answered all ${questions.length} questions correctly! Your final score: ${newScore.toLocaleString()} points.`,
          variant: "default",
          duration: 10000,
        });
        return;
      }
    } else {
      setGameEndTime(Date.now());
      toast({
        title: "Incorrect!",
        description: `The correct answer was: "${currentQuestion?.answers.find(a => a.isCorrect)?.text}". You walk away with ${score.toLocaleString()} points.`,
        variant: "destructive",
        duration: 4000,
      });
    }

    setTimeout(() => {
      if (!answer.isCorrect) {
        setGameStatus("game_over");
      } else if (gameStatus !== "game_won") { // Ensure we don't call goToNextQuestion if game_won was already set
        goToNextQuestion();
      }
    }, answer.isCorrect ? 2500 : 4000);

  }, [isAnswerRevealed, gameStatus, currentQuestion, score, toast, goToNextQuestion, currentQuestionIndex, questions.length]);


  const loadQuestions = useCallback(async (mode?: string, category?: string) => {
    setGameStatus("loading_questions");
    setQuestions([]); // Clear old questions
    setDisplayedAnswers([]);
    setGameStartTime(null); // Reset start time before new questions load
    setGameEndTime(null);   // Reset end time for the new game

    try {
      const input: GenerateTriviaQuestionsInput = {
        numberOfQuestions: TOTAL_QUESTIONS_IN_GAME,
        difficulty: mode !== "Mixed" ? mode : undefined,
        category: category !== "General Knowledge" ? category : undefined,
        requestIdentifier: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        variationHint: Math.random().toString(36).slice(2, 12),
      };
      console.log('[useGameState] Generating questions with input:', JSON.stringify(input, null, 2));

      const aiResult = await generateTriviaQuestions(input);

      if (!aiResult || !aiResult.questions || aiResult.questions.length === 0) {
        throw new Error("AI failed to return any valid questions.");
      }

      const questionsWithPoints = aiResult.questions.map((q, index) => ({
        ...q,
        points: POINTS_LADDER[index] || POINTS_LADDER[POINTS_LADDER.length - 1], // Assign points based on ladder
      }));

      setQuestions(questionsWithPoints);
      if (questionsWithPoints.length > 0) {
        setDisplayedAnswers(shuffleArray(questionsWithPoints[0].answers));
        setGameStatus("playing");
        setGameStartTime(Date.now()); // Set start time HERE, when game is ready to be played
        if (questionsWithPoints.length < TOTAL_QUESTIONS_IN_GAME) {
          toast({
            title: "Fewer Questions Loaded",
            description: `AI provided ${questionsWithPoints.length} questions. The game will proceed with these.`,
            variant: "default",
            duration: 4000,
          });
        }
      } else {
        throw new Error("No questions were processed after AI generation.");
      }
    } catch (e: any) {
      console.error("[useGameState] Failed to generate/load trivia questions:", e);
      let displayErrorMessage = "Could not generate new trivia questions. Please try again.";
       if (e && e.message) {
        if (e.message.includes('An error occurred in the Server Components render') || e.message.includes('digest property is included on this error instance') || e.message.includes('A server error occurred during AI question generation')) {
          displayErrorMessage = "The AI failed to generate questions due to a server error. Server logs may have details.";
        } else if (e.message.includes('AI returned malformed data') || e.message.includes('AI prompt execution failed to produce a structured output') || e.message.includes('AI Flow Error')) {
           displayErrorMessage = `The AI encountered an issue: ${e.message}. Please try again.`;
        } else if (e.message.includes('Please pass in the API key')) {
            displayErrorMessage = "API Key for AI services is missing or invalid. Please check server configuration."
        } else if (e.message.includes('AI-generated questions failed validation') || e.message.includes('AI failed to return any valid questions.')) {
           displayErrorMessage = `AI Question Generation Problem: ${e.message}. This might be due to strict validation or the AI model's response. Try again.`;
        } else {
          displayErrorMessage = e.message;
        }
      } else if (typeof e === 'string') {
        displayErrorMessage = e;
      }
      toast({
        title: "Error Loading Questions",
        description: displayErrorMessage,
        variant: "destructive",
        duration: 15000,
      });
      setQuestions([]);
      setGameStatus("error_loading_questions");
    }
  }, [toast]);

  const startGame = useCallback((mode?: string, category?: string) => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setIsPhoneAFriendUsed(false);
    setIsFiftyFiftyUsed(false);
    setIsAudiencePollUsed(false);
    setAudiencePollResults(null);
    setQuestions([]);
    setDisplayedAnswers([]);
    setGameStartTime(null); // Ensure start time is reset for a new game
    setGameEndTime(null);   // Ensure end time is reset for a new game
    loadQuestions(mode, category);
  }, [loadQuestions]);


  useEffect(() => {
    if (gameStatus === "playing" && questions.length > 0 && currentQuestionIndex < questions.length) {
        if (currentQuestion) {
            setDisplayedAnswers(shuffleArray(currentQuestion.answers));
        } else {
            console.warn("[useGameState] Game is 'playing' but currentQuestion is null. CurrentIndex:", currentQuestionIndex, "Questions Length:", questions.length);
            setDisplayedAnswers([]); // Fallback, though ideally currentQuestion should exist
        }
    }
  }, [currentQuestion, gameStatus, questions, currentQuestionIndex]); // Removed setDisplayedAnswers from deps as it's a setter


  const handleTimeUp = useCallback(() => {
    if (gameStatus === "playing") { // Only act if game is actively playing
      setGameEndTime(Date.now());
      toast({
        title: "Time's Up!",
        description: "You ran out of time for this question. Game Over.",
        variant: "destructive",
      });
      setGameStatus("game_over");
    }
  }, [gameStatus, toast]);

  const usePhoneAFriend = useCallback(() => {
    setIsPhoneAFriendUsed(true);
  }, []);

  const useFiftyFifty = useCallback(() => {
    if (!currentQuestion || isFiftyFiftyUsed || displayedAnswers.length <= 2 ) {
      // Already used, no question, or too few answers to reduce
      return;
    }
    // Get the original full set of answers for the current question
    const originalAnswers = currentQuestion.answers;
    const correctAnswer = originalAnswers.find(a => a.isCorrect);
    // Filter out incorrect answers from the original set
    const incorrectAnswersFromOriginal = originalAnswers.filter(a => !a.isCorrect);

    if (correctAnswer && incorrectAnswersFromOriginal.length > 0) {
      // Shuffle the incorrect answers and pick one
      const oneRandomIncorrect = shuffleArray(incorrectAnswersFromOriginal)[0];
      // Create the new set of two answers to display
      const newDisplayedAnswers = shuffleArray([correctAnswer, oneRandomIncorrect]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, displayedAnswers, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: Record<string, number> = {};
    const optionsForPoll = [...displayedAnswers]; // Poll based on currently visible answers
    const correctAnswerInFullSet = currentQuestion.answers.find(a => a.isCorrect);

    if (!correctAnswerInFullSet) {
        // This should not happen if questions are well-formed
        toast({ title: "Audience Poll Error", description: "Could not determine correct answer for poll.", variant: "destructive"});
        return;
    }
    const correctAnswerText = correctAnswerInFullSet.text;

    let totalPercentage = 100;
    // Determine if the correct answer is currently displayed (e.g., not removed by 50:50)
    const isCorrectAnswerDisplayed = optionsForPoll.some(opt => opt.text === correctAnswerText);
    let correctAnswerPercentage = 0;

    if (isCorrectAnswerDisplayed) {
        // Assign a higher chance to the correct answer
        correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; // 40-70%
        results[correctAnswerText] = correctAnswerPercentage;
        totalPercentage -= correctAnswerPercentage;
    }

    // Distribute remaining percentage among other displayed options
    const otherOptions = optionsForPoll.filter(opt => opt.text !== correctAnswerText);

    otherOptions.forEach((option, index) => {
      if (index === otherOptions.length - 1) {
        // Assign all remaining percentage to the last option
        results[option.text] = Math.max(0, totalPercentage); // Ensure not negative
      } else {
        // Max percentage this option can take (leaving at least 1 for subsequent options)
        const maxForThisOption = Math.max(0, totalPercentage - (otherOptions.length - 1 - index));
        const randomPercentage = Math.floor(Math.random() * (maxForThisOption + 1));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage); // Don't exceed remaining total
        results[option.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });

    // Ensure all displayed options have a percentage (even if 0 if correct answer wasn't displayed)
    optionsForPoll.forEach(opt => {
        if (!(opt.text in results)) {
            results[opt.text] = 0; // Default to 0 if not assigned (e.g. if correct answer was not displayed)
        }
    });

    // Normalize to 100% if there were rounding issues or if correct wasn't displayed and percentages are off
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
        // Adjust the correct answer's percentage or the first option's if correct isn't there
        const optionToAdjust = optionsForPoll.find(opt => opt.text === correctAnswerText && isCorrectAnswerDisplayed) || optionsForPoll[0];
        if (optionToAdjust && results[optionToAdjust.text] !== undefined) {
             results[optionToAdjust.text] = Math.max(0, Math.min(100, results[optionToAdjust.text] + (100 - currentSum)));
        }
    }
    // Final check
    currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
        // If still not 100, distribute remaining to first option (rare case)
        const firstKey = optionsForPoll[0].text;
        if (results[firstKey] !== undefined) {
           results[firstKey] = Math.max(0, Math.min(100, results[firstKey] + (100 - currentSum)));
        }
    }


    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    toast({ title: "Audience Poll Used", description: "The audience has cast their votes!"});
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);

  const saveScore = useCallback(async (name: string, userId: string) => {
    if (!firestore) {
        console.error("[saveScore] Firestore is not initialized.");
        toast({ title: "Error Saving Score", description: "Database connection error.", variant: "destructive" });
        return Promise.reject(new Error("Database connection error."));
    }
    if (!userId) {
        console.error("[saveScore] User ID is missing, cannot save score.");
        toast({ title: "Error Saving Score", description: "User not authenticated.", variant: "destructive" });
        return Promise.reject(new Error("User not authenticated."));
    }

    const calculatedTimeTakenMs = gameEndTime && gameStartTime ? gameEndTime - gameStartTime : 0;
    // Ensure time taken is non-negative; if null/undefined from calculation, default to 0.
    const actualTimeTaken = typeof calculatedTimeTakenMs === 'number' ? Math.max(0, calculatedTimeTakenMs) : 0;

    console.log(`[saveScore] Attempting to save. User: ${name}, ID: ${userId}, Score: ${score}, TimeTakenMs: ${actualTimeTaken}`);

    const scoreDocRef = doc(firestore, "leaderboard_scores", userId);

    try {
        const docSnap = await getDoc(scoreDocRef);
        let shouldWrite = false;
        let message = "";

        const scoreData: Omit<FirestoreScoreEntry, 'id' | 'date' | 'timestampMillis'> & { timestamp: any } = {
            name: name,
            score: score,
            userId: userId,
            timeTakenMs: actualTimeTaken,
            timestamp: serverTimestamp()
        };
        console.log('[saveScore] Data being prepared for Firestore:', JSON.stringify(scoreData, null, 2));


        if (docSnap.exists()) {
            const existingData = docSnap.data() as FirestoreScoreEntry;
            console.log(`[saveScore] Existing score for user ${userId}: Score ${existingData.score}, Time ${existingData.timeTakenMs}ms`);
            if (score > existingData.score) {
                shouldWrite = true;
                message = `New high score of ${score.toLocaleString()} saved! Previous: ${existingData.score.toLocaleString()}.`;
            } else if (score === existingData.score && (actualTimeTaken < existingData.timeTakenMs || typeof existingData.timeTakenMs !== 'number')) {
                shouldWrite = true;
                message = `Score of ${score.toLocaleString()} matches previous, but with a faster time! (${(actualTimeTaken / 1000).toFixed(2)}s vs ${existingData.timeTakenMs ? (existingData.timeTakenMs / 1000).toFixed(2) + 's' : 'N/A'}).`;
            } else {
                 message = `Your score of ${score.toLocaleString()} (time: ${(actualTimeTaken / 1000).toFixed(2)}s) did not beat your previous high score of ${existingData.score.toLocaleString()} (time: ${existingData.timeTakenMs ? (existingData.timeTakenMs / 1000).toFixed(2) + 's' : 'N/A'}).`;
            }
        } else {
            shouldWrite = true;
            message = `First score of ${score.toLocaleString()} (time: ${(actualTimeTaken / 1000).toFixed(2)}s) saved!`;
            console.log(`[saveScore] No existing score found for user ${userId}. Saving new score.`);
        }

        if (shouldWrite) {
            await setDoc(scoreDocRef, scoreData);
            console.log(`[saveScore] Firestore write successful for user ${userId}.`);
             toast({
                title: "Score Saved!",
                description: message,
            });
        } else {
             console.log(`[saveScore] Score not written for user ${userId} as it was not better.`);
             toast({
                title: "Score Status",
                description: message,
                duration: 4000,
            });
        }
    } catch (error: any) {
        console.error("[saveScore] Error saving score to Firestore: ", error);
        toast({
            title: "Error Saving Score",
            description: `Could not save your score. Error: ${error.message || 'Unknown error'}`,
            variant: "destructive",
        });
        return Promise.reject(error);
    }
    return Promise.resolve();
  }, [score, toast, gameStartTime, gameEndTime]); // Added gameStartTime and gameEndTime to dependencies

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    score,
    selectedAnswer,
    isAnswerRevealed,
    gameStatus,
    startGame,
    handleSelectAnswer,
    handleTimeUp,
    INITIAL_TIMER_DURATION,
    totalQuestions: questions.length > 0 ? questions.length : TOTAL_QUESTIONS_IN_GAME,
    timeTakenMs: gameEndTime && gameStartTime ? gameEndTime - gameStartTime : null,

    isPhoneAFriendUsed,
    usePhoneAFriend,
    isFiftyFiftyUsed,
    useFiftyFifty,
    isAudiencePollUsed,
    useAudiencePoll,
    audiencePollResults,
    displayedAnswers,
    saveScore,
  };
}
