/**
 * Quiz utility functions for randomizing questions and answer options.
 * The answer position is balanced in short sessions, without changing the answer itself.
 */

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Move the one correct answer to a random (or designated) slot,
 *  and randomly shuffle all remaining distractors. */
export function shuffleQuestionOptions<T extends { options: string[]; correctIndex: number }>(
  question: T,
  targetCorrectIndex?: number
): T {
  if (!question || !Array.isArray(question.options) || question.options.length <= 1) {
    return question;
  }
  if (!Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 || question.correctIndex >= question.options.length) {
    throw new Error('Invalid correctIndex in question');
  }
  const n = question.options.length;
  const position = targetCorrectIndex === undefined
    ? Math.floor(Math.random() * n)
    : targetCorrectIndex;
  if (!Number.isInteger(position) || position < 0 || position >= n) {
    throw new Error('Invalid target correct answer position');
  }

  const answer = question.options[question.correctIndex];
  const distractors = shuffleArray(
    question.options.filter((_, index) => index !== question.correctIndex)
  );
  const options: string[] = [];
  let wrongIndex = 0;
  for (let index = 0; index < n; index++) {
    options.push(index === position ? answer : distractors[wrongIndex++]);
  }
  return { ...question, options, correctIndex: position };
}

/** For every consecutive set of four 4-choice questions, put the correct
 *  answer in positions 1, 2, 3, 4 exactly once each in a random order.
 *  The final incomplete set is also randomized. This prevents long runs
 *  of answer 1 (and applies equally to speed, chapter, and level-up modes).
 */
export function shuffleQuestionOptionsBalanced<T extends { options: string[]; correctIndex: number }>(
  questions: T[]
): T[] {
  const result: T[] = [];
  let previous: number | undefined;
  let i = 0;
  while (i < questions.length) {
    const count = questions[i].options.length;
    let end = i + 1;
    while (end < questions.length && questions[end].options.length === count && end - i < count) {
      end++;
    }
    const group = shuffleArray(Array.from({ length: count }, (_, k) => k)).slice(0, end - i);
    if (group.length > 1 && previous !== undefined && group[0] === previous) {
      const swap = group.findIndex(p => p !== previous);
      [group[0], group[swap]] = [group[swap], group[0]];
    }
    for (let k = i; k < end; k++) {
      result.push(shuffleQuestionOptions(questions[k], group[k - i]));
    }
    previous = group[group.length - 1];
    i = end;
  }
  return result;
}

export function shuffleQuestionsAndOptions<T extends { options: string[]; correctIndex: number }>(
  questions: T[]
): T[] {
  return shuffleQuestionOptionsBalanced(shuffleArray(questions));
}
