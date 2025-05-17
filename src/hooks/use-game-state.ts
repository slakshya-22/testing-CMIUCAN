"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry } from '@/lib/types';
import { TRIVIA_QUESTIONS } from '@/lib/game-data';
import { useToast } from '@/hooks/use-toast';

const INITIAL_TIMER_DURATION = 30; // seconds

export type GameStatus = "idle" | "playing" | "answered" | "game_over";

export function useGameState() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerType | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [isPhoneAFriendUsed, setIsPhoneAFriendUsed] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex] || null;

  const shuffleArray = <T,>(array: T[]): T[] => {
    // Fisher-Yates shuffle
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  const startGame = useCallback(() => {
    const shuffledQuestions = shuffleArray(TRIVIA_QUESTIONS);
    const questionsWithShuffledAnswers = shuffledQuestions.map(q => ({
        ...q,
        answers: shuffleArray(q.answers)
    }));
    setQuestions(questionsWithShuffledAnswers);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setGameStatus("playing");
    setIsPhoneAFriendUsed(false);
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
        variant: "default",
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
    
    // Automatically move to next question or end game after a delay
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
  }, []);

  const saveScore = useCallback((name: string) => {
    const newScoreEntry: ScoreEntry = {
      id: new Date().toISOString(),
      name,
      score,
      date: new Date().toLocaleDateString(),
    };
    const highScores = JSON.parse(localStorage.getItem("triviMasterHighScores") || "[]") as ScoreEntry[];
    highScores.push(newScoreEntry);
    highScores.sort((a, b) => b.score - a.score); // Sort descending
    localStorage.setItem("triviMasterHighScores", JSON.stringify(highScores.slice(0, 10))); // Keep top 10
    
    toast({
      title: "Score Saved!",
      description: `${name}, your score of ${score} has been saved.`,
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
    isPhoneAFriendUsed,
    usePhoneAFriend,
    saveScore,
  };
}
