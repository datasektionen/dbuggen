import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PRESET_NAME_LENGTH,
  PRESET_STORAGE_KEY,
  RECENT_PRESET_LIMIT,
  createDefaultPresetDraft,
  createPreset,
  createPresetId,
  deletePreset,
  getPreset,
  isValidPreset,
  loadPresets,
  markPresetUsed,
  mergePresetConfiguration,
  normalizePresetLibrary,
  presetConfigurationsEqual,
  savePresets,
  searchPresets,
  updatePreset,
} from '../src/presets.js';

function preset(overrides = {}) {
  return {
    id: 'preset-1',
    name: 'Lockpicking',
    dieType: 'd20',
    difficultyEnabled: true,
    criticalsEnabled: true,
    mode: 'normal',
    modifier: 3,
    difficulty: 15,
    ...overrides,
  };
}

function genericPreset(overrides = {}) {
  return {
    id: 'preset-generic',
    name: 'Fireball',
    dieType: 'd6',
    mode: 'normal',
    modifier: 3,
    ...overrides,
  };
}

function createMemoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, PRESET_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, PRESET_STORAGE_KEY);
      value = nextValue;
    },
    read() { return value; },
  };
}

test('preset validation requires D20 rules only for D20 presets', () => {
  ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].forEach((dieType) => {
    ['normal', 'advantage', 'disadvantage'].forEach((mode) => {
      const candidate = dieType === 'd20' ? preset({ mode }) : genericPreset({ dieType, mode });
      assert.equal(isValidPreset(candidate), true);
    });
  });

  assert.equal(isValidPreset(preset({ id: '' })), false);
  assert.equal(isValidPreset(preset({ name: '   ' })), false);
  assert.equal(isValidPreset(preset({ name: 'x'.repeat(MAX_PRESET_NAME_LENGTH + 1) })), false);
  assert.equal(isValidPreset(preset({ dieType: 'd100' })), false);
  assert.equal(isValidPreset(preset({ mode: 'best' })), false);
  assert.equal(isValidPreset(preset({ modifier: 100 })), false);
  assert.equal(isValidPreset(preset({ difficulty: 0 })), false);
  assert.equal(isValidPreset(preset({ difficultyEnabled: 'yes' })), false);
  assert.equal(isValidPreset(preset({ criticalsEnabled: 1 })), false);
  assert.equal(isValidPreset(genericPreset({ difficulty: 0, difficultyEnabled: 'yes' })), true);
});

test('library normalization strips extras and non-D20 rules, deduplicates ids, and repairs recents', () => {
  const normalized = normalizePresetLibrary({
    presets: [
      preset({ name: '  Lockpicking  ', ignored: true }),
      preset({ name: 'Duplicate' }),
      preset({ id: 'preset-2', name: 'Stealth', dieType: 'd8', difficulty: 22 }),
      preset({ id: 'broken', modifier: 101 }),
    ],
    recentIds: ['missing', 'preset-2', 'preset-2', 'preset-1'],
  });

  assert.deepEqual(normalized, {
    presets: [preset(), genericPreset({ id: 'preset-2', name: 'Stealth', dieType: 'd8' })],
    recentIds: ['preset-2', 'preset-1'],
  });
});

test('load and save recover from missing, corrupt, blocked, and quota-limited storage', () => {
  assert.deepEqual(loadPresets(null), { presets: [], recentIds: [] });
  assert.deepEqual(loadPresets(createMemoryStorage('{broken')), { presets: [], recentIds: [] });
  assert.deepEqual(loadPresets({ getItem() { throw new Error('blocked'); } }), { presets: [], recentIds: [] });

  const storage = createMemoryStorage();
  const library = { presets: [preset()], recentIds: ['preset-1'] };
  assert.deepEqual(savePresets(storage, library), library);
  assert.deepEqual(JSON.parse(storage.read()), library);
  assert.deepEqual(savePresets({ setItem() { throw new Error('quota'); } }, library), library);
});

test('legacy non-D20 rules are removed on load and the next save without changing the storage key', () => {
  const legacy = preset({ dieType: 'd4', difficultyEnabled: false, criticalsEnabled: false, difficulty: 22 });
  const storage = createMemoryStorage(JSON.stringify({ presets: [legacy], recentIds: ['preset-1'] }));
  const loaded = loadPresets(storage);
  assert.deepEqual(loaded, {
    presets: [genericPreset({ id: 'preset-1', name: 'Lockpicking', dieType: 'd4' })],
    recentIds: ['preset-1'],
  });
  savePresets(storage, loaded);
  assert.deepEqual(JSON.parse(storage.read()), loaded);
});

test('CRUD operations create immutable ids and persist only common fields for non-D20 presets', () => {
  const created = createPreset({ presets: [], recentIds: [] }, {
    ...createDefaultPresetDraft({ dieType: 'd6', difficultyEnabled: true, criticalsEnabled: false, difficulty: 22 }),
    name: '  Fireball  ',
  }, { idFactory: () => 'preset-created' });
  assert.equal(created.preset.name, 'Fireball');
  assert.equal(created.preset.dieType, 'd6');
  assert.equal('difficulty' in created.preset, false);
  assert.equal('criticalsEnabled' in created.preset, false);

  const updated = updatePreset(created.library, 'preset-created', {
    id: 'replacement-id',
    name: 'Greater Fireball',
    modifier: -4,
  });
  assert.equal(updated.preset.id, 'preset-created');
  assert.equal(updated.preset.modifier, -4);
  assert.equal(getPreset(updated.library, 'preset-created').name, 'Greater Fireball');

  const removed = deletePreset(markPresetUsed(updated.library, 'preset-created'), 'preset-created');
  assert.deepEqual(removed, { presets: [], recentIds: [] });
});

