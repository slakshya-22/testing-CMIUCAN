
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry, AudiencePollResults } from '@/lib/types';
import { KBC_POINTS } from '@/lib/game-data'; // KBC_POINTS will still be used
import { useToast } from '@/hooks/use-toast';
import { generateTriviaQuestions, type GenerateTriviaQuestionsInput } from '@/ai/flows/generate-trivia-questions-flow';

const INITIAL_TIMER_DURATION = 30; // seconds
const TOTAL_QUESTIONS_IN_GAME = 15;

export type GameStatus = "idle" | "loading_questions" | "playing" | "answered" | "game_over";

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

  const loadQuestions = useCallback(async () => {
    setGameStatus("loading_questions");
    try {
      const input: GenerateTriviaQuestionsInput = { numberOfQuestions: TOTAL_QUESTIONS_IN_GAME };
      const aiResult = await generateTriviaQuestions(input);
      
      // Assign KBC points sequentially
      const questionsWithPoints = aiResult.questions.map((q, index) => ({
        ...q,
        points: KBC_POINTS[index] || KBC_POINTS[KBC_POINTS.length - 1], // Fallback to last point value if not enough points defined
        // Ensure IDs are unique if AI doesn't provide them or they clash
        id: q.id || `gen_q_${index}_${Date.now()}` 
      }));

      setQuestions(questionsWithPoints);
      setGameStatus("playing");
    } catch (error) {
      console.error("Failed to generate trivia questions:", error);
      toast({
        title: "Error Loading Questions",
        description: "Could not generate new trivia questions. Please try starting a new game.",
        variant: "destructive",
      });
      // Fallback to idle or an error state, allow user to restart
      setQuestions([]); // Clear any partial data
      setGameStatus("idle"); // Or a new "error_loading" state if you want specific UI
    }
  }, [toast]);

  const startGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setIsPhoneAFriendUsed(false);
    setIsFiftyFiftyUsed(false);
    setIsAudiencePollUsed(false);
    setAudiencePollResults(null);
    loadQuestions(); // Load questions from AI
  }, [loadQuestions]);
  
  useEffect(() => {
    if (currentQuestion) {
        // Always reset displayed answers from the full set of the current question
        setDisplayedAnswers(shuffleArray(currentQuestion.answers));
    }
  }, [currentQuestion]);


  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameStatus("playing");
      setAudiencePollResults(null); 
      // displayedAnswers will be reset by the useEffect hook for currentQuestion change
    } else {
      toast({
        title: "Congratulations!",
        description: `You've answered all ${questions.length} questions and your final score is ${score} points!`,
        variant: "default", 
        duration: 5000,
      });
      setGameStatus("game_over");
    }
  }, [currentQuestionIndex, questions.length, score, toast]);

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
        description: `You won ${currentQuestion?.points || 0} points.`,
        variant: "default",
        duration: 2000,
      });
    } else {
      toast({
        title: "Incorrect!",
        description: `The correct answer was: "${currentQuestion?.answers.find(a => a.isCorrect)?.text}". You walk away with ${score} points.`,
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
    if (!currentQuestion || isFiftyFiftyUsed ) {
      return;
    }
    const originalAnswers = currentQuestion.answers; // Use full original set
    const correctAnswer = originalAnswers.find(a => a.isCorrect);
    const incorrectAnswers = originalAnswers.filter(a => !a.isCorrect);
    
    if (correctAnswer && incorrectAnswers.length > 0) {
      const randomIncorrectAnswer = shuffleArray(incorrectAnswers)[0];
      const newDisplayedAnswers = shuffleArray([correctAnswer, randomIncorrectAnswer]);
      setDisplayedAnswers(newDisplayedAnswers); // This now only affects the current question's display
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: AudiencePollResults = {};
    const correctAnswerText = currentQuestion.answers.find(a => a.isCorrect)?.text;
    let totalPercentage = 100;
    
    const correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; 

    if (correctAnswerText) {
      results[correctAnswerText] = correctAnswerPercentage;
      totalPercentage -= correctAnswerPercentage;
    }
    
    const otherOptions = displayedAnswers.filter(a => a.text !== correctAnswerText); // Use currently displayed answers for poll
    otherOptions.forEach((answer, index) => {
      if (index === otherOptions.length - 1) { 
        results[answer.text] = totalPercentage > 0 ? totalPercentage : 0;
      } else {
        const maxPossible = totalPercentage - (otherOptions.length - 1 - index);
        const randomPercentage = Math.floor(Math.random() * Math.max(1, maxPossible / (otherOptions.length - index)));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage);
        results[answer.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });
    
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && correctAnswerText && results[correctAnswerText] !== undefined) {
        results[correctAnswerText] += (100 - currentSum);
        results[correctAnswerText] = Math.max(0, results[correctAnswerText]);
        currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
        if (currentSum > 100 && results[correctAnswerText] !== undefined) {
            results[correctAnswerText] -= (currentSum - 100);
        }
    } else if (currentSum !== 100 && otherOptions.length > 0 && results[otherOptions[0].text] !== undefined) {
        results[otherOptions[0].text] = (results[otherOptions[0].text] || 0) + (100-currentSum);
        results[otherOptions[0].text] = Math.max(0, results[otherOptions[0].text] || 0);
    }

    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    toast({ title: "Audience Poll Used", description: "The audience has cast their votes!"});
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);

  const saveScore = useCallback((name: string) => {
    const localStorageKey = "cashMeIfYouCanHighScores";
    const highScores = JSON.parse(localStorage.getItem(localStorageKey) || "[]") as ScoreEntry[];
    
    const normalizedName = name.trim().toLowerCase();
    const existingPlayerIndex = highScores.findIndex(entry => entry.name.toLowerCase() === normalizedName);
    
    if (existingPlayerIndex !== -1) {
      if (score > highScores[existingPlayerIndex].score) {
        highScores[existingPlayerIndex].score = score;
        highScores[existingPlayerIndex].date = new Date().toLocaleDateString();
        toast({
          title: "High Score Updated!",
          description: `${highScores[existingPlayerIndex].name}, your new high score of ${score} has been saved.`,
        });
      } else {
         toast({
          title: "Score Not Higher",
          description: `${highScores[existingPlayerIndex].name}, your score of ${score} did not beat your current high score of ${highScores[existingPlayerIndex].score}. Better luck next time!`,
          duration: 4000,
        });
      }
    } else {
      const newScoreEntry: ScoreEntry = {
        id: new Date().toISOString(),
        name: name.trim(),
        score,
        date: new Date().toLocaleDateString(),
      };
      highScores.push(newScoreEntry);
      toast({
        title: "Score Saved!",
        description: `${name.trim()}, your score of ${score} has been saved to the "Cash Me IfYou Can" leaderboard.`,
      });
    }

    highScores.sort((a, b) => b.score - a.score);
    localStorage.setItem(localStorageKey, JSON.stringify(highScores.slice(0, 10)));
    
  }, [score, toast]);

  useEffect(() => {
    if (gameStatus === "idle") {
        startGame();
    }
  }, [gameStatus, startGame]);

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
    goToNextQuestion,
    handleTimeUp,
    INITIAL_TIMER_DURATION,
    totalQuestions: questions.length > 0 ? questions.length : TOTAL_QUESTIONS_IN_GAME, // Show total AI questions or planned total
    
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
