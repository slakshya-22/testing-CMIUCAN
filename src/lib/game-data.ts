
import type { Question } from "./types";

// KBC-style point progression for 15 questions
export const KBC_POINTS = [
  10,    // Q1
  20,    // Q2
  30,    // Q3
  50,    // Q4
  100,   // Q5 (Checkpoint 1)
  200,   // Q6
  400,   // Q7
  800,   // Q8
  1600,  // Q9
  3200,  // Q10 (Checkpoint 2)
  6400,  // Q11
  12500, // Q12
  25000, // Q13
  50000, // Q14
  100000 // Q15 (Jackpot)
];

export const TRIVIA_QUESTIONS: Question[] = [
  // Easy Difficulty
  {
    id: "q1",
    text: "What is the primary color of the 'Subscribe' button on YouTube?",
    answers: [
      { text: "Blue", isCorrect: false },
      { text: "Green", isCorrect: false },
      { text: "Red", isCorrect: true },
      { text: "Yellow", isCorrect: false },
    ],
    difficulty: "Easy",
    points: KBC_POINTS[0],
  },
  {
    id: "q2",
    text: "How many sides does a triangle have?",
    answers: [
      { text: "Two", isCorrect: false },
      { text: "Three", isCorrect: true },
      { text: "Four", isCorrect: false },
      { text: "Five", isCorrect: false },
    ],
    difficulty: "Easy",
    points: KBC_POINTS[1],
  },
  {
    id: "q3",
    text: "Which animal is known as the 'King of the Jungle'?",
    answers: [
      { text: "Tiger", isCorrect: false },
      { text: "Elephant", isCorrect: false },
      { text: "Lion", isCorrect: true },
      { text: "Bear", isCorrect: false },
    ],
    difficulty: "Easy",
    points: KBC_POINTS[2],
  },
  // Medium Difficulty
  {
    id: "q4",
    text: "What is the capital of Japan?",
    answers: [
      { text: "Beijing", isCorrect: false },
      { text: "Seoul", isCorrect: false },
      { text: "Tokyo", isCorrect: true },
      { text: "Bangkok", isCorrect: false },
    ],
    difficulty: "Medium",
    points: KBC_POINTS[3],
  },
  {
    id: "q5",
    text: "Which planet is closest to the Sun?",
    answers: [
      { text: "Venus", isCorrect: false },
      { text: "Mercury", isCorrect: true },
      { text: "Mars", isCorrect: false },
      { text: "Earth", isCorrect: false },
    ],
    difficulty: "Medium",
    points: KBC_POINTS[4], // Checkpoint
  },
  {
    id: "q6",
    text: "Who painted the Mona Lisa?",
    answers: [
      { text: "Vincent van Gogh", isCorrect: false },
      { text: "Pablo Picasso", isCorrect: false },
      { text: "Leonardo da Vinci", isCorrect: true },
      { text: "Claude Monet", isCorrect: false },
    ],
    difficulty: "Medium",
    points: KBC_POINTS[5],
  },
  {
    id: "q7",
    text: "What is the chemical symbol for water?",
    answers: [
      { text: "O2", isCorrect: false },
      { text: "CO2", isCorrect: false },
      { text: "H2O", isCorrect: true },
      { text: "NaCl", isCorrect: false },
    ],
    difficulty: "Medium",
    points: KBC_POINTS[6],
  },
  // Hard Difficulty
  {
    id: "q8",
    text: "In what year did the Titanic sink?",
    answers: [
      { text: "1905", isCorrect: false },
      { text: "1912", isCorrect: true },
      { text: "1918", isCorrect: false },
      { text: "1923", isCorrect: false },
    ],
    difficulty: "Hard",
    points: KBC_POINTS[7],
  },
  {
    id: "q9",
    text: "What is the hardest known natural substance?",
    answers: [
      { text: "Gold", isCorrect: false },
      { text: "Iron", isCorrect: false },
      { text: "Diamond", isCorrect: true },
      { text: "Quartz", isCorrect: false },
    ],
    difficulty: "Hard",
    points: KBC_POINTS[8],
  },
  {
    id: "q10",
    text: "Which element has the atomic number 1?",
    answers: [
      { text: "Helium", isCorrect: false },
      { text: "Oxygen", isCorrect: false },
      { text: "Hydrogen", isCorrect: true },
      { text: "Lithium", isCorrect: false },
    ],
    difficulty: "Hard",
    points: KBC_POINTS[9], // Checkpoint
  },
  {
    id: "q11",
    text: "What is the largest mammal in the world?",
    answers: [
      { text: "African Elephant", isCorrect: false },
      { text: "Blue Whale", isCorrect: true },
      { text: "Giraffe", isCorrect: false },
      { text: "Polar Bear", isCorrect: false },
    ],
    difficulty: "Hard",
    points: KBC_POINTS[10],
  },
  {
    id: "q12",
    text: "Who is the author of 'The Lord of the Rings'?",
    answers: [
        { text: "J.K. Rowling", isCorrect: false },
        { text: "George R.R. Martin", isCorrect: false },
        { text: "J.R.R. Tolkien", isCorrect: true },
        { text: "C.S. Lewis", isCorrect: false }
    ],
    difficulty: "Hard",
    points: KBC_POINTS[11]
  },
  {
    id: "q13",
    text: "What is the speed of light in a vacuum (approximately)?",
    answers: [
        { text: "300,000 km/s", isCorrect: true },
        { text: "150,000 km/s", isCorrect: false },
        { text: "500,000 km/s", isCorrect: false },
        { text: "1,000,000 km/s", isCorrect: false }
    ],
    difficulty: "Very Hard",
    points: KBC_POINTS[12]
  },
  {
    id: "q14",
    text: "Which country is home to the Kangaroo?",
    answers: [
        { text: "New Zealand", isCorrect: false },
        { text: "South Africa", isCorrect: false },
        { text: "Australia", isCorrect: true },
        { text: "Brazil", isCorrect: false }
    ],
    difficulty: "Very Hard",
    points: KBC_POINTS[13]
  },
  {
    id: "q15",
    text: "What is the square root of 144?",
    answers: [
        { text: "10", isCorrect: false },
        { text: "12", isCorrect: true },
        { text: "14", isCorrect: false },
        { text: "16", isCorrect: false }
    ],
    difficulty: "Very Hard",
    points: KBC_POINTS[14] // Jackpot
  }
];

