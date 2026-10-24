export const ROLL_MODES = Object.freeze(['normal', 'advantage', 'disadvantage']);

export const ROLL_MODE_DETAILS = Object.freeze({
  normal: Object.freeze({ rollCount: 1 }),
  advantage: Object.freeze({ rollCount: 2 }),
  disadvantage: Object.freeze({ rollCount: 2 }),
});

export function getRollModeDetails(mode) {
  const details = ROLL_MODE_DETAILS[mode];
  if (!details) throw new RangeError(`Unknown roll mode: ${mode}`);
  return details;
}

export function nextRollMode(mode) {
  const index = ROLL_MODES.indexOf(mode);
  if (index < 0) throw new RangeError(`Unknown roll mode: ${mode}`);
  return ROLL_MODES[(index + 1) % ROLL_MODES.length];
}

export function resolveRoll(mode, rolls) {
  const { rollCount } = getRollModeDetails(mode);
  if (!Array.isArray(rolls) || rolls.length !== rollCount || rolls.some((value) => !Number.isInteger(value))) {
    throw new TypeError(`${mode} requires exactly ${rollCount} integer roll${rollCount === 1 ? '' : 's'}`);
  }

  const value = mode === 'advantage'
    ? Math.max(...rolls)
    : mode === 'disadvantage'
      ? Math.min(...rolls)
      : rolls[0];

  return {
    value,
    selectedIndices: rolls.reduce((indices, roll, index) => {
      if (roll === value) indices.push(index);
      return indices;
    }, []),
  };
}
