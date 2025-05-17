
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { Question, Answer as AnswerType, ScoreEntry, AudiencePollResults } from '@/lib/types';
import { KBC_POINTS } from '@/lib/game-data';
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

  const loadQuestions = useCallback(async (mode?: string, category?: string) => {
    setGameStatus("loading_questions");
    try {
      const input: GenerateTriviaQuestionsInput = { 
        numberOfQuestions: TOTAL_QUESTIONS_IN_GAME,
        difficulty: mode !== "Mixed" ? mode : undefined, // Pass difficulty if not "Mixed"
        category: category !== "General Knowledge" ? category : undefined, // Pass category if not "General Knowledge"
      };
      const aiResult = await generateTriviaQuestions(input);
      
      const questionsWithPoints = aiResult.questions.map((q, index) => ({
        ...q,
        points: KBC_POINTS[index] || KBC_POINTS[KBC_POINTS.length - 1], 
        id: q.id || `gen_q_${index}_${Date.now()}` 
      }));

      setQuestions(questionsWithPoints);
      if (questionsWithPoints.length > 0) {
        setGameStatus("playing");
      } else {
        throw new Error("No questions were generated.");
      }
    } catch (error) {
      console.error("Failed to generate trivia questions:", error);
      toast({
        title: "Error Loading Questions",
        description: "Could not generate new trivia questions. Please try refreshing or starting a new game later.",
        variant: "destructive",
      });
      setQuestions([]); 
      setGameStatus("idle"); 
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
    } else {
        setDisplayedAnswers([]); // Clear if no current question
    }
  }, [currentQuestion]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      // Displayed answers will be reset by the useEffect watching currentQuestion
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
    const correctAnswer = currentQuestion.answers.find(a => a.isCorrect);
    
    // Filter from the *original* question's answers to avoid issues if lifelines are combined
    const incorrectAnswersFromOriginal = currentQuestion.answers.filter(a => !a.isCorrect); 
    
    if (correctAnswer && incorrectAnswersFromOriginal.length > 0) {
      const incorrectToKeep = shuffleArray(incorrectAnswersFromOriginal)[0];
      const newDisplayedAnswers = shuffleArray([correctAnswer, incorrectToKeep]);
      setDisplayedAnswers(newDisplayedAnswers);
    }
    setIsFiftyFiftyUsed(true);
    toast({ title: "50:50 Used", description: "Two incorrect options have been removed!"});
  }, [currentQuestion, isFiftyFiftyUsed, displayedAnswers, toast]);

  const useAudiencePoll = useCallback(() => {
    if (!currentQuestion || isAudiencePollUsed) return;

    const results: AudiencePollResults = {};
    const correctAnswerObj = currentQuestion.answers.find(a => a.isCorrect);
    
    if (!correctAnswerObj) { 
        toast({ title: "Audience Poll Error", description: "Could not determine correct answer for poll.", variant: "destructive"});
        return;
    }
    const correctAnswerText = correctAnswerObj.text;

    let totalPercentage = 100;
    const correctAnswerPercentage = Math.floor(Math.random() * 31) + 40; // 40% to 70%

    results[correctAnswerText] = correctAnswerPercentage;
    totalPercentage -= correctAnswerPercentage;
    
    const otherDisplayedOptions = displayedAnswers.filter(a => a.text !== correctAnswerText);
    
    if (otherDisplayedOptions.length === 0 && totalPercentage > 0) {
        results[correctAnswerText] += totalPercentage; 
        totalPercentage = 0;
    } else if (otherDisplayedOptions.length > 0) {
        otherDisplayedOptions.forEach((answer, index) => {
          if (index === otherDisplayedOptions.length - 1) { 
            results[answer.text] = totalPercentage > 0 ? totalPercentage : 0;
          } else {
            const maxForThisOption = totalPercentage - (otherDisplayedOptions.length - 1 - index); 
            const randomPercentage = Math.floor(Math.random() * Math.max(0, maxForThisOption));
            const assignedPercentage = Math.min(randomPercentage, totalPercentage);
            results[answer.text] = assignedPercentage;
            totalPercentage -= assignedPercentage;
          }
        });

        let currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
        if (currentSum !== 100 && results[correctAnswerText] !== undefined) {
            results[correctAnswerText] += (100 - currentSum);
            results[correctAnswerText] = Math.max(0, results[correctAnswerText]); 
        } else if (currentSum !== 100 && otherDisplayedOptions.length > 0 && results[otherDisplayedOptions[0].text] !== undefined) {
            results[otherDisplayedOptions[0].text] = (results[otherDisplayedOptions[0].text] || 0) + (100-currentSum);
            results[otherDisplayedOptions[0].text] = Math.max(0, results[otherDisplayedOptions[0].text] || 0);
        }
        Object.keys(results).forEach(key => {
            if (results[key] > 100) results[key] = 100;
            if (results[key] < 0) results[key] = 0;
        });
        currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
        if (currentSum !== 100 && currentSum > 0) { 
            const scaleFactor = 100 / currentSum;
            Object.keys(results).forEach(key => {
                results[key] = Math.round(results[key] * scaleFactor);
            });
            currentSum = Object.values(results).reduce((acc, val) => acc + val, 0);
             if (currentSum !== 100 && results[correctAnswerText] !== undefined) {
                 results[correctAnswerText] += (100 - currentSum);
             } else if (currentSum !== 100 && otherDisplayedOptions.length > 0 && results[otherDisplayedOptions[0].text] !== undefined){
                  results[otherDisplayedOptions[0].text] += (100 - currentSum);
             }
        }
    }

    setAudiencePollResults(results);
    setIsAudiencePollUsed(true);
    toast({ title: "Audience Poll Used", description: "The audience has cast their votes!"});
  }, [currentQuestion, isAudiencePollUsed, displayedAnswers, toast]);

  const saveScore = useCallback((name: string) => {
    const localStorageKey = "cashMeIfYouCanHighScores";
    const highScores = JSON.parse(localStorage.getItem(localStorageKey) || "[]") as ScoreEntry[];
    
    const normalizedName = name.trim(); // Keep original casing for display but use toLowerCase for comparison if needed
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
    goToNextQuestion,
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
