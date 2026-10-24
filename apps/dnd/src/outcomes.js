import { DEFAULT_DIFFICULTY } from './difficulty.js';

export function getOutcome(naturalValue, total = naturalValue, rules = {}) {
  const {
    criticalsEnabled = true,
    difficultyEnabled = true,
    difficulty = DEFAULT_DIFFICULTY,
  } = typeof rules === 'boolean' ? { criticalsEnabled: rules } : rules;

  if (criticalsEnabled && naturalValue === 20) return { state: 'critical' };
  if (criticalsEnabled && naturalValue === 1) return { state: 'criticalFailure' };
  if (!difficultyEnabled) return { state: 'neutral' };
  if (total >= difficulty) return { state: 'success' };
  return { state: 'failure' };
}
