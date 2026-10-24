import { DICE_TYPES, getDiceDefinition } from './dice-geometry.js';
import { DEFAULT_DIFFICULTY, isValidDifficulty } from './difficulty.js';
import { isValidModifier } from './modifier.js';
import { getRollModeDetails, resolveRoll } from './roll-mode.js';

export const HISTORY_LIMIT = 100;
export const HISTORY_STORAGE_KEY = 'odets-kast.roll-history.v1';
const MAX_DATE_TIMESTAMP = 8_640_000_000_000_000;

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (!DICE_TYPES.includes(entry.dieType)) return false;
  if (!Number.isInteger(entry.value) || entry.value < 1 || entry.value > getDiceDefinition(entry.dieType).sides) return false;
  if (!Number.isSafeInteger(entry.rolledAt) || entry.rolledAt <= 0 || entry.rolledAt > MAX_DATE_TIMESTAMP) return false;

  const mode = entry.mode ?? 'normal';
  const rolls = entry.rolls ?? [entry.value];
  const modifier = entry.modifier ?? 0;
  const criticalsEnabled = entry.criticalsEnabled ?? true;
  const difficulty = entry.difficulty ?? DEFAULT_DIFFICULTY;
  const difficultyEnabled = entry.difficultyEnabled ?? true;
  if (
    !isValidModifier(modifier)
    || typeof criticalsEnabled !== 'boolean'
    || !isValidDifficulty(difficulty)
    || typeof difficultyEnabled !== 'boolean'
  ) return false;
  let rollCount;
  try {
    rollCount = getRollModeDetails(mode).rollCount;
  } catch {
    return false;
  }
  if (!Array.isArray(rolls) || rolls.length !== rollCount) return false;
  const sides = getDiceDefinition(entry.dieType).sides;
  if (rolls.some((value) => !Number.isInteger(value) || value < 1 || value > sides)) return false;
  if (resolveRoll(mode, rolls).value !== entry.value) return false;

  return {
    dieType: entry.dieType,
    value: entry.value,
    rolledAt: entry.rolledAt,
    mode,
    rolls: [...rolls],
    modifier,
    criticalsEnabled,
    difficulty,
    difficultyEnabled,
  };
}

export function isValidHistoryEntry(entry) {
  return Boolean(normalizeHistoryEntry(entry));
}

export function normalizeHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .sort((left, right) => right.rolledAt - left.rolledAt)
    .slice(0, HISTORY_LIMIT);
}

export function loadHistory(storage) {
  if (!storage) return [];
  try {
    const stored = storage.getItem(HISTORY_STORAGE_KEY);
    return stored === null ? [] : normalizeHistory(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function saveHistory(storage, entries) {
  const normalized = normalizeHistory(entries);
  if (!storage) return normalized;
  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The in-memory history remains available when persistence is blocked.
  }
  return normalized;
}

export function addHistoryEntry(storage, entries, entry) {
  return saveHistory(storage, [entry, ...entries]);
}

export function clearHistory(storage) {
  if (!storage) return [];
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Clearing the in-memory list is still useful when persistence is blocked.
  }
  return [];
}
