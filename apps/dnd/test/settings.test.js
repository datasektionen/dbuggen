import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DICE_PALETTES } from '../src/dice-theme.js';
import {
  SETTINGS_STORAGE_KEY,
  SUPPORTED_FPS,
  createDefaultSettings,
  loadSettings,
  normalizeSettings,
  resetSettings,
  saveSettings,
} from '../src/settings.js';

function createMemoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, SETTINGS_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, SETTINGS_STORAGE_KEY);
      value = nextValue;
    },
    removeItem(key) {
      assert.equal(key, SETTINGS_STORAGE_KEY);
      value = null;
    },
    read() { return value; },
  };
}

test('settings default to Swedish, automatic FPS, enabled sound, and original palettes', () => {
  const settings = createDefaultSettings();
  assert.deepEqual(SUPPORTED_FPS, ['auto', '30', '60', '120']);
  assert.equal(settings.language, 'sv');
  assert.equal(settings.fps, 'auto');
  assert.equal(settings.soundEnabled, true);
  assert.deepEqual(settings.diceColors, DEFAULT_DICE_PALETTES);
});

test('settings recover valid fields individually and normalize palette colors', () => {
  const settings = normalizeSettings({
    language: 'en',
    fps: '120',
    soundEnabled: false,
    diceColors: {
      d4: { face: '#abcdef', edge: 'bad', number: '#010203' },
      d20: null,
    },
  });
  assert.equal(settings.language, 'en');
  assert.equal(settings.fps, '120');
  assert.equal(settings.soundEnabled, false);
  assert.deepEqual(settings.diceColors.d4, {
    face: '#ABCDEF',
    edge: DEFAULT_DICE_PALETTES.d4.edge,
    number: '#010203',
  });
  assert.deepEqual(settings.diceColors.d20, DEFAULT_DICE_PALETTES.d20);
  assert.equal(normalizeSettings({ fps: '144' }).fps, 'auto');
});

test('loading, saving, and resetting settings remain safe when storage is unavailable', () => {
  assert.deepEqual(loadSettings(null), createDefaultSettings());
  assert.deepEqual(loadSettings(createMemoryStorage('{broken')), createDefaultSettings());
  assert.deepEqual(loadSettings({ getItem() { throw new Error('blocked'); } }), createDefaultSettings());

  const storage = createMemoryStorage();
  const saved = saveSettings(storage, { ...createDefaultSettings(), language: 'en', fps: '120' });
  assert.deepEqual(JSON.parse(storage.read()), saved);
  assert.equal(loadSettings(storage).language, 'en');
  assert.equal(loadSettings(storage).fps, '120');
  assert.deepEqual(resetSettings(storage), createDefaultSettings());
  assert.equal(storage.read(), null);

  assert.doesNotThrow(() => saveSettings({ setItem() { throw new Error('quota'); } }, saved));
  assert.doesNotThrow(() => resetSettings({ removeItem() { throw new Error('blocked'); } }));
});
