import { DEFAULT_DICE_PALETTES, isHexColor } from './dice-theme.js';

export const SETTINGS_STORAGE_KEY = 'odets-kast.settings.v1';
export const SUPPORTED_LANGUAGES = Object.freeze(['sv', 'en']);
export const SUPPORTED_FPS = Object.freeze(['auto', '30', '60', '120']);

function clonePalettes(palettes = DEFAULT_DICE_PALETTES) {
  return Object.fromEntries(Object.entries(palettes).map(([type, palette]) => [type, { ...palette }]));
}

export function createDefaultSettings() {
  return {
    language: 'sv',
    fps: 'auto',
    soundEnabled: true,
    diceColors: clonePalettes(),
  };
}

export const DEFAULT_SETTINGS = Object.freeze({
  ...createDefaultSettings(),
  diceColors: Object.freeze(clonePalettes()),
});

function normalizePalette(candidate, fallback) {
  if (!candidate || typeof candidate !== 'object') return { ...fallback };
  return {
    face: isHexColor(candidate.face) ? candidate.face.toUpperCase() : fallback.face,
    edge: isHexColor(candidate.edge) ? candidate.edge.toUpperCase() : fallback.edge,
    number: isHexColor(candidate.number) ? candidate.number.toUpperCase() : fallback.number,
  };
}

export function normalizeSettings(candidate) {
  const defaults = createDefaultSettings();
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return defaults;
  return {
    language: SUPPORTED_LANGUAGES.includes(candidate.language) ? candidate.language : defaults.language,
    fps: SUPPORTED_FPS.includes(candidate.fps) ? candidate.fps : defaults.fps,
    soundEnabled: typeof candidate.soundEnabled === 'boolean' ? candidate.soundEnabled : defaults.soundEnabled,
    diceColors: Object.fromEntries(Object.entries(defaults.diceColors).map(([type, fallback]) => [
      type,
      normalizePalette(candidate.diceColors?.[type], fallback),
    ])),
  };
}

export function loadSettings(storage) {
  if (!storage) return createDefaultSettings();
  try {
    const stored = storage.getItem(SETTINGS_STORAGE_KEY);
    return stored === null ? createDefaultSettings() : normalizeSettings(JSON.parse(stored));
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(storage, settings) {
  const normalized = normalizeSettings(settings);
  try {
    storage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Current-session settings remain usable when persistence is blocked.
  }
  return normalized;
}

export function resetSettings(storage) {
  const defaults = createDefaultSettings();
  try {
    storage?.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // Reset still succeeds in memory when persistence is blocked.
  }
  return defaults;
}
