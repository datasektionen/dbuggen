import { getDiceDefinition } from './dice-geometry.js';
import { SUPPORTED_FPS } from './settings.js';

export class StaticDiceFallback {
  constructor({
    diceElements,
    applyTheme,
    onSettled,
    onStateChange,
    schedule = (callback, delay) => globalThis.setTimeout(callback, delay),
    cancel = (timeout) => globalThis.clearTimeout(timeout),
  }) {
    this.diceElements = diceElements;
    this.applyTheme = applyTheme;
    this.onSettled = onSettled;
    this.onStateChange = onStateChange;
    this.schedule = schedule;
    this.cancel = cancel;
    this.timeout = 0;
    this.type = 'd20';
    this.diceCount = 1;
  }

  setDie(type) {
    this.type = type;
    this.diceElements.forEach((die) => {
      this.applyTheme(die, type);
      die.textContent = Math.min(12, getDiceDefinition(type).sides);
    });
    this.onStateChange('idle');
    return true;
  }

  setDiceCount(count) {
    if (![1, 2].includes(count)) return false;
    this.diceCount = count;
    this.diceElements.forEach((die, index) => {
      die.classList.toggle('is-active', index < count);
      die.classList.remove('is-selected', 'is-unselected');
    });
    return true;
  }

  setFps(value) {
    return SUPPORTED_FPS.includes(String(value));
  }

  setDiceTheme(type) {
    if (type !== this.type) return true;
    this.diceElements.forEach((die) => this.applyTheme(die, type));
    return true;
  }

  highlightDice(selectedIndices) {
    const hasSelection = selectedIndices.length > 0;
    this.diceElements.forEach((die, index) => {
      const active = index < this.diceCount;
      die.classList.toggle('is-selected', active && selectedIndices.includes(index));
      die.classList.toggle('is-unselected', active && hasSelection && !selectedIndices.includes(index));
    });
  }

  roll({ attempts }) {
    if (!Array.isArray(attempts) || attempts.length !== this.diceCount) return false;
    this.onStateChange('settling');
    this.highlightDice([]);
    attempts.forEach(({ fallbackValue }, index) => {
      this.diceElements[index].textContent = fallbackValue;
    });
    this.timeout = this.schedule(() => {
      this.onStateChange('complete');
      this.onSettled(attempts.map(({ fallbackValue }) => fallbackValue));
    }, 180);
    return true;
  }

  resize() {}

  dispose() {
    this.cancel(this.timeout);
  }
}
