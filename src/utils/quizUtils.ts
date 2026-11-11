/**
 * Quiz utility functions for randomizing questions and options
 */

/**
 * Fisher-Yates shuffle an array into a new array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles the answer options of a question completely randomly,
 * updating the correctIndex to point to the new location of the correct answer.
 * Works seamlessly with 4-choice (1~4) and 5-choice (1~5) questions.
 */
export function shuffleQuestionOptions<T extends { options: string[]; correctIndex: number }>(question: T): T {
  if (!question || !question.options || question.options.length <= 1) {
    return question;
  }

  // Preserve the correct answer text before shuffling
  const correctText = question.options[question.correctIndex];

  // Map each option with its correctness flag
  const indexed = question.options.map((opt, idx) => ({
    opt,
    isCorrect: idx === question.correctIndex
  }));

  // Fisher-Yates shuffle
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = indexed[i];
    indexed[i] = indexed[j];
    indexed[j] = temp;
  }

  const newOptions = indexed.map(item => item.opt);
  let newCorrectIndex = indexed.findIndex(item => item.isCorrect);

  // Fallback check by text comparison if index search failed
  if (newCorrectIndex === -1 && correctText !== undefined) {
    newCorrectIndex = newOptions.indexOf(correctText);
  }

  return {
    ...question,
    options: newOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

/**
 * Shuffles an array of questions AND shuffles each question's options
 */
export function shuffleQuestionsAndOptions<T extends { options: string[]; correctIndex: number }>(questions: T[]): T[] {
  return shuffleArray(questions).map(q => shuffleQuestionOptions(q));
}
