
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry, AudiencePollResults } from '@/lib/types';
import { TRIVIA_QUESTIONS } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';

const INITIAL_TIMER_DURATION = 30; // seconds
const TOTAL_QUESTIONS_IN_GAME = 15;

export type GameStatus = "idle" | "loading_questions" | "playing" | "answered" | "game_over";

// Helper function to shuffle array (Fisher-Yates)
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
  
  // Lifeline states
  const [isPhoneAFriendUsed, setIsPhoneAFriendUsed] = useState(false);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [isAudiencePollUsed, setIsAudiencePollUsed] = useState(false);
  const [audiencePollResults, setAudiencePollResults] = useState<AudiencePollResults | null>(null);
  const [displayedAnswers, setDisplayedAnswers] = useState<AnswerType[]>([]);

  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex] || null;

  useEffect(() => {
    if (currentQuestion) {
      setDisplayedAnswers(shuffleArray(currentQuestion.answers));
    }
  }, [currentQuestion]); 
  
  const startGame = useCallback(() => {
    setGameStatus("loading_questions");
    const gameQuestions = TRIVIA_QUESTIONS.slice(0, TOTAL_QUESTIONS_IN_GAME);
    setQuestions(gameQuestions); 
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setGameStatus("playing");
    setIsPhoneAFriendUsed(false);
    setIsFiftyFiftyUsed(false);
    setIsAudiencePollUsed(false);
    setAudiencePollResults(null);
  }, []);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameStatus("playing");
      setAudiencePollResults(null); 
      // displayedAnswers will be reset by the useEffect hook due to currentQuestion change
      // and 50:50 effect is not carried over.
    } else {
      toast({
        title: "Congratulations!",
        description: `You've answered all ${questions.length} questions and won ${score} points!`, // Score is already updated
        variant: "default", 
        duration: 5000,
      });
      setGameStatus("game_over");
    }
  }, [currentQuestionIndex, questions.length, score, toast]); // Removed currentQuestion from deps as it's not directly used here, points logic is in handleSelectAnswer

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
     // Ensure we are working with the full original set if this is the first time 50:50 is used for this question
    const originalAnswers = currentQuestion.answers;
    const correctAnswer = originalAnswers.find(a => a.isCorrect);
    const incorrectAnswers = originalAnswers.filter(a => !a.isCorrect);
    
    if (correctAnswer && incorrectAnswers.length > 0) {
      // Shuffle incorrect answers and pick one
      const randomIncorrectAnswer = shuffleArray(incorrectAnswers)[0];
      // Combine correct and one random incorrect, then shuffle for display
      const newDisplayedAnswers = shuffleArray([correctAnswer, randomIncorrectAnswer]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: AudiencePollResults = {};
    const correctAnswerText = currentQuestion.answers.find(a => a.isCorrect)?.text;
    let totalPercentage = 100;
    
    // Give correct answer a higher chance (e.g., 40-70%)
    const correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; 

    if (correctAnswerText) {
      results[correctAnswerText] = correctAnswerPercentage;
      totalPercentage -= correctAnswerPercentage;
    }
    
    // Distribute remaining percentage among currently displayed options (could be 2 or 4)
    const otherOptions = displayedAnswers.filter(a => a.text !== correctAnswerText);
    otherOptions.forEach((answer, index) => {
      if (index === otherOptions.length - 1) { 
        // Assign remaining percentage to the last option
        results[answer.text] = totalPercentage > 0 ? totalPercentage : 0;
      } else {
        // Assign a random portion of the remaining percentage
        // Ensure that subsequent options can still get some percentage
        const maxPossible = totalPercentage - (otherOptions.length - 1 - index); // at least 1% for each remaining
        const randomPercentage = Math.floor(Math.random() * Math.max(1, maxPossible / (otherOptions.length - index))); // Avoid getting 0 too easily
        const assignedPercentage = Math.min(randomPercentage, totalPercentage);
        results[answer.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });
    
    // Ensure sum is exactly 100% by adjusting one of the values if needed
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && correctAnswerText && results[correctAnswerText] !== undefined) {
        results[correctAnswerText] += (100 - currentSum);
        results[correctAnswerText] = Math.max(0, results[correctAnswerText]); // Don't go below 0
        // If over 100 after adjustment, try to reduce from the highest other non-correct if possible or correct
        currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
        if (currentSum > 100 && results[correctAnswerText] !== undefined) {
            results[correctAnswerText] -= (currentSum - 100);
        }
    } else if (currentSum !== 100 && otherOptions.length > 0 && results[otherOptions[0].text] !== undefined) {
        // Fallback: adjust the first 'other' option if correct answer was not in the results for some reason
        results[otherOptions[0].text] = (results[otherOptions[0].text] || 0) + (100-currentSum);
        results[otherOptions[0].text] = Math.max(0, results[otherOptions[0].text] || 0);
    }


    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);


  const saveScore = useCallback((name: string) => {
    const localStorageKey = "cashMeIfYouCanHighScores";
    const highScores = JSON.parse(localStorage.getItem(localStorageKey) || "[]") as ScoreEntry[];
    
    const normalizedName = name.trim().toLowerCase();
    const existingPlayerIndex = highScores.findIndex(entry => entry.name.toLowerCase() === normalizedName);
    
    if (existingPlayerIndex !== -1) {
      // Player exists
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
          description: `${highScores[existingPlayerIndex].name}, your score of ${score} did not beat your previous high score of ${highScores[existingPlayerIndex].score}.`,
          duration: 4000,
        });
      }
    } else {
      // New player
      const newScoreEntry: ScoreEntry = {
        id: new Date().toISOString(),
        name: name.trim(), // Save with original casing but use lowercase for comparison
        score,
        date: new Date().toLocaleDateString(),
      };
      highScores.push(newScoreEntry);
      toast({
        title: "Score Saved!",
        description: `${name.trim()}, your score of ${score} has been saved to the "Cash Me If You Can" leaderboard.`,
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
    totalQuestions: questions.length,
    
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

    