
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
    setAudiencePollResults(null);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      // displayedAnswers will be set by the useEffect watching currentQuestion.id
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
  }, [currentQuestionIndex, questions.length, score, toast]);


  const handleSelectAnswer = useCallback((answer: AnswerType) => {
    if (isAnswerRevealed || (gameStatus !== "playing" && gameStatus !== "answered")) return;

    setSelectedAnswer(answer);
    setIsAnswerRevealed(true);
    setGameStatus("answered"); // Important to set this to pause timer and interaction

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
        return; // Game won, no further action here
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

    // Delay next action to allow user to see feedback
    setTimeout(() => {
      if (!answer.isCorrect) {
        setGameStatus("game_over");
      } else if (gameStatus !== "game_won") { // Ensure we don't call goToNext if game already won
        goToNextQuestion();
      }
    }, answer.isCorrect ? 2500 : 4000);

  }, [isAnswerRevealed, gameStatus, currentQuestion, score, toast, goToNextQuestion, currentQuestionIndex, questions.length]);


  const loadQuestions = useCallback(async (mode?: string, category?: string) => {
    setGameStatus("loading_questions");
    setQuestions([]);
    setDisplayedAnswers([]);
    setGameStartTime(null);
    setGameEndTime(null);

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
        points: POINTS_LADDER[index] || POINTS_LADDER[POINTS_LADDER.length - 1],
      }));

      setQuestions(questionsWithPoints);
      // displayedAnswers will be set by the useEffect watching currentQuestion.id
      if (questionsWithPoints.length > 0) {
        setGameStatus("playing");
        const startTime = Date.now();
        setGameStartTime(startTime);
        console.log(`[useGameState] Game started. gameStartTime set to: ${startTime}`);
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
          displayErrorMessage = "The AI failed to generate questions due to a server error. Server logs may have details. Please check server deployment logs.";
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
    setGameStartTime(null);
    setGameEndTime(null);
    loadQuestions(mode, category);
  }, [loadQuestions]);


  // Effect to set displayedAnswers when a new question is loaded
  useEffect(() => {
    if (gameStatus === "playing" && currentQuestion) {
        setDisplayedAnswers(shuffleArray(currentQuestion.answers));
    }
    // We don't want to clear displayedAnswers here if gameStatus is "answered",
    // as that would remove them before the user sees the reveal.
    // It's cleared in startGame or if loading questions fails.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, gameStatus]); // Only re-shuffle if question ID changes or game status becomes "playing" for that question


  const handleTimeUp = useCallback(() => {
    if (gameStatus === "playing") {
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
      return;
    }
    const originalAnswers = currentQuestion.answers;
    const correctAnswer = originalAnswers.find(a => a.isCorrect);
    const incorrectAnswersFromOriginal = originalAnswers.filter(a => !a.isCorrect);

    if (correctAnswer && incorrectAnswersFromOriginal.length > 0) {
      const oneRandomIncorrect = shuffleArray(incorrectAnswersFromOriginal)[0];
      const newDisplayedAnswers = shuffleArray([correctAnswer, oneRandomIncorrect]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, displayedAnswers, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: Record<string, number> = {};
    const optionsForPoll = [...displayedAnswers];
    const correctAnswerInFullSet = currentQuestion.answers.find(a => a.isCorrect);

    if (!correctAnswerInFullSet) {
        toast({ title: "Audience Poll Error", description: "Could not determine correct answer for poll.", variant: "destructive"});
        return;
    }
    const correctAnswerText = correctAnswerInFullSet.text;

    let totalPercentage = 100;
    const isCorrectAnswerDisplayed = optionsForPoll.some(opt => opt.text === correctAnswerText);
    let correctAnswerPercentage = 0;

    if (isCorrectAnswerDisplayed) {
        correctAnswerPercentage = Math.floor(Math.random() * 31) + 40;
        results[correctAnswerText] = correctAnswerPercentage;
        totalPercentage -= correctAnswerPercentage;
    }

    const otherOptions = optionsForPoll.filter(opt => opt.text !== correctAnswerText);

    otherOptions.forEach((option, index) => {
      if (index === otherOptions.length - 1) {
        results[option.text] = Math.max(0, totalPercentage);
      } else {
        const maxForThisOption = Math.max(0, totalPercentage - (otherOptions.length - 1 - index));
        const randomPercentage = Math.floor(Math.random() * (maxForThisOption + 1));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage);
        results[option.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });

    optionsForPoll.forEach(opt => {
        if (!(opt.text in results)) {
            results[opt.text] = 0;
        }
    });

    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
        const optionToAdjust = optionsForPoll.find(opt => opt.text === correctAnswerText && isCorrectAnswerDisplayed) || optionsForPoll[0];
        if (optionToAdjust && results[optionToAdjust.text] !== undefined) {
             results[optionToAdjust.text] = Math.max(0, Math.min(100, results[optionToAdjust.text] + (100 - currentSum)));
        }
    }
    currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0 && optionsForPoll[0]?.text) {
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

    console.log(`[saveScore] Invoked. gameStartTime: ${gameStartTime}, gameEndTime: ${gameEndTime}`);
    const calculatedTimeTakenMs = gameEndTime && gameStartTime ? gameEndTime - gameStartTime : 0;
    console.log(`[saveScore] calculatedTimeTakenMs after direct calculation: ${calculatedTimeTakenMs}`);
    const actualTimeTaken = typeof calculatedTimeTakenMs === 'number' ? Math.max(0, calculatedTimeTakenMs) : 0;


    const scoreData: Omit<FirestoreScoreEntry, 'id' | 'date' | 'timestampMillis'> & { timestamp: any } = { // Ensure 'any' for serverTimestamp
        name: name,
        score: score,
        userId: userId,
        timeTakenMs: actualTimeTaken, // This is now directly calculated here
        timestamp: serverTimestamp()
    };
    console.log('[saveScore] Data being prepared for Firestore:', JSON.stringify(scoreData, null, 2));

    const scoreDocRef = doc(firestore, "leaderboard_scores", userId);

    try {
        const docSnap = await getDoc(scoreDocRef);
        let shouldWrite = false;
        let message = "";

        if (docSnap.exists()) {
            const existingData = docSnap.data() as FirestoreScoreEntry;
            console.log(`[saveScore] Existing score for user ${userId}: Score ${existingData.score}, Time ${existingData.timeTakenMs}ms`);
            if (score > existingData.score) {
                shouldWrite = true;
                message = `New high score of ${score.toLocaleString()} saved! Previous: ${existingData.score.toLocaleString()}.`;
            } else if (score === existingData.score && (typeof existingData.timeTakenMs !== 'number' || actualTimeTaken < existingData.timeTakenMs)) {
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
  }, [score, toast, gameStartTime, gameEndTime]);

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
