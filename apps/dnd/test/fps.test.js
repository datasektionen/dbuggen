import test from 'node:test';
import assert from 'node:assert/strict';
import { frameIntervalForFps } from '../src/dice-scene.js';

test('supported FPS settings map to the expected render intervals', () => {
  assert.equal(frameIntervalForFps('auto'), 0);
  assert.equal(frameIntervalForFps('30'), 1000 / 30);
  assert.equal(frameIntervalForFps(60), 1000 / 60);
  assert.equal(frameIntervalForFps('120'), 1000 / 120);
  assert.throws(() => frameIntervalForFps('144'), /Unsupported FPS setting/);
});
