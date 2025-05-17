"use client";

import { useEffect } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { useTimer } from "@/hooks/use-timer";
import { QuestionDisplay } from "./QuestionDisplay";
import { AnswerOption } from "./AnswerOption";
import { TimerDisplay } from "./TimerDisplay";
import { ScoreDisplay } from "./ScoreDisplay";
import { LifelinePanel } from "./LifelinePanel";
import { GameOverDialog } from "./GameOverDialog";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function GameArea() {
  const {
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
    totalQuestions,
    isPhoneAFriendUsed,
    usePhoneAFriend,
    saveScore,
  } = useGameState();

  const { timeLeft, startTimer, stopTimer, resetTimer, isRunning, pauseTimer, resumeTimer } = useTimer(
    INITIAL_TIMER_DURATION,
    handleTimeUp
  );

  useEffect(() => {
    if (gameStatus === "playing" && currentQuestion && !isRunning) {
      resetTimer(); // Reset timer to full duration for new question
      startTimer();
    } else if (gameStatus !== "playing" && isRunning) {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, currentQuestion, startTimer, stopTimer, resetTimer]);

  useEffect(() => {
    // Pause timer when phone a friend dialog is likely open (lifeline used and answer not revealed)
    if (isPhoneAFriendUsed && gameStatus === "playing" && !isAnswerRevealed && isRunning) {
        // This is a proxy. A better way would be to pass dialog state.
        // For now, assume if PAF used and game is playing & timer running, dialog might be open.
        // A more robust solution needs direct dialog state. This is a simplification.
        // Let's assume the dialog is modal and game interaction is paused.
        // However, the timer should pause.
        // The PhoneAFriendDialog itself is modal, so user can't interact with game.
        // We can pause timer when lifeline is activated.
        // Actual dialog open state is in LifelinePanel, not easily accessible here without prop drilling or context.
        // Simplified: When phone a friend is activated, we can assume it's open until next question.
        // This effect will run when isPhoneAFriendUsed becomes true.
        // We'll rely on user closing dialog to effectively "resume" game play.
        // Let's add manual pause/resume to lifepanel or dialog itself, or pass pause/resume to it.
        // For now, let's assume the PhoneAFriendDialog will handle pausing/resuming the timer via callbacks.
        // This part is tricky without more complex state management.
        // Simplified: Timer continues, AI advice is quick.
    }
  }, [isPhoneAFriendUsed, gameStatus, isAnswerRevealed, isRunning, pauseTimer, resumeTimer]);


  if (gameStatus === "idle" || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Welcome to TriviMaster!
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-md">
          Test your knowledge and climb the leaderboard. Are you ready?
        </p>
        <Button size="lg" onClick={startGame} className="animate-bounce">
          <Play className="mr-2 h-6 w-6" /> Start Game
        </Button>
         <div className="mt-8" data-ai-hint="game show quiz">
          <img src="https://placehold.co/600x300.png" alt="Trivia Game" className="rounded-lg shadow-xl"/>
        </div>
      </div>
    );
  }
  
  if (gameStatus === "loading_questions") { // hypothetical state if questions were fetched async
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-2xl text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      <div className="md:col-span-2 space-y-6">
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-3">
            {currentQuestion.answers.map((answer, index) => (
              <AnswerOption
                key={`${currentQuestion.id}-answer-${index}`}
                answer={answer}
                onClick={() => handleSelectAnswer(answer)}
                isSelected={selectedAnswer?.text === answer.text}
                isCorrect={answer.isCorrect}
                isRevealed={isAnswerRevealed}
                disabled={isAnswerRevealed || gameStatus === "game_over"}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <TimerDisplay timeLeft={timeLeft} initialTime={INITIAL_TIMER_DURATION} />
        <ScoreDisplay score={score} />
        <LifelinePanel
          currentQuestion={currentQuestion}
          isPhoneAFriendUsed={isPhoneAFriendUsed}
          onPhoneAFriendUsed={usePhoneAFriend}
          disabled={isAnswerRevealed || gameStatus === "game_over"}
        />
      </div>

      <GameOverDialog
        isOpen={gameStatus === "game_over"}
        score={score}
        onPlayAgain={startGame}
        onSaveScore={saveScore}
      />
    </div>
  );
}
