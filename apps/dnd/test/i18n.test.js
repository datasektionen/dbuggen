import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS, localeForLanguage, translate } from '../src/i18n.js';

test('Swedish and English catalogs expose identical translation keys', () => {
  assert.deepEqual(Object.keys(TRANSLATIONS.sv).sort(), Object.keys(TRANSLATIONS.en).sort());
});

test('translations support interpolation and plural-aware history copy', () => {
  assert.equal(translate('sv', 'arena.eyebrow', { die: 'D8' }), 'Fysisk D8-simulering');
  assert.equal(translate('en', 'arena.eyebrow', { die: 'D8' }), 'Physical D8 simulation');
  assert.equal(translate('sv', 'history.count', { count: 1 }), '1 sparat kast');
  assert.equal(translate('en', 'history.count', { count: 3 }), '3 saved rolls');
  assert.equal(translate('en', 'roll.breakdown', { rolls: [4, 17], selection: 'highest selected' }), 'Rolls: 4 and 17 · highest selected');
  assert.equal(translate('sv', 'presets.count', { count: 1 }), '1 sparad förinställning');
  assert.equal(translate('en', 'presets.count', { count: 3 }), '3 saved presets');
  assert.equal(translate('en', 'presets.summary', {
    die: 'D20',
    mode: 'Advantage',
    modifier: '+3',
    difficulty: 'DC 18',
  }), 'D20 · Advantage · +3 · DC 18');
  assert.equal(translate('sv', 'presets.applied', { name: 'Låsdyrkning' }), 'Förinställningen Låsdyrkning har använts. Redo att kasta.');
  assert.equal(translate('en', 'presets.noRecent'), 'Use a preset from the library to pin it here.');
  assert.equal(translate('sv', 'presets.rollSettings'), 'Kastinställningar');
  assert.equal(translate('en', 'presets.d20Rules'), 'D20 rules');
  assert.equal(translate('sv', 'campaigns.searchResults', { count: 1 }), '1 kampanj');
  assert.equal(translate('en', 'campaigns.searchResults', { count: 4 }), '4 campaigns');
  assert.equal(translate('sv', 'campaigns.noResultsTitle'), 'Ingen kampanj hittades');
  assert.equal(translate('en', 'campaigns.noResultsText'), 'Try another name.');
  assert.equal(translate('sv', 'expression.incomplete'), 'Ofullst\u00e4ndigt uttryck');
  assert.equal(translate('en', 'expression.invalid'), 'Invalid expression');
});

test('language locales and missing keys are explicit', () => {
  assert.equal(localeForLanguage('sv'), 'sv-SE');
  assert.equal(localeForLanguage('en'), 'en-GB');
  assert.throws(() => translate('en', 'missing.key'), /Missing translation/);
});
