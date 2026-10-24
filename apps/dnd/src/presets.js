import { DICE_TYPES } from './dice-geometry.js';
import { DEFAULT_DIFFICULTY, isValidDifficulty } from './difficulty.js';
import { isValidModifier } from './modifier.js';
import { ROLL_MODES } from './roll-mode.js';

export const PRESET_STORAGE_KEY = 'odets-kast.presets.v1';
export const RECENT_PRESET_LIMIT = 5;
export const MAX_PRESET_NAME_LENGTH = 80;

const COMMON_PRESET_CONFIGURATION_KEYS = Object.freeze(['dieType', 'mode', 'modifier']);
const D20_PRESET_CONFIGURATION_KEYS = Object.freeze([
  'difficultyEnabled',
  'criticalsEnabled',
  'difficulty',
]);

export function createEmptyPresetLibrary() {
  return { presets: [], recentIds: [] };
}

function normalizeIdentifier(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizePresetName(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_PRESET_NAME_LENGTH) return null;
  return normalized;
}

export function normalizePreset(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;

  const id = normalizeIdentifier(candidate.id);
  const name = normalizePresetName(candidate.name);
  if (
    !id
    || !name
    || !DICE_TYPES.includes(candidate.dieType)
    || !ROLL_MODES.includes(candidate.mode)
    || !isValidModifier(candidate.modifier)
  ) return null;

  const normalized = {
    id,
    name,
    dieType: candidate.dieType,
    mode: candidate.mode,
    modifier: candidate.modifier,
  };

  if (candidate.dieType !== 'd20') return normalized;
  if (
    typeof candidate.difficultyEnabled !== 'boolean'
    || typeof candidate.criticalsEnabled !== 'boolean'
    || !isValidDifficulty(candidate.difficulty)
  ) return null;

  return {
    ...normalized,
    difficultyEnabled: candidate.difficultyEnabled,
    criticalsEnabled: candidate.criticalsEnabled,
    difficulty: candidate.difficulty,
  };
}

export function isValidPreset(candidate) {
  return Boolean(normalizePreset(candidate));
}

export function normalizePresetLibrary(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return createEmptyPresetLibrary();
  }

  const seenIds = new Set();
  const presets = Array.isArray(candidate.presets)
    ? candidate.presets.reduce((normalized, preset) => {
      const next = normalizePreset(preset);
      if (!next || seenIds.has(next.id)) return normalized;
      seenIds.add(next.id);
      normalized.push(next);
      return normalized;
    }, [])
    : [];

  const recentIds = [];
  if (Array.isArray(candidate.recentIds)) {
    candidate.recentIds.forEach((id) => {
      if (
        recentIds.length < RECENT_PRESET_LIMIT
        && typeof id === 'string'
        && seenIds.has(id)
        && !recentIds.includes(id)
      ) recentIds.push(id);
    });
  }

  return { presets, recentIds };
}

export function loadPresets(storage) {
  if (!storage) return createEmptyPresetLibrary();
  try {
    const stored = storage.getItem(PRESET_STORAGE_KEY);
    return stored === null ? createEmptyPresetLibrary() : normalizePresetLibrary(JSON.parse(stored));
  } catch {
    return createEmptyPresetLibrary();
  }
}

export function savePresets(storage, library) {
  const normalized = normalizePresetLibrary(library);
  try {
    storage?.setItem(PRESET_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // The in-memory library remains available when persistence is blocked.
  }
  return normalized;
}

export function createPresetId(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== 'function') throw new TypeError('Web Crypto is required to create a preset');

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

function assertValidPreset(candidate) {
  const normalized = normalizePreset(candidate);
  if (!normalized) throw new TypeError('Invalid preset');
  return normalized;
}

export function createPreset(library, draft, { idFactory = createPresetId } = {}) {
  const normalized = normalizePresetLibrary(library);
  const existingIds = new Set(normalized.presets.map(({ id }) => id));
  let id;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    id = normalizeIdentifier(idFactory());
    if (id && !existingIds.has(id)) break;
    id = null;
  }
  if (!id) throw new Error('Unable to create a unique preset id');

  const preset = assertValidPreset({ ...draft, id });
  return {
    library: { ...normalized, presets: [...normalized.presets, preset] },
    preset,
  };
}

export function updatePreset(library, id, changes) {
  const normalized = normalizePresetLibrary(library);
  const index = normalized.presets.findIndex((preset) => preset.id === id);
  if (index < 0) return { library: normalized, preset: null };

  const preset = assertValidPreset({ ...normalized.presets[index], ...changes, id });
  const presets = [...normalized.presets];
  presets[index] = preset;
  return { library: { ...normalized, presets }, preset };
}

export function deletePreset(library, id) {
  const normalized = normalizePresetLibrary(library);
  return {
    presets: normalized.presets.filter((preset) => preset.id !== id),
    recentIds: normalized.recentIds.filter((recentId) => recentId !== id),
  };
}

export function markPresetUsed(library, id) {
  const normalized = normalizePresetLibrary(library);
  if (!normalized.presets.some((preset) => preset.id === id)) return normalized;
  return {
    ...normalized,
    recentIds: [id, ...normalized.recentIds.filter((recentId) => recentId !== id)]
      .slice(0, RECENT_PRESET_LIMIT),
  };
}

export function getPreset(library, id) {
  return normalizePresetLibrary(library).presets.find((preset) => preset.id === id) ?? null;
}

function searchableName(name) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

export function searchPresets(library, query = '') {
  const normalized = normalizePresetLibrary(library);
  const recentOrder = new Map(normalized.recentIds.map((id, index) => [id, index]));
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
  const needle = searchableName(String(query).trim());

  return normalized.presets
    .filter((preset) => searchableName(preset.name).includes(needle))
    .sort((left, right) => {
      const leftRecent = recentOrder.get(left.id);
      const rightRecent = recentOrder.get(right.id);
      if (leftRecent !== undefined || rightRecent !== undefined) {
        if (leftRecent === undefined) return 1;
        if (rightRecent === undefined) return -1;
        return leftRecent - rightRecent;
      }
      return collator.compare(left.name, right.name);
    });
}

export function presetConfigurationsEqual(left, right) {
  if (!COMMON_PRESET_CONFIGURATION_KEYS.every((key) => left?.[key] === right?.[key])) return false;
  if (left?.dieType !== 'd20') return true;
  return D20_PRESET_CONFIGURATION_KEYS.every((key) => left?.[key] === right?.[key]);
}

export function mergePresetConfiguration(current, preset) {
  const merged = {
    ...current,
    dieType: preset.dieType,
    mode: preset.mode,
    modifier: preset.modifier,
  };
  if (preset.dieType !== 'd20') return merged;
  return {
    ...merged,
    difficultyEnabled: preset.difficultyEnabled,
    criticalsEnabled: preset.criticalsEnabled,
    difficulty: preset.difficulty,
  };
}

export function createDefaultPresetDraft(configuration = {}) {
  const draft = {
    name: '',
    dieType: configuration.dieType ?? 'd20',
    mode: configuration.mode ?? 'normal',
    modifier: configuration.modifier ?? 0,
  };
  if (draft.dieType !== 'd20') return draft;
  return {
    ...draft,
    difficultyEnabled: configuration.difficultyEnabled ?? true,
    criticalsEnabled: configuration.criticalsEnabled ?? true,
    difficulty: configuration.difficulty ?? DEFAULT_DIFFICULTY,
  };
}
