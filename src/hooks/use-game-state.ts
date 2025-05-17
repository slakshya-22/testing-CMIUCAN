
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, FirestoreScoreEntry, AudiencePollResults } from '@/lib/types';
import { KBC_POINTS } from '@/lib/game-data'; 
import { useToast } from '@/hooks/use-toast';
import { generateTriviaQuestions, type GenerateTriviaQuestionsInput } from '@/ai/flows/generate-trivia-questions-flow';
import { firestore } from '@/lib/firebase/config'; 
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; 
import { useAuth } from '@/context/AuthContext';

const INITIAL_TIMER_DURATION = 30; 
const TOTAL_QUESTIONS_IN_GAME = 15;

export type GameStatus = "idle" | "loading_questions" | "playing" | "answered" | "game_over" | "error_loading_questions";

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

  const { toast } = useToast();
  const { user } = useAuth();

  const currentQuestion = questions[currentQuestionIndex] || null;

  const goToNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setAudiencePollResults(null); 
    
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        setDisplayedAnswers(shuffleArray(nextQuestion.answers));
      }
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setGameStatus("playing");
    } else {
      toast({
        title: "Congratulations!",
        description: `You've answered all ${questions.length} questions and your final score is ${score.toLocaleString()} points!`,
        variant: "default", 
        duration: 5000,
      });
      setGameStatus("game_over");
    }
  }, [currentQuestionIndex, questions, score, toast]);


  const handleSelectAnswer = useCallback((answer: AnswerType) => {
    if (isAnswerRevealed || gameStatus !== "playing") return;
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
    } else {
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
      } else {
        goToNextQuestion();
      }
    }, answer.isCorrect ? 2000 : 4000);

  }, [isAnswerRevealed, gameStatus, currentQuestion, score, toast, goToNextQuestion]);

  const loadQuestions = useCallback(async (mode?: string, category?: string) => {
    setGameStatus("loading_questions");
    setQuestions([]); 
    try {
      const input: GenerateTriviaQuestionsInput = { 
        numberOfQuestions: TOTAL_QUESTIONS_IN_GAME,
        difficulty: mode !== "Mixed" ? mode : undefined,
        category: category !== "General Knowledge" ? category : undefined,
        requestIdentifier: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        variationHint: Math.random().toString(36).slice(2, 12), // Generate a random string for variation
      };
      console.log('[useGameState] Generating questions with input:', JSON.stringify(input, null, 2));
      const aiResult = await generateTriviaQuestions(input);
      
      if (!aiResult || !aiResult.questions || aiResult.questions.length === 0) {
        throw new Error("AI failed to return any valid questions.");
      }
      
      const questionsWithPoints = aiResult.questions.map((q, index) => ({
        ...q,
        points: KBC_POINTS[index] || KBC_POINTS[KBC_POINTS.length - 1], 
        id: q.id || `gen_q_client_fallback_${index}_${Date.now()}` 
      }));

      setQuestions(questionsWithPoints);
      if (questionsWithPoints.length > 0) {
        setGameStatus("playing");
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
    } catch (error: any) {
      console.error("[useGameState] Failed to generate/load trivia questions:", error);
      let displayErrorMessage = "Could not generate new trivia questions. Please try again.";
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('An error occurred in the Server Components render') || error.message.includes('digest property is included on this error instance') || error.message.includes('A server error occurred during AI question generation')) {
          displayErrorMessage = "The AI failed to generate questions due to a server error. Please check server logs for details and try again.";
        } else if (error.message.includes('AI returned malformed data') || error.message.includes('AI prompt execution failed to produce a structured output')) {
           displayErrorMessage = "The AI provided questions in an unexpected format. We're working on it. Please try again in a moment.";
        } else {
          displayErrorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        displayErrorMessage = error;
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
    loadQuestions(mode, category);
  }, [loadQuestions]);
  
  useEffect(() => {
    if (currentQuestion) {
        setDisplayedAnswers(shuffleArray(currentQuestion.answers));
    } else if (gameStatus === "playing" && questions.length > 0 && !currentQuestion) {
        console.warn("[useGameState] Game is 'playing' but currentQuestion is null. This might indicate an issue with question indexing or an empty question set post-load.");
        setDisplayedAnswers([]);
    } else if (gameStatus !== "playing") {
        // Ensures displayedAnswers are cleared if not in a playing state with a current question
        // (e.g. game over, error, idle, loading)
        setDisplayedAnswers([]); 
    }
  }, [currentQuestion, gameStatus, questions]);


  const handleTimeUp = useCallback(() => {
    if (gameStatus === "playing") {
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
    const optionsForPoll = [...displayedAnswers]; // Use current displayed answers for the poll
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
        // Give correct answer a higher chance, e.g., 40-70%
        correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; 
        results[correctAnswerText] = correctAnswerPercentage;
        totalPercentage -= correctAnswerPercentage;
    }
    
    const otherOptions = optionsForPoll.filter(opt => opt.text !== correctAnswerText);

    otherOptions.forEach((option, index) => {
      if (index === otherOptions.length - 1) { 
        // Assign remaining percentage to the last option
        results[option.text] = Math.max(0, totalPercentage);
      } else {
        // Distribute remaining percentage among other options
        const maxForThisOption = Math.max(0, totalPercentage - (otherOptions.length - 1 - index)); // Ensure non-negative max
        const randomPercentage = Math.floor(Math.random() * (maxForThisOption + 1));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage); // Don't assign more than available
        results[option.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });
    
    // Ensure all polled options have an entry, even if 0%
    optionsForPoll.forEach(opt => {
        if (!(opt.text in results)) {
            results[opt.text] = 0; 
        }
    });

    // Normalize percentages if they don't sum to 100 (due to Math.floor, etc.)
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
        const optionToAdjust = optionsForPoll.find(opt => opt.text === correctAnswerText && isCorrectAnswerDisplayed) || optionsForPoll[0];
        if (optionToAdjust && results[optionToAdjust.text] !== undefined) {
             results[optionToAdjust.text] = Math.max(0, Math.min(100, results[optionToAdjust.text] + (100 - currentSum)));
        }
    }
    // Final check, if still not 100, assign remainder to first option if available
    currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
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
        console.error("Firestore is not initialized.");
        toast({ title: "Error Saving Score", description: "Database connection error.", variant: "destructive" });
        return;
    }
    if (!userId) {
        console.error("User ID is missing, cannot save score.");
        toast({ title: "Error Saving Score", description: "User not authenticated.", variant: "destructive" });
        return;
    }

    const scoreDocRef = doc(firestore, "leaderboard_scores", userId);

    try {
        const docSnap = await getDoc(scoreDocRef);
        let shouldWrite = true;
        let message = "Score saved successfully!";

        if (docSnap.exists()) {
            const existingData = docSnap.data() as FirestoreScoreEntry;
            if (score > existingData.score) {
                message = "New high score saved!";
            } else {
                message = "Your score did not beat your previous high score.";
                shouldWrite = false; 
            }
        }

        if (shouldWrite) {
            const scoreData: Omit<FirestoreScoreEntry, 'id' | 'date' | 'timestampMillis'> & { timestamp: any } = {
                name: name,
                score: score,
                userId: userId,
                timestamp: serverTimestamp() 
            };
            await setDoc(scoreDocRef, scoreData); 
             toast({
                title: "Score Saved!",
                description: message,
            });
        } else {
             toast({
                title: "Score Status",
                description: message,
                duration: 4000,
            });
        }
    } catch (error) {
        console.error("Error saving score to Firestore: ", error);
        toast({
            title: "Error Saving Score",
            description: "Could not save your score to the global leaderboard. Please try again.",
            variant: "destructive",
        });
    }
  }, [score, toast, user]);

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

