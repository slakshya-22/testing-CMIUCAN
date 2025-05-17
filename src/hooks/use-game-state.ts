
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
      // Shuffle answers for display when a new question is set or 50:50 is not active for it
      if (!isFiftyFiftyUsed || displayedAnswers.length !== 2) { // Re-shuffle if not 50:50 or if 50:50 was for a previous q
         setDisplayedAnswers(shuffleArray(currentQuestion.answers));
      }
    }
  }, [currentQuestion, isFiftyFiftyUsed]); // Add isFiftyFiftyUsed to deps
  
  const startGame = useCallback(() => {
    setGameStatus("loading_questions");
    // Use the first TOTAL_QUESTIONS_IN_GAME questions, already ordered by difficulty
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
    // displayedAnswers will be set by the useEffect hook when currentQuestion changes
  }, []);

  const handleSelectAnswer = useCallback((answer: AnswerType) => {
    if (isAnswerRevealed || gameStatus !== "playing") return;
    setSelectedAnswer(answer);
    setIsAnswerRevealed(true);
    setGameStatus("answered");

    if (answer.isCorrect) {
      setScore((prevScore) => prevScore + (currentQuestion?.points || 0));
      toast({
        title: "Correct!",
        description: `You won ${currentQuestion?.points || 0} points.`,
        variant: "default",
        duration: 2000,
      });
    } else {
      toast({
        title: "Incorrect!",
        description: `The correct answer was: "${currentQuestion?.answers.find(a => a.isCorrect)?.text}". You walk away with the last checkpoint score.`,
        variant: "destructive",
        duration: 4000,
      });
    }
    
    setTimeout(() => {
      if (!answer.isCorrect) {
        // Implement KBC-style checkpoint logic for score retention later if needed
        setGameStatus("game_over");
      } else {
        goToNextQuestion();
      }
    }, answer.isCorrect ? 2000 : 4000);

  }, [isAnswerRevealed, gameStatus, currentQuestion, toast]);


  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameStatus("playing");
      setAudiencePollResults(null); 
      // displayedAnswers will be re-shuffled by useEffect due to currentQuestion change
      // 50:50 is per question, so effectively reset by new question / full answer set
    } else {
      toast({
        title: "Congratulations!",
        description: `You've answered all ${questions.length} questions and won ${score + (currentQuestion?.points || 0)} points!`,
        variant: "default", // Success variant
        duration: 5000,
      });
      setGameStatus("game_over");
    }
  }, [currentQuestionIndex, questions, score, currentQuestion, toast]);

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
    // Actual AI call happens in PhoneAFriendDialog
  }, []);

  const useFiftyFifty = useCallback(() => {
    if (!currentQuestion || isFiftyFiftyUsed || displayedAnswers.length === 2) return;

    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect);
    const incorrectAnswers = currentQuestion.answers.filter(a => !a.isCorrect);
    
    if (correctAnswer && incorrectAnswers.length > 0) {
      // Shuffle incorrect answers and pick one
      const randomIncorrectAnswer = shuffleArray(incorrectAnswers)[0];
      // Set displayed answers to only these two, shuffled
      const newDisplayedAnswers = shuffleArray([correctAnswer, randomIncorrectAnswer]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, displayedAnswers, toast]); // added displayedAnswers to deps

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: AudiencePollResults = {};
    const correctAnswerText = currentQuestion.answers.find(a => a.isCorrect)?.text;
    let totalPercentage = 100;
    
    // Simulate audience poll: give correct answer a higher chance (e.g., 40-70%)
    const correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; // 40 to 70

    if (correctAnswerText) {
      results[correctAnswerText] = correctAnswerPercentage;
      totalPercentage -= correctAnswerPercentage;
    }
    
    // Distribute remaining percentage among other options
    const otherOptions = displayedAnswers.filter(a => a.text !== correctAnswerText);
    otherOptions.forEach((answer, index) => {
      if (index === otherOptions.length - 1) { // Last incorrect answer gets remaining percentage
        results[answer.text] = totalPercentage > 0 ? totalPercentage : 0;
      } else {
        // Ensure percentage is positive and not exceeding remaining total
        const maxPossible = totalPercentage - (otherOptions.length - 1 - index); // ensure others can get at least 1%
        const randomPercentage = Math.floor(Math.random() * Math.max(1, maxPossible / (otherOptions.length - index)));
        const assignedPercentage = Math.min(randomPercentage, totalPercentage);
        results[answer.text] = assignedPercentage;
        totalPercentage -= assignedPercentage;
      }
    });
    
    // Ensure sum is 100, adjust if needed (e.g., due to rounding or if correct answer wasn't in displayed for some reason)
    let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (currentSum !== 100 && correctAnswerText && results[correctAnswerText]) {
        results[correctAnswerText] += (100 - currentSum);
        // Ensure no negative percentages from adjustment
        results[correctAnswerText] = Math.max(0, results[correctAnswerText]); 
        // Re-normalize if adjustment made it > 100
        currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
        if (currentSum > 100 && results[correctAnswerText]) {
            results[correctAnswerText] -= (currentSum - 100);
        }
    } else if (currentSum !== 100 && otherOptions.length > 0) {
        // Fallback: distribute to the first other option if correct answer is not available for adjustment
        results[otherOptions[0].text] = (results[otherOptions[0].text] || 0) + (100-currentSum);
        results[otherOptions[0].text] = Math.max(0, results[otherOptions[0].text] || 0);
    }


    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    // Toast for audience poll is usually shown when dialog opens or after results.
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);


  const saveScore = useCallback((name: string) => {
    const newScoreEntry: ScoreEntry = {
      id: new Date().toISOString(),
      name,
      score,
      date: new Date().toLocaleDateString(),
    };
    // Updated localStorage key
    const highScores = JSON.parse(localStorage.getItem("cashMeIfYouCanHighScores") || "[]") as ScoreEntry[];
    highScores.push(newScoreEntry);
    highScores.sort((a, b) => b.score - a.score);
    localStorage.setItem("cashMeIfYouCanHighScores", JSON.stringify(highScores.slice(0, 10)));
    
    toast({
      title: "Score Saved!",
      description: `${name}, your score of ${score} has been saved to the "Cash Me If You Can" leaderboard.`,
    });
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
    totalQuestions: questions.length, // This will be TOTAL_QUESTIONS_IN_GAME
    
    // Lifelines
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

    