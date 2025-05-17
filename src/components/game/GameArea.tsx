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
    // Lifelines
    isPhoneAFriendUsed,
    usePhoneAFriend,
    isFiftyFiftyUsed,
    useFiftyFifty,
    isAudiencePollUsed,
    useAudiencePoll,
    audiencePollResults,
    displayedAnswers, // Use this instead of currentQuestion.answers directly for options
    saveScore,
  } = useGameState();

  const { timeLeft, startTimer, stopTimer, resetTimer, isRunning } = useTimer(
    INITIAL_TIMER_DURATION,
    handleTimeUp
  );

  useEffect(() => {
    if (gameStatus === "playing" && currentQuestion && !isRunning) {
      resetTimer();
      startTimer();
    } else if (gameStatus !== "playing" && isRunning) {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, currentQuestion, startTimer, stopTimer, resetTimer]);

  if (gameStatus === "idle") { // Can show a loading or initial screen
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
          Welcome to Cash Me If You Can!
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-md">
          Inspired by KBC, test your knowledge and win big. Are you ready to face the hot seat?
        </p>
        <Button size="lg" onClick={startGame} className="animate-bounce shadow-lg hover:shadow-primary/50">
          <Play className="mr-2 h-6 w-6" /> Start Game
        </Button>
         <div className="mt-10" data-ai-hint="game show stage">
          <img src="https://placehold.co/600x300.png" alt="Cash Me If You Can Game" className="rounded-lg shadow-2xl border-2 border-primary/30"/>
        </div>
      </div>
    );
  }
  
  if (gameStatus === "loading_questions" || !currentQuestion) { 
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
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-primary/20">
          <CardContent className="p-6 space-y-3">
            {displayedAnswers.map((answer, index) => ( // Use displayedAnswers
              <AnswerOption
                key={`${currentQuestion.id}-answer-${index}-${answer.text}`} // more unique key
                answer={answer}
                onClick={() => handleSelectAnswer(answer)}
                isSelected={selectedAnswer?.text === answer.text}
                isCorrect={answer.isCorrect} // The original correctness is still needed
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
          isFiftyFiftyUsed={isFiftyFiftyUsed}
          onFiftyFiftyUsed={useFiftyFifty}
          isAudiencePollUsed={isAudiencePollUsed}
          onAudiencePollUsed={useAudiencePoll}
          audiencePollResults={audiencePollResults}
          disabled={isAnswerRevealed || gameStatus === "game_over"}
        />
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
