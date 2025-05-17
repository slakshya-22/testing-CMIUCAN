
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
import { Loader2, Play, RefreshCw } from "lucide-react"; // Added RefreshCw for play again
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
    isFiftyFiftyUsed,
    useFiftyFifty,
    isAudiencePollUsed,
    useAudiencePoll,
    audiencePollResults,
    displayedAnswers,
    saveScore,
  } = useGameState();

  const { timeLeft, startTimer, stopTimer, resetTimer, isRunning } = useTimer(
    INITIAL_TIMER_DURATION,
    handleTimeUp
  );

  useEffect(() => {
    if (gameStatus === "playing" && currentQuestion && !isAnswerRevealed) { // Only start/reset timer if not already answered
      if (!isRunning) { // Only start if not already running for current question
        resetTimer();
        startTimer();
      }
    } else if ((gameStatus !== "playing" || isAnswerRevealed) && isRunning) {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, currentQuestion, isAnswerRevealed, startTimer, stopTimer, resetTimer]); // Added isAnswerRevealed

  if (gameStatus === "idle") { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 sm:p-6 md:p-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
          Welcome to Cash Me If You Can!
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 sm:mb-12 max-w-md md:max-w-lg">
          Inspired by KBC, test your knowledge and win big. Are you ready to face the hot seat?
        </p>
        <Button 
          size="lg" 
          onClick={startGame} 
          className="animate-bounce shadow-lg hover:shadow-primary/50 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5"
        >
          <Play className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> Start Game
        </Button>
         <div className="mt-10 sm:mt-12" data-ai-hint="game show stage spotlight">
          <img 
            src="https://placehold.co/600x300.png" 
            alt="Cash Me If You Can Game Stage" 
            className="rounded-lg shadow-2xl border-2 border-primary/30 w-full max-w-lg md:max-w-xl lg:max-w-2xl"
          />
        </div>
      </div>
    );
  }
  
  if (gameStatus === "loading_questions" || (gameStatus === "playing" && !currentQuestion)) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl sm:text-2xl text-muted-foreground mt-4">Loading questions, please wait...</p>
      </div>
    );
  }

  if (!currentQuestion && gameStatus !== "game_over") { // Fallback for unexpected missing question
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-destructive" />
        <p className="ml-4 text-xl sm:text-2xl text-destructive-foreground mt-4">Error loading question. Try starting again.</p>
        <Button onClick={startGame} className="mt-8">
          <RefreshCw className="mr-2 h-5 w-5" /> Restart Game
        </Button>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 p-2 sm:p-4 md:p-0">
      <div className="md:col-span-8 space-y-6">
        {currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
          />
        )}
        <Card className="shadow-xl bg-card/90 backdrop-blur-sm border-primary/20 rounded-xl">
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {displayedAnswers.map((answer, index) => (
              <AnswerOption
                key={`${currentQuestion?.id}-answer-${answer.text}-${index}`} // ensure unique key
                answer={answer}
                onClick={() => currentQuestion && handleSelectAnswer(answer)}
                isSelected={selectedAnswer?.text === answer.text}
                isCorrect={answer.isCorrect}
                isRevealed={isAnswerRevealed}
                disabled={isAnswerRevealed || gameStatus === "game_over" || gameStatus === "answered"}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-4 space-y-6">
        <TimerDisplay timeLeft={timeLeft} initialTime={INITIAL_TIMER_DURATION} />
        <ScoreDisplay score={score} />
        {currentQuestion && (
          <LifelinePanel
            currentQuestion={currentQuestion}
            isPhoneAFriendUsed={isPhoneAFriendUsed}
            onPhoneAFriendUsed={usePhoneAFriend}
            isFiftyFiftyUsed={isFiftyFiftyUsed}
            onFiftyFiftyUsed={useFiftyFifty}
            isAudiencePollUsed={isAudiencePollUsed}
            onAudiencePollUsed={useAudiencePoll}
            audiencePollResults={audiencePollResults}
            disabled={isAnswerRevealed || gameStatus === "game_over" || gameStatus === "answered"}
          />
        )}
      </div>

      <GameOverDialog
        isOpen={gameStatus === "game_over"}
        score={score}
        onPlayAgain={startGame}
        onSaveScore={saveScore}
        gameName="Cash Me If You Can"
      />
    </div>
  );
}

    