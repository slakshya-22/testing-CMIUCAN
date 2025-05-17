"use client";

import type { Question } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  if (!question) return null;

  return (
    <Card className="w-full shadow-lg transform transition-all duration-500 hover:shadow-2xl">
      <CardHeader>
        <CardDescription className="text-sm text-muted-foreground">
          Question {questionNumber} of {totalQuestions} ({question.difficulty} - {question.points} pts)
        </CardDescription>
        <CardTitle className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content can be added here if needed, e.g. image related to question */}
      </CardContent>
    </Card>
  );
}
