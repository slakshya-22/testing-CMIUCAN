
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry, AudiencePollResults } from '@/lib/types';
import { KBC_POINTS } from '@/lib/game-data'; 
import { useToast } from '@/hooks/use-toast';
import { generateTriviaQuestions, type GenerateTriviaQuestionsInput } from '@/ai/flows/generate-trivia-questions-flow';

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

  const currentQuestion = questions[currentQuestionIndex] || null;

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion) {
        setDisplayedAnswers(shuffleArray(nextQuestion.answers));
      } else {
        setDisplayedAnswers([]);
      }
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameStatus("playing");
      setAudiencePollResults(null); 
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
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };
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
      console.error("Failed to generate/load trivia questions (client-side catch):", error);
      let displayErrorMessage = "Could not generate new trivia questions. Please try again.";
      
      if (error instanceof Error && error.message) {
        displayErrorMessage = error.message;
      } else if (typeof error === 'string') {
        displayErrorMessage = error;
      }

      if (displayErrorMessage.includes("An error occurred in the Server Components render") || 
          displayErrorMessage.includes("digest property is included on this error instance") ||
          displayErrorMessage.toLowerCase().includes("failed to fetch")) { // Added check for generic fetch failure
        displayErrorMessage = "The AI failed to generate questions due to a server error. Please check server logs for details and try again.";
      }
      
      toast({
        title: "Error Loading Questions",
        description: displayErrorMessage,
        variant: "destructive",
        duration: 10000, // Increased duration for error message
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
    setDisplayedAnswers([]);
    loadQuestions(mode, category);
  }, [loadQuestions]);
  
  useEffect(() => {
    if (currentQuestion) {
        setDisplayedAnswers(shuffleArray(currentQuestion.answers));
    } else if (gameStatus === "playing" && questions.length > 0 && !currentQuestion) {
        console.warn("[useGameState] Game is 'playing' but currentQuestion is null. This might indicate an issue with question indexing or an empty question set post-load.");
        // Potentially set to error state or re-evaluate.
        // For now, ensure displayedAnswers is empty if no currentQuestion
        setDisplayedAnswers([]);
    } else {
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

    const results: AudiencePollResults = {};
    const optionsForPoll = [...displayedAnswers]; // Use current displayed answers for the poll
    const correctAnswerInFullSet = currentQuestion.answers.find(a => a.isCorrect);
    
    if (!correctAnswerInFullSet) { 
        toast({ title: "Audience Poll Error", description: "Could not determine correct answer for poll.", variant: "destructive"});
        return;
    }
    const correctAnswerText = correctAnswerInFullSet.text;

    let totalPercentage = 100;
    // The correct answer (if present in current optionsForPoll) gets a higher chance
    const isCorrectAnswerDisplayed = optionsForPoll.some(opt => opt.text === correctAnswerText);
    let correctAnswerPercentage = 0;

    if (isCorrectAnswerDisplayed) {
        correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; // 40% to 70% for the correct answer
        results[correctAnswerText] = correctAnswerPercentage;
        totalPercentage -= correctAnswerPercentage;
    }
    
    const otherOptions = optionsForPoll.filter(opt => opt.text !== correctAnswerText);

    otherOptions.forEach((option, index) => {
      if (index === otherOptions.length - 1) { 
        results[option.text] = totalPercentage > 0 ? totalPercentage : 0;
      } else {
        // Ensure non-negative maxForThisOption
        const maxForThisOption = Math.max(0, totalPercentage - (otherOptions.length - 1 - index)); 
        const randomPercentage = Math.floor(Math.random() * (maxForThisOption + 1));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage);
        results[option.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });
    
    // Ensure all displayed options have a percentage, even if 0
    optionsForPoll.forEach(opt => {
        if (!(opt.text in results)) {
            results[opt.text] = 0; 
        }
    });

    // Normalize if sum is not 100 due to rounding or if correct answer wasn't in displayed options initially
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && optionsForPoll.length > 0) {
        const optionToAdjust = optionsForPoll.find(opt => opt.text === correctAnswerText && isCorrectAnswerDisplayed) || optionsForPoll[0];
        if (optionToAdjust && results[optionToAdjust.text] !== undefined) {
             results[optionToAdjust.text] = Math.max(0, Math.min(100, results[optionToAdjust.text] + (100 - currentSum)));
        }
    }
    currentSum = Object.values(results).reduce((acc, val) => acc + val, 0); // Recalculate sum
    if (currentSum !== 100 && optionsForPoll.length > 0) { // If still not 100, adjust first option
        const firstKey = optionsForPoll[0].text;
        if (results[firstKey] !== undefined) {
           results[firstKey] = Math.max(0, Math.min(100, results[firstKey] + (100 - currentSum)));
        }
    }


    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    toast({ title: "Audience Poll Used", description: "The audience has cast their votes!"});
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);

  const saveScore = useCallback((name: string) => {
    const localStorageKey = "cashMeIfYouCanHighScores";
    const highScores = JSON.parse(localStorage.getItem(localStorageKey) || "[]") as ScoreEntry[];
    
    const normalizedName = name.trim(); 
    const existingPlayerIndex = highScores.findIndex(entry => entry.name.toLowerCase() === normalizedName.toLowerCase());
    
    if (existingPlayerIndex !== -1) {
      if (score > highScores[existingPlayerIndex].score) {
        highScores[existingPlayerIndex].score = score;
        highScores[existingPlayerIndex].date = new Date().toLocaleDateString();
        toast({
          title: "High Score Updated!",
          description: `${highScores[existingPlayerIndex].name}, your new high score of ${score.toLocaleString()} has been saved.`,
        });
      } else {
         toast({
          title: "Score Not Higher",
          description: `${highScores[existingPlayerIndex].name}, your score of ${score.toLocaleString()} did not beat your current high score of ${highScores[existingPlayerIndex].score.toLocaleString()}. Better luck next time!`,
          duration: 4000,
        });
      }
    } else {
      const newScoreEntry: ScoreEntry = {
        id: new Date().toISOString(),
        name: normalizedName,
        score,
        date: new Date().toLocaleDateString(),
      };
      highScores.push(newScoreEntry);
      toast({
        title: "Score Saved!",
        description: `${normalizedName}, your score of ${score.toLocaleString()} has been saved to the leaderboard.`,
      });
    }

    highScores.sort((a, b) => b.score - a.score); 
    localStorage.setItem(localStorageKey, JSON.stringify(highScores.slice(0, 10))); 
    
  }, [score, toast]);

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
