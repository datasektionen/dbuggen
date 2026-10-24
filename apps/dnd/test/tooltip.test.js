import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOLTIP_DELAY_MS, calculateTooltipPosition } from '../src/tooltip.js';

test('tooltips use the requested half-second pointer delay', () => {
  assert.equal(TOOLTIP_DELAY_MS, 500);
});

test('tooltips are centered above their target when room is available', () => {
  assert.deepEqual(
    calculateTooltipPosition(
      { left: 100, top: 100, bottom: 130, width: 80 },
      { width: 120, height: 32 },
      { width: 500, height: 400 },
    ),
    { left: 80, top: 60, placement: 'top' },
  );
});

test('tooltips flip below targets close to the top edge', () => {
  assert.deepEqual(
    calculateTooltipPosition(
      { left: 100, top: 20, bottom: 50, width: 80 },
      { width: 120, height: 32 },
      { width: 500, height: 400 },
    ),
    { left: 80, top: 58, placement: 'bottom' },
  );
});

test('tooltips are clamped inside both horizontal viewport edges', () => {
  assert.equal(calculateTooltipPosition(
    { left: 0, top: 100, bottom: 130, width: 30 },
    { width: 140, height: 32 },
    { width: 320, height: 400 },
  ).left, 12);
  assert.equal(calculateTooltipPosition(
    { left: 300, top: 100, bottom: 130, width: 30 },
    { width: 140, height: 32 },
    { width: 320, height: 400 },
  ).left, 168);
});

test('tooltips remain inside the lower viewport edge after flipping', () => {
  assert.equal(calculateTooltipPosition(
    { left: 100, top: 10, bottom: 390, width: 80 },
    { width: 120, height: 60 },
    { width: 500, height: 400 },
  ).top, 328);
});
