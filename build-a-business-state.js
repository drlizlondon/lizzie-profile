import { questions, STORAGE_KEY } from './build-a-business-data.js';

const defaultAnswers = () => Object.fromEntries(
  questions.flatMap((question) => {
    const base = [[question.id, question.type === 'multi' ? [...(question.defaults ?? [])] : '']];
    return question.followUp ? [...base, [question.followUp.id, '']] : base;
  }),
);

/** @param {any} candidate */
const cleanAnswers = (candidate) => {
  const defaults = defaultAnswers();
  if (!candidate || typeof candidate !== 'object') return defaults;
  for (const question of questions) {
    const value = candidate[question.id];
    if (question.type === 'multi' && Array.isArray(value)) defaults[question.id] = value.filter((item) => typeof item === 'string');
    else if (typeof value === 'string') defaults[question.id] = value.slice(0, 2000);
    if (question.followUp && typeof candidate[question.followUp.id] === 'string') defaults[question.followUp.id] = candidate[question.followUp.id].slice(0, 500);
  }
  return defaults;
};

export const loadState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || stored.version !== 1) throw new Error('invalid');
    return {
      started: Boolean(stored.started),
      view: ['welcome', 'questions', 'review', 'results'].includes(stored.view) ? stored.view : 'welcome',
      index: Math.min(Math.max(Number(stored.index) || 0, 0), questions.length - 1),
      answers: cleanAnswers(stored.answers),
    };
  } catch {
    return { started: false, view: 'welcome', index: 0, answers: defaultAnswers() };
  }
};

/** @param {Record<string, any>} state */
export const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }));
};

export const clearState = () => localStorage.removeItem(STORAGE_KEY);

/** @param {Record<string, any>} question @param {Record<string, any>} answers */
export const hasUsefulAnswer = (question, answers) => {
  const value = answers[question.id];
  if (!question.required) return true;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' && value.trim().length > 0;
};
