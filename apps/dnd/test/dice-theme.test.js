import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DICE_TYPES } from '../src/dice-geometry.js';
import {
  DICE_THEMES,
  createDiceTheme,
  getDiceTheme,
  getDiceThemeStyles,
} from '../src/dice-theme.js';

const stylesheet = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const EXPECTED_FACE_COLORS = Object.freeze({
  d4: ['#FF9A3C', '#DF4D21', '#781F19'],
  d6: ['#FFE76A', '#D3AD25', '#73540D'],
  d8: ['#2AA9AD', '#08717C', '#073A49'],
  d10: ['#70A948', '#39733B', '#173E2C'],
  d12: ['#AC79D1', '#704897', '#35254F'],
  d20: ['#D8DDE0', '#768087', '#BFC6CA', '#3A4349'],
});

function getCssTheme(type) {
  const block = stylesheet.match(new RegExp(`\\[data-die-type="${type}"\\]\\s*\\{([^}]*)\\}`))?.[1];
  assert.ok(block, `Missing CSS theme for ${type}`);

  return Object.fromEntries(
    block
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [declaration.slice(0, separator).trim(), declaration.slice(separator + 1).trim()];
      }),
  );
}

test('every supported die has a complete fantasy color theme', () => {
  assert.deepEqual(Object.keys(DICE_THEMES), DICE_TYPES);

  for (const type of DICE_TYPES) {
    const theme = getDiceTheme(type);
    assert.equal(theme, DICE_THEMES[type]);
    assert.deepEqual(theme.gradient.map(({ color }) => color), EXPECTED_FACE_COLORS[type]);
    assert.equal(theme.gradient[0].offset, 0);
    assert.equal(theme.gradient.at(-1).offset, 1);
    assert.ok(theme.gradient.every(({ offset }, index, stops) => index === 0 || offset > stops[index - 1].offset));

    for (const color of [theme.accent, theme.edge, theme.numberFill, theme.numberStroke, theme.iconInk]) {
      assert.match(color, /^#[0-9A-F]{6}$/);
    }
    assert.match(theme.accentRgb, /^\d{1,3} \d{1,3} \d{1,3}$/);
    assert.ok(theme.roughness >= 0 && theme.roughness <= 1);
    assert.ok(theme.metalness >= 0 && theme.metalness <= 1);
  }
});

test('the metal-gray D20 is substantially more metallic than the colored dice', () => {
  const coloredMetalness = DICE_TYPES
    .filter((type) => type !== 'd20')
    .map((type) => getDiceTheme(type).metalness);

  assert.ok(getDiceTheme('d20').metalness > Math.max(...coloredMetalness) + 0.5);
  assert.throws(() => getDiceTheme('coin'), /Unsupported die type/);
});

test('CSS data attributes expose every DOM theme before JavaScript runs', () => {
  for (const type of DICE_TYPES) {
    const theme = getDiceTheme(type);
    const cssTheme = getCssTheme(type);
    const gradient = theme.gradient
      .map(({ offset, color }) => `${color} ${Math.round(offset * 100)}%`)
      .join(', ');

    assert.deepEqual(cssTheme, {
      '--die-gradient': `linear-gradient(145deg, ${gradient})`,
      '--die-accent': theme.accent,
      '--die-accent-rgb': theme.accentRgb,
      '--die-edge': theme.edge,
      '--die-number': theme.numberFill,
      '--die-number-stroke': theme.numberStroke,
      '--die-ink': theme.iconInk,
    });
  }
});

test('custom palettes derive gradients while preserving physical material properties', () => {
  const base = getDiceTheme('d20');
  const custom = createDiceTheme('d20', {
    face: '#336699',
    edge: '#112233',
    number: '#FFFFFF',
  });

  assert.notDeepEqual(custom.gradient, base.gradient);
  assert.equal(custom.accent, '#336699');
  assert.equal(custom.accentRgb, '51 102 153');
  assert.equal(custom.edge, '#112233');
  assert.equal(custom.numberFill, '#FFFFFF');
  assert.equal(custom.numberStroke, '#15100D');
  assert.equal(custom.roughness, base.roughness);
  assert.equal(custom.metalness, base.metalness);
  assert.match(getDiceThemeStyles(custom)['--die-gradient'], /^linear-gradient\(145deg,/);
});

test('custom number colors receive a contrast-safe outline and invalid values fall back', () => {
  assert.equal(createDiceTheme('d6', {
    face: '#D3AD25',
    edge: '#4C3508',
    number: '#111111',
  }).numberStroke, '#F8F2E2');
  assert.deepEqual(createDiceTheme('d4', {
    face: 'orange',
    edge: null,
    number: '#FFF0DC',
  }), getDiceTheme('d4'));
});
