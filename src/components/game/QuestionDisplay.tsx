"use client";

import type { Question } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react"; // KBC often shows question number prominently

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  if (!question) return null;

  return (
    <Card className="w-full shadow-2xl transform transition-all duration-500 hover:shadow-primary/30 bg-gradient-to-br from-card via-background to-card border-2 border-primary/30 rounded-xl">
      <CardHeader className="p-6">
        <div className="flex justify-between items-center mb-2">
          <CardDescription className="text-sm text-muted-foreground flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-accent"/>
            Question {questionNumber} / {totalQuestions}
          </CardDescription>
          <CardDescription className="text-sm text-primary font-semibold">
            {question.points} Points
          </CardDescription>
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold text-foreground leading-tight py-4 text-center">
          {question.text}
        </CardTitle>
         <div className="text-center text-xs text-muted-foreground mt-1">
            Difficulty: <span className="font-semibold text-secondary">{question.difficulty}</span>
        </div>
      </CardHeader>
      {/* Optional: KBC has specific visual styling for question box */}
      <CardContent>
        {/* Content can be added here if needed, e.g. image related to question */}
      </CardContent>
    </Card>
  );
}
