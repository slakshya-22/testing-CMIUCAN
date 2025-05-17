"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry, AudiencePollResults } from '@/lib/types';
import { TRIVIA_QUESTIONS } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';

const INITIAL_TIMER_DURATION = 30; // seconds

export type GameStatus = "idle" | "playing" | "answered" | "game_over";

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
      setDisplayedAnswers(shuffleArray(currentQuestion.answers)); // Shuffle answers for display initially
    }
  }, [currentQuestion]);
  
  const startGame = useCallback(() => {
    const shuffledQuestions = shuffleArray(TRIVIA_QUESTIONS);
    // No need to shuffle answers here if displayedAnswers handles it per question
    setQuestions(shuffledQuestions); 
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
        description: `You earned ${currentQuestion?.points || 0} points.`,
        variant: "default", // Consider a 'success' variant if defined in theme/toast
        duration: 2000,
      });
    } else {
      toast({
        title: "Incorrect!",
        description: `The correct answer was ${currentQuestion?.answers.find(a => a.isCorrect)?.text}.`,
        variant: "destructive",
        duration: 3000,
      });
    }
    
    setTimeout(() => {
      if (!answer.isCorrect) {
        setGameStatus("game_over");
      } else {
        goToNextQuestion();
      }
    }, answer.isCorrect ? 2000 : 3000);

  }, [isAnswerRevealed, gameStatus, currentQuestion, toast]);


  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setGameStatus("playing");
      // Reset displayed answers for the new question (will be set by useEffect)
      // fifty-fifty is per question, so no need to reset its state here unless we want to visually clear it.
      // audiencePollResults are also per question.
      setAudiencePollResults(null); 
    } else {
      setGameStatus("game_over");
    }
  }, [currentQuestionIndex, questions.length]);

  const handleTimeUp = useCallback(() => {
    if (gameStatus === "playing") {
      toast({
        title: "Time's Up!",
        description: "You ran out of time for this question.",
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
    if (!currentQuestion || isFiftyFiftyUsed) return;

    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect);
    const incorrectAnswers = currentQuestion.answers.filter(a => !a.isCorrect);
    
    if (correctAnswer && incorrectAnswers.length > 0) {
      const randomIncorrectAnswer = shuffleArray(incorrectAnswers)[0];
      const newDisplayedAnswers = shuffleArray([correctAnswer, randomIncorrectAnswer]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: AudiencePollResults = {};
    const correctAnswerIndex = currentQuestion.answers.findIndex(a => a.isCorrect);
    let totalPercentage = 100;
    
    // Give correct answer a higher chance (e.g., 40-70%)
    const correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; // 40 to 70
    results[currentQuestion.answers[correctAnswerIndex].text] = correctAnswerPercentage;
    totalPercentage -= correctAnswerPercentage;

    const otherAnswers = currentQuestion.answers.filter((_, index) => index !== correctAnswerIndex);
    
    otherAnswers.forEach((answer, index) => {
      if (index === otherAnswers.length - 1) { // Last incorrect answer gets remaining percentage
        results[answer.text] = totalPercentage;
      } else {
        const randomPercentage = Math.floor(Math.random() * (totalPercentage / (otherAnswers.length - index))) + 1;
        results[answer.text] = Math.min(randomPercentage, totalPercentage);
        totalPercentage -= results[answer.text];
      }
    });
    
    // Ensure sum is 100, distribute any rounding error to the correct answer if possible
    const sum = Object.values(results).reduce((acc, val) => acc + val, 0);
    if (sum !== 100) {
        results[currentQuestion.answers[correctAnswerIndex].text] += (100 - sum);
    }

    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    // Toast is usually shown when dialog opens or after results.
    // The dialog itself will handle the display.
  }, [currentQuestion, isAudiencePollUsed]);


  const saveScore = useCallback((name: string) => {
    const newScoreEntry: ScoreEntry = {
      id: new Date().toISOString(),
      name,
      score,
      date: new Date().toLocaleDateString(),
    };
    const highScores = JSON.parse(localStorage.getItem("cashMeIfYouCanHighScores") || "[]") as ScoreEntry[];
    highScores.push(newScoreEntry);
    highScores.sort((a, b) => b.score - a.score);
    localStorage.setItem("cashMeIfYouCanHighScores", JSON.stringify(highScores.slice(0, 10)));
    
    toast({
      title: "Score Saved!",
      description: `${name}, your score of ${score} has been saved to "Cash Me If You Can" leaderboard.`,
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
    totalQuestions: questions.length,
    
    // Lifelines
    isPhoneAFriendUsed,
    usePhoneAFriend,
    isFiftyFiftyUsed,
    useFiftyFifty,
    isAudiencePollUsed,
    useAudiencePoll,
    audiencePollResults,
    displayedAnswers, // Use this for rendering answer options
    saveScore,
  };
}
