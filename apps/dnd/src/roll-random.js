const UINT32_SCALE = 0x100000000;

function rotateLeft(value, amount) {
  return ((value << amount) | (value >>> (32 - amount))) >>> 0;
}

export function createSeededRandom(seedWords) {
  if (!seedWords || seedWords.length !== 4) throw new TypeError('A roll seed must contain exactly four uint32 words');
  const state = Array.from(seedWords, (value) => Number(value) >>> 0);
  if (state.every((value) => value === 0)) state[3] = 0x9e3779b9;

  function nextUint32() {
    const result = Math.imul(rotateLeft(Math.imul(state[1], 5) >>> 0, 7), 9) >>> 0;
    const shifted = (state[1] << 9) >>> 0;
    state[2] = (state[2] ^ state[0]) >>> 0;
    state[3] = (state[3] ^ state[1]) >>> 0;
    state[1] = (state[1] ^ state[2]) >>> 0;
    state[0] = (state[0] ^ state[3]) >>> 0;
    state[2] = (state[2] ^ shifted) >>> 0;
    state[3] = rotateLeft(state[3], 11);
    return result;
  }

  return {
    nextUint32,
    nextFloat: () => nextUint32() / UINT32_SCALE,
  };
}

function randomRange(random, minimum, maximum) {
  return minimum + random.nextFloat() * (maximum - minimum);
}

function randomUnitVector(random) {
  const z = randomRange(random, -1, 1);
  const angle = randomRange(random, 0, Math.PI * 2);
  const radius = Math.sqrt(Math.max(0, 1 - z * z));
  return {
    x: radius * Math.cos(angle),
    y: z,
    z: radius * Math.sin(angle),
  };
}

function randomQuaternion(random) {
  const u1 = random.nextFloat();
  const u2 = random.nextFloat();
  const u3 = random.nextFloat();
  return {
    x: Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2),
    y: Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2),
    z: Math.sqrt(u1) * Math.sin(2 * Math.PI * u3),
    w: Math.sqrt(u1) * Math.cos(2 * Math.PI * u3),
  };
}

export function createRollLaunch(definition, seedWords) {
  const random = createSeededRandom(seedWords);
  const spinAxis = randomUnitVector(random);
  const spinSpeed = randomRange(random, ...definition.physics.spin);
  return {
    position: {
      x: randomRange(random, -0.9, 0.9),
      y: randomRange(random, ...definition.physics.launchY),
      z: randomRange(random, -2.25, -1.85),
    },
    velocity: {
      x: randomRange(random, -0.55, 0.55),
      y: randomRange(random, -0.2, 0.4),
      z: randomRange(random, 2.9, 3.55),
    },
    quaternion: randomQuaternion(random),
    angularVelocity: {
      x: spinAxis.x * spinSpeed,
      y: spinAxis.y * spinSpeed,
      z: spinAxis.z * spinSpeed,
    },
    spinAxis,
    spinSpeed,
  };
}