test('creation retries duplicate ids and rejects invalid drafts or an exhausted id source', () => {
  let call = 0;
  const existing = { presets: [preset()], recentIds: [] };
  const created = createPreset(existing, { ...preset(), id: undefined, name: 'Second' }, {
    idFactory: () => (++call === 1 ? 'preset-1' : 'preset-2'),
  });
  assert.equal(created.preset.id, 'preset-2');
  assert.throws(() => createPreset(existing, { ...preset(), name: '' }), /Invalid preset/);
  assert.throws(() => createPreset(existing, { ...preset(), name: 'Second' }, { idFactory: () => 'preset-1' }), /unique preset id/);
});

test('recent usage is unique, newest-first, capped, and ignores unknown ids', () => {
  let library = {
    presets: Array.from({ length: RECENT_PRESET_LIMIT + 2 }, (_, index) => preset({
      id: `preset-${index}`,
      name: `Preset ${index}`,
    })),
    recentIds: [],
  };
  library.presets.forEach(({ id }) => { library = markPresetUsed(library, id); });
  assert.deepEqual(library.recentIds, ['preset-6', 'preset-5', 'preset-4', 'preset-3', 'preset-2']);
  assert.deepEqual(markPresetUsed(library, 'preset-4').recentIds, ['preset-4', 'preset-6', 'preset-5', 'preset-3', 'preset-2']);
  assert.deepEqual(markPresetUsed(library, 'missing'), library);
});

test('search is case and diacritic insensitive with recent-first then alphabetical ordering', () => {
  const library = {
    presets: [
      preset({ id: 'a', name: 'Äventyr' }),
      preset({ id: 'b', name: 'Blessing' }),
      preset({ id: 'c', name: 'Arcana' }),
      preset({ id: 'd', name: 'Överlevnad' }),
    ],
    recentIds: ['d', 'b'],
  };
  assert.deepEqual(searchPresets(library).map(({ id }) => id), ['d', 'b', 'c', 'a']);
  assert.deepEqual(searchPresets(library, 'AVEN').map(({ id }) => id), ['a']);
  assert.deepEqual(searchPresets(library, 'över').map(({ id }) => id), ['d']);
});

test('configuration equality compares D20 rules only for D20 configurations', () => {
  const left = preset();
  assert.equal(presetConfigurationsEqual(left, { ...left, id: 'other', name: 'Other name' }), true);
  ['dieType', 'difficultyEnabled', 'criticalsEnabled', 'mode', 'modifier', 'difficulty'].forEach((key) => {
    const replacements = {
      dieType: 'd12',
      difficultyEnabled: false,
      criticalsEnabled: false,
      mode: 'advantage',
      modifier: -2,
      difficulty: 18,
    };
    assert.equal(presetConfigurationsEqual(left, { ...left, [key]: replacements[key] }), false);
  });

  const generic = genericPreset();
  assert.equal(presetConfigurationsEqual(generic, {
    ...generic,
    difficultyEnabled: false,
    criticalsEnabled: false,
    difficulty: 99,
  }), true);
  assert.equal(presetConfigurationsEqual(generic, { ...generic, modifier: 4 }), false);
});

test('merging a preset preserves hidden D20 state for other dice and applies it for D20', () => {
  const current = {
    dieType: 'd20',
    mode: 'normal',
    modifier: 0,
    difficultyEnabled: false,
    criticalsEnabled: false,
    difficulty: 18,
  };
  assert.deepEqual(mergePresetConfiguration(current, genericPreset({ mode: 'advantage', modifier: -2 })), {
    ...current,
    dieType: 'd6',
    mode: 'advantage',
    modifier: -2,
  });
  assert.deepEqual(mergePresetConfiguration(current, preset({
    mode: 'disadvantage',
    difficultyEnabled: true,
    criticalsEnabled: true,
    difficulty: 15,
  })), {
    dieType: 'd20',
    mode: 'disadvantage',
    modifier: 3,
    difficultyEnabled: true,
    criticalsEnabled: true,
    difficulty: 15,
  });
});

test('default drafts omit non-D20 rules and initialize D20 rules to enabled with DC 15', () => {
  assert.deepEqual(createDefaultPresetDraft({ dieType: 'd4', difficulty: 22 }), {
    name: '', dieType: 'd4', mode: 'normal', modifier: 0,
  });
  assert.deepEqual(createDefaultPresetDraft({ dieType: 'd20' }), {
    name: '',
    dieType: 'd20',
    mode: 'normal',
    modifier: 0,
    difficultyEnabled: true,
    criticalsEnabled: true,
    difficulty: 15,
  });
});

test('UUID fallback creates a version 4 variant id', () => {
  const cryptoApi = {
    getRandomValues(bytes) {
      bytes.fill(0xab);
      return bytes;
    },
  };
  assert.equal(createPresetId(cryptoApi), 'abababab-abab-4bab-abab-abababababab');
});
