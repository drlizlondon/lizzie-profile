export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @param {any} value */
export const isValidEmail = (value) => typeof value === 'string' && EMAIL_PATTERN.test(value);

/** @param {any} value */
export const normaliseEmail = (value) => String(value ?? '').trim().toLowerCase();

/**
 * Browser-only answer storage shared by every guided builder.
 * @param {{ storageKey: string, questions: Array<Record<string, any>> }} options
 */
export const createState = ({ storageKey, questions }) => {
  const defaultAnswers = () => Object.fromEntries(
    questions.flatMap((question) => {
      const base = [[question.id, question.type === 'multi' ? [...(question.defaults ?? [])] : '']];
      return question.followUp ? [...base, [question.followUp.id, '']] : base;
    }),
  );

  /** @param {any} candidate */
  const cleanAnswers = (candidate) => {
    /** @type {Record<string, any>} */
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

  const loadState = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
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
  const saveState = (state) => {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...state }));
  };

  const clearState = () => localStorage.removeItem(storageKey);

  /** @param {Record<string, any>} question @param {Record<string, any>} answers */
  const hasUsefulAnswer = (question, answers) => {
    const value = answers[question.id];
    if (question.type === 'email') return isValidEmail(value);
    if (!question.required) return true;
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' && value.trim().length > 0;
  };

  return { loadState, saveState, clearState, hasUsefulAnswer, defaultAnswers };
};
