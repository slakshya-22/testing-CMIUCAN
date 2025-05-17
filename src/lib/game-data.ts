import type { Question } from "./types";

export const TRIVIA_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    answers: [
      { text: "Berlin", isCorrect: false },
      { text: "Madrid", isCorrect: false },
      { text: "Paris", isCorrect: true },
      { text: "Rome", isCorrect: false },
    ],
    difficulty: "Easy",
    points: 10,
  },
  {
    id: "q2",
    text: "Which planet is known as the Red Planet?",
    answers: [
      { text: "Earth", isCorrect: false },
      { text: "Mars", isCorrect: true },
      { text: "Jupiter", isCorrect: false },
      { text: "Saturn", isCorrect: false },
    ],
    difficulty: "Easy",
    points: 10,
  },
  {
    id: "q3",
    text: "Who wrote 'Hamlet'?",
    answers: [
      { text: "Charles Dickens", isCorrect: false },
      { text: "William Shakespeare", isCorrect: true },
      { text: "Leo Tolstoy", isCorrect: false },
      { text: "Mark Twain", isCorrect: false },
    ],
    difficulty: "Medium",
    points: 20,
  },
  {
    id: "q4",
    text: "What is the largest ocean on Earth?",
    answers: [
      { text: "Atlantic Ocean", isCorrect: false },
      { text: "Indian Ocean", isCorrect: false },
      { text: "Arctic Ocean", isCorrect: false },
      { text: "Pacific Ocean", isCorrect: true },
    ],
    difficulty: "Medium",
    points: 20,
  },
  {
    id: "q5",
    text: "In what year did World War II end?",
    answers: [
      { text: "1942", isCorrect: false },
      { text: "1945", isCorrect: true },
      { text: "1948", isCorrect: false },
      { text: "1950", isCorrect: false },
    ],
    difficulty: "Hard",
    points: 30,
  },
  {
    id: "q6",
    text: "What is the chemical symbol for Gold?",
    answers: [
      { text: "Ag", isCorrect: false },
      { text: "Au", isCorrect: true },
      { text: "Pb", isCorrect: false },
      { text: "Fe", isCorrect: false },
    ],
    difficulty: "Hard",
    points: 30,
  },
];
