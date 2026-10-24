import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {
  DICE_DEFINITIONS,
  DICE_TYPES,
  UINT32_RANGE,
  createDiceBufferData,
  createFaceUvCoordinates,
  cross,
  dot,
  getAcceptanceLimit,
  getD4FaceMarkings,
  getFaceAreaCentroid,
  getFaceLabelAnchor,
  getFaceLabelLayout,
  getFaceLabelSafePolygon,
  getFaceUvPolygon,
  getResultLabelCandidates,
  getSecureRoll,
  nearestRotationForValue,
  normalizeVector,
  presentationRotationForValue,
  restingHeightForQuaternion,
  restingHeightForValue,
  rotateVector,
  rotationForValue,
  topFaceValue,
} from '../src/dice-geometry.js';
import {
  BORDER_RESCUE_COOLDOWN_MS,
  BORDER_STALL_DURATION_MS,
  BORDER_STALL_START_SECONDS,
  MAX_BORDER_RESCUES,
  PHYSICAL_ROLL_LIMIT_SECONDS,
  RECENTER_DURATION_MS,
  SAFETY_CORRECTION_START_SECONDS,
  SETTLE_FALLBACK_SECONDS,
  SETTLE_GRACE_SECONDS,
  clampPlanarPosition,
  getRecenteringPosition,
  getSettleAssistProgress,
  shouldBeginSettleAssist,
  updateBorderStall,
} from '../src/settling.js';
import {
  LANDING_HEIGHT_TOLERANCE,
  TRAY_APOTHEM,
  TRAY_RADIUS,
  WALL_BOTTOM_INNER_RADIUS,
  WALL_BOTTOM_Y,
  WALL_FLARE_RADIANS,
  WALL_FRICTION,
  WALL_HALF_HEIGHT,
  WALL_HALF_THICKNESS,
  WALL_RESTITUTION,
  addTrayPhysics,
  classifyDiceContacts,
  createDiceCollider,
  getWallColliderDescriptor,
  isValidTabletopLanding,
  setRollingSleepState,
} from '../src/tray-physics.js';
import { createRollLaunch, createSeededRandom } from '../src/roll-random.js';
import { getOutcome } from '../src/outcomes.js';
import { DICE_CAMERA_FRAMING, DiceScene } from '../src/dice-scene.js';

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function quaternionComponents(quaternion) {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

function centroid(points) {
  return points.reduce((total, point) => ({
    x: total.x + point.x / points.length,
    y: total.y + point.y / points.length,
    z: total.z + point.z / points.length,
  }), { x: 0, y: 0, z: 0 });
}

function seedWordsFor(index, salt = 0) {
  const value = (index + 1 + salt * 0x10001) >>> 0;
  return [
    Math.imul(value, 0x9e3779b1) >>> 0,
    Math.imul(value ^ 0xa5a5a5a5, 0x85ebca6b) >>> 0,
    Math.imul(value ^ 0x3c6ef372, 0xc2b2ae35) >>> 0,
    Math.imul(value ^ 0x1bf5a7b3, 0x27d4eb2f) >>> 0,
  ];
}

test('the tight camera framing keeps the complete tray inside a desktop viewport', () => {
  const camera = new THREE.PerspectiveCamera(DICE_CAMERA_FRAMING.fov, 1000 / 660, 0.1, 60);
  camera.position.set(
    DICE_CAMERA_FRAMING.position.x,
    DICE_CAMERA_FRAMING.position.y,
    DICE_CAMERA_FRAMING.position.z,
  );
  camera.lookAt(
    DICE_CAMERA_FRAMING.target.x,
    DICE_CAMERA_FRAMING.target.y,
    DICE_CAMERA_FRAMING.target.z,
  );
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const projectedTray = Array.from({ length: 8 }, (_, index) => {
    const angle = Math.PI / 8 + index * Math.PI / 4;
    return new THREE.Vector3(
      Math.sin(angle) * TRAY_RADIUS,
      0,
      Math.cos(angle) * TRAY_RADIUS,
    ).project(camera);
  });

  projectedTray.forEach(({ x, y }) => {
    assert.ok(Math.abs(x) < 0.99, `Expected tray x=${x} to remain inside the viewport`);
    assert.ok(Math.abs(y) < 0.99, `Expected tray y=${y} to remain inside the viewport`);
  });
});

function pointInsideConvexPolygon(point, polygon) {
  let sign = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const amount = (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
    if (Math.abs(amount) < 1e-12) continue;
    const nextSign = Math.sign(amount);
    if (sign && nextSign !== sign) return false;
    sign = nextSign;
  }
  return true;
}

function cameraBasis() {
  const cameraPosition = DICE_CAMERA_FRAMING.position;
  const cameraTarget = DICE_CAMERA_FRAMING.target;
  const forward = normalizeVector(subtract(cameraTarget, cameraPosition));
  const right = normalizeVector(cross(forward, { x: 0, y: 1, z: 0 }));
  return {
    right,
    up: normalizeVector(cross(right, forward)),
    towardCamera: normalizeVector(subtract(cameraPosition, cameraTarget)),
  };
}

test('all six polyhedra have the expected outward convex faces and unique values', () => {
  assert.deepEqual(DICE_TYPES, ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']);
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    assert.equal(definition.faces.length, definition.sides);
    assert.deepEqual([...definition.faceValues].sort((a, b) => a - b), Array.from({ length: definition.sides }, (_, index) => index + 1));
    definition.faces.forEach((face) => {
      assert.ok(face.length >= 3);
      const points = face.map((index) => definition.vertices[index]);
      const normal = cross(subtract(points[1], points[0]), subtract(points[2], points[0]));
      assert.ok(dot(normal, centroid(points)) > 0, `${type} has inward face winding`);
    });
    const shape = new CANNON.ConvexPolyhedron({
      vertices: definition.vertices.map((vertex) => new CANNON.Vec3(vertex.x, vertex.y, vertex.z)),
      faces: definition.faces.map((face) => [...face]),
    });
    assert.equal(shape.faces.length, definition.sides);
  }
});

test('every polygon is triangulated with UVs contained in its atlas cell', () => {
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    const data = createDiceBufferData(type);
    const expectedTriangles = definition.faces.reduce((total, face) => total + (face.length === 3 ? 1 : face.length), 0);
    assert.equal(data.positions.length, expectedTriangles * 9);
    assert.equal(data.normals.length, expectedTriangles * 9);
    assert.equal(data.uvs.length, expectedTriangles * 6);

    let uvOffset = 0;
    definition.faces.forEach((face, faceIndex) => {
      const uvCount = (face.length === 3 ? 1 : face.length) * 6;
      const faceUvs = data.uvs.slice(uvOffset, uvOffset + uvCount);
      const column = faceIndex % definition.atlas.columns;
      const row = Math.floor(faceIndex / definition.atlas.columns);
      for (let index = 0; index < faceUvs.length; index += 2) {
        assert.ok(faceUvs[index] > column / definition.atlas.columns);
        assert.ok(faceUvs[index] < (column + 1) / definition.atlas.columns);
        assert.ok(faceUvs[index + 1] > 1 - (row + 1) / definition.atlas.rows);
        assert.ok(faceUvs[index + 1] < 1 - row / definition.atlas.rows);
      }
      uvOffset += uvCount;
    });
  }
});

test('triangular dice retain the original upright face UV layout', () => {
  assert.deepEqual(createFaceUvCoordinates('d20', 0), [
    { x: 0.1, y: 0.98 },
    { x: 0.016, y: 0.77 },
    { x: 0.184, y: 0.77 },
  ]);

  for (const type of ['d4', 'd8', 'd20']) {
    const definition = DICE_DEFINITIONS[type];
    definition.faces.forEach((_, faceIndex) => {
      const [apex, left, right] = createFaceUvCoordinates(type, faceIndex);
      assert.ok(apex.y > left.y);
      assert.equal(left.y, right.y);
      assert.ok(Math.abs(apex.x - (left.x + right.x) / 2) < 1e-12);
    });
  }
});

test('locked quad and pentagon UV polygons remain centered in their atlas cells', () => {
  for (const type of ['d6', 'd12']) {
    const definition = DICE_DEFINITIONS[type];
    definition.faces.forEach((face, faceIndex) => {
      const coordinates = createFaceUvCoordinates(type, faceIndex);
      const average = coordinates.reduce((total, point) => ({
        x: total.x + point.x / coordinates.length,
        y: total.y + point.y / coordinates.length,
      }), { x: 0, y: 0 });
      const column = faceIndex % definition.atlas.columns;
      const row = Math.floor(faceIndex / definition.atlas.columns);
      assert.equal(coordinates.length, face.length);
      assert.ok(Math.abs(average.x - (column + 0.5) / definition.atlas.columns) < 1e-12);
      assert.ok(Math.abs(average.y - (1 - (row + 0.5) / definition.atlas.rows)) < 1e-12);
    });
  }
});

test('D10 atlas kites preserve their physical face proportions', () => {
  const definition = DICE_DEFINITIONS.d10;
  definition.faces.forEach((face, faceIndex) => {
    const physical = face.map((vertexIndex) => definition.vertices[vertexIndex]);
    const atlas = getFaceUvPolygon('d10', faceIndex);
    const scales = [];
    for (let start = 0; start < face.length; start += 1) {
      for (let end = start + 1; end < face.length; end += 1) {
        const physicalDistance = Math.hypot(
          physical[end].x - physical[start].x,
          physical[end].y - physical[start].y,
          physical[end].z - physical[start].z,
        );
        const atlasDistance = Math.hypot(atlas[end].x - atlas[start].x, atlas[end].y - atlas[start].y);
        scales.push(atlasDistance / physicalDistance);
      }
    }
    assert.ok(Math.max(...scales) - Math.min(...scales) < 1e-12, `D10 face ${faceIndex} distorted its atlas projection`);
    const anchor = getFaceLabelAnchor('d10', faceIndex);
    assert.ok(Math.abs(anchor.x - 0.5) < 1e-12);
    assert.ok(Math.abs(anchor.y - 0.5) < 1e-12);
    assert.ok(pointInsideConvexPolygon(anchor, getFaceLabelSafePolygon('d10', faceIndex)));
  });
});

test('D6 and D12 visual baselines remain unchanged', () => {
  assert.equal(DICE_DEFINITIONS.d6.physics.radius, 0.94);
  assert.equal(DICE_DEFINITIONS.d12.physics.radius, 0.98);
  assert.deepEqual(getFaceLabelLayout('d6', 1), { fontSize: 80, centerY: 0.5, underlineY: 0.69, lineWidth: 8 });
  assert.deepEqual(getFaceLabelLayout('d6', 6), { fontSize: 80, centerY: 0.5, underlineY: 0.69, lineWidth: 8 });
  assert.deepEqual(getFaceLabelLayout('d12', 1), { fontSize: 80, centerY: 0.5, underlineY: 0.69, lineWidth: 8 });
  assert.deepEqual(getFaceLabelLayout('d12', 12), { fontSize: 68, centerY: 0.5, underlineY: 0.69, lineWidth: 8 });
  assert.deepEqual(createFaceUvCoordinates('d6', 0), [
    { x: 0.058243626884729394, y: 0.912634559672906 },
    { x: 0.275089706448604, y: 0.912634559672906 },
    { x: 0.275089706448604, y: 0.587365440327094 },
    { x: 0.058243626884729394, y: 0.587365440327094 },
  ]);
  assert.deepEqual(createFaceUvCoordinates('d12', 0), [
    { x: 0.057404695986365606, y: 0.9573826058041586 },
    { x: 0.1925953040136344, y: 0.9573826058041586 },
    { x: 0.23437149937394267, y: 0.7859507275291747 },
    { x: 0.125, y: 0.6799999999999999 },
    { x: 0.015628500626057334, y: 0.7859507275291747 },
  ]);
});

test('D8 and D20 labels use triangle centroids and safe inset sizing', () => {
  assert.deepEqual(getFaceLabelLayout('d8', 8), {
    fontSize: 85,
    centerY: 0.6399999999999999,
    underlineY: 0.7799999999999999,
    lineWidth: 9,
  });
  assert.deepEqual(getFaceLabelLayout('d20', 11), {
    fontSize: 68,
    centerY: 0.6399999999999999,
    underlineY: 0.7799999999999999,
    lineWidth: 8.25,
  });
  for (const type of ['d8', 'd20']) {
    const definition = DICE_DEFINITIONS[type];
    for (const value of definition.faceValues) {
      const faceIndex = definition.faceValues.indexOf(value);
      const layout = getFaceLabelLayout(type, value);
      const anchor = getFaceLabelAnchor(type, faceIndex);
      const polygon = getFaceUvPolygon(type, faceIndex);
      const safePolygon = getFaceLabelSafePolygon(type, faceIndex);
      assert.ok(Math.abs(anchor.x - 0.5) < 1e-12);
      assert.ok(Math.abs(anchor.y - polygon.reduce((total, point) => total + point.y / 3, 0)) < 1e-12);
      assert.ok(pointInsideConvexPolygon(anchor, safePolygon));
      assert.ok(layout.centerY > 0.63 && layout.centerY < 0.65);
    }
  }
});

test('every possible result aligns its matching face with world-up', () => {
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    for (let value = 1; value <= definition.sides; value += 1) {
      const quaternion = rotationForValue(type, value, value * 0.271);
      assert.equal(topFaceValue(type, quaternion), value);
      const faceIndex = definition.faceValues.indexOf(value);
      const transformed = rotateVector(definition.resultDirections[faceIndex], quaternion);
      assert.ok(transformed.y > 0.999999);
      assert.ok(restingHeightForValue(type, value, value * 0.271) > 0);
    }
  }
});

test('every final presentation keeps its result screen-up and camera-facing', () => {
  const { right, up, towardCamera } = cameraBasis();
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    for (const value of definition.faceValues) {
      const quaternion = presentationRotationForValue(type, value);
      assert.equal(topFaceValue(type, quaternion), value);
      assert.ok(restingHeightForQuaternion(type, quaternion) > 0);
      const visible = getResultLabelCandidates(type, value).map((candidate) => {
        const labelUp = rotateVector(candidate.labelUp, quaternion);
        const normal = rotateVector(definition.faceNormals[candidate.faceIndex], quaternion);
        const screenX = dot(labelUp, right);
        const screenY = dot(labelUp, up);
        return {
          facing: dot(normal, towardCamera),
          uprightness: screenY / Math.hypot(screenX, screenY),
        };
      }).filter(({ facing }) => facing > 0.02);
      assert.ok(visible.length > 0, `${type} value ${value} had no camera-facing result label`);
      assert.ok(Math.max(...visible.map(({ uprightness }) => uprightness)) > 0.995, `${type} value ${value} was not screen-up`);
    }
  }
});

test('D4 uses stable upper-vertex results and reference-style corner markings', () => {
  const definition = DICE_DEFINITIONS.d4;
  assert.equal(definition.resultMode, 'vertex');
  assert.equal(definition.labelMode, 'vertex-triplet');
  assert.deepEqual(getFaceLabelLayout('d4', 1), { fontSize: 36, centerY: 0.5, underlineY: 0.72, lineWidth: 4 });
  const markingCounts = new Map(definition.faceValues.map((value) => [value, 0]));

  definition.faces.forEach((face, faceIndex) => {
    const markings = getD4FaceMarkings(faceIndex);
    const polygon = getFaceUvPolygon('d4', faceIndex);
    const center = getFaceLabelAnchor('d4', faceIndex);
    assert.equal(markings.length, 3);
    assert.deepEqual(
      markings.map(({ value }) => value).sort((a, b) => a - b),
      face.map((vertexIndex) => vertexIndex + 1).sort((a, b) => a - b),
    );
    markings.forEach((marking, cornerIndex) => {
      markingCounts.set(marking.value, markingCounts.get(marking.value) + 1);
      const cornerDistance = Math.hypot(polygon[cornerIndex].x - center.x, polygon[cornerIndex].y - center.y);
      const markingDistance = Math.hypot(marking.x - center.x, marking.y - center.y);
      assert.ok(Math.abs(markingDistance / cornerDistance - 0.68) < 1e-12);
      assert.ok(pointInsideConvexPolygon({ x: marking.x, y: marking.y }, getFaceLabelSafePolygon('d4', faceIndex)));
    });
    assert.deepEqual(markings.map(({ rotation }) => rotation), [0, -Math.PI / 3, Math.PI / 3]);
  });
  assert.deepEqual([...markingCounts.values()], [3, 3, 3, 3]);

  for (let value = 1; value <= 4; value += 1) {
    const quaternion = rotationForValue('d4', value, value * 0.31);
    const heights = definition.vertices.map((vertex) => rotateVector(vertex, quaternion).y);
    assert.ok(heights[value - 1] > 0.999999);
    const baseHeights = heights.filter((_, index) => index !== value - 1);
    assert.ok(Math.max(...baseHeights) - Math.min(...baseHeights) < 1e-12);
    assert.equal(topFaceValue('d4', quaternion), value);
  }
});

test('D4 nearest-result targets apply only the minimum vertex-up tilt', () => {
  const definition = DICE_DEFINITIONS.d4;
  for (const value of definition.faceValues) {
    for (const euler of [[0.37, -0.82, 1.14], [-0.66, 0.41, -1.27], [1.03, 0.72, 0.19]]) {
      const current = new CANNON.Quaternion();
      current.setFromEuler(...euler);
      const target = nearestRotationForValue('d4', value, current);
      assert.equal(topFaceValue('d4', target), value);
      const direction = rotateVector(definition.resultDirections[value - 1], current);
      const requiredTilt = Math.acos(Math.max(-1, Math.min(1, direction.y)));
      const quaternionDot = Math.abs(current.x * target.x + current.y * target.y + current.z * target.z + current.w * target.w);
      const appliedRotation = 2 * Math.acos(Math.max(-1, Math.min(1, quaternionDot)));
      assert.ok(Math.abs(appliedRotation - requiredTilt) < 1e-10, `D4 value ${value} received an extra yaw correction`);
    }
  }
});

test('D10 has compact reference-like proportions', () => {
  const vertices = DICE_DEFINITIONS.d10.vertices;
  const span = (axis) => Math.max(...vertices.map((vertex) => vertex[axis])) - Math.min(...vertices.map((vertex) => vertex[axis]));
  const ratio = span('y') / Math.max(span('x'), span('z'));
  assert.ok(ratio >= 1.06 && ratio <= 1.1, `D10 ratio was ${ratio}`);
});

test('polygon render fans anchor their atlas center at the physical area centroid', () => {
  for (const type of ['d6', 'd10', 'd12']) {
    const definition = DICE_DEFINITIONS[type];
    const data = createDiceBufferData(type);
    let positionOffset = 0;
    let uvOffset = 0;
    definition.faces.forEach((face, faceIndex) => {
      const center = getFaceAreaCentroid(type, faceIndex);
      const column = faceIndex % definition.atlas.columns;
      const row = Math.floor(faceIndex / definition.atlas.columns);
      const expectedUv = [(column + 0.5) / definition.atlas.columns, 1 - (row + 0.5) / definition.atlas.rows];
      for (let triangleIndex = 0; triangleIndex < face.length; triangleIndex += 1) {
        const positionIndex = positionOffset + triangleIndex * 9;
        const triangleUvIndex = uvOffset + triangleIndex * 6;
        assert.ok(Math.abs(data.positions[positionIndex] - center.x * definition.physics.radius) < 1e-12);
        assert.ok(Math.abs(data.positions[positionIndex + 1] - center.y * definition.physics.radius) < 1e-12);
        assert.ok(Math.abs(data.positions[positionIndex + 2] - center.z * definition.physics.radius) < 1e-12);
        assert.ok(Math.abs(data.uvs[triangleUvIndex] - expectedUv[0]) < 1e-12);
        assert.ok(Math.abs(data.uvs[triangleUvIndex + 1] - expectedUv[1]) < 1e-12);
      }
      positionOffset += face.length * 9;
      uvOffset += face.length * 6;
    });
  }
});

test('D8 and D20 use the balanced body and font compensation', () => {
  assert.equal(DICE_DEFINITIONS.d8.physics.radius, 1.02);
  assert.equal(DICE_DEFINITIONS.d20.physics.radius, 1.034);
  assert.equal(getFaceLabelLayout('d8', 8).fontSize, 85);
  assert.equal(getFaceLabelLayout('d20', 9).fontSize, 78);
  assert.equal(getFaceLabelLayout('d20', 19).fontSize, 68);
});

test('secure rejection sampling is unbiased for every supported side count', () => {
  for (const type of DICE_TYPES) {
    const sides = DICE_DEFINITIONS[type].sides;
    const limit = getAcceptanceLimit(sides);
    assert.equal(limit % sides, 0);
    assert.ok(limit <= UINT32_RANGE);
    if (limit < UINT32_RANGE) {
      const supplied = [limit, UINT32_RANGE - 1, 0];
      assert.equal(getSecureRoll(sides, () => supplied.shift()), 1);
    }
    assert.equal(getSecureRoll(sides, () => sides - 1), sides);
    assert.equal(getSecureRoll(sides, () => sides), 1);
  }
});

test('seeded launch generation is deterministic, complete, and range-safe', () => {
  const definition = DICE_DEFINITIONS.d20;
  const seed = [0x12345678, 0x9abcdef0, 0x0fedcba9, 0x87654321];
  const first = createRollLaunch(definition, seed);
  const repeat = createRollLaunch(definition, seed);
  const different = createRollLaunch(definition, seedWordsFor(99, 7));
  assert.deepEqual(first, repeat);
  assert.notDeepEqual(first, different);

  for (const component of ['position', 'velocity', 'quaternion', 'spinAxis', 'angularVelocity']) {
    assert.notDeepEqual(first[component], different[component], `${component} did not vary with the seed`);
  }
  assert.notEqual(first.spinSpeed, different.spinSpeed);
  assert.ok(first.position.x >= -0.9 && first.position.x <= 0.9);
  assert.ok(first.position.y >= definition.physics.launchY[0] && first.position.y <= definition.physics.launchY[1]);
  assert.ok(first.position.z >= -2.25 && first.position.z <= -1.85);
  assert.ok(first.velocity.x >= -0.55 && first.velocity.x <= 0.55);
  assert.ok(first.velocity.y >= -0.2 && first.velocity.y <= 0.4);
  assert.ok(first.velocity.z >= 2.9 && first.velocity.z <= 3.55);
  assert.ok(first.spinSpeed >= definition.physics.spin[0] && first.spinSpeed <= definition.physics.spin[1]);
  assert.ok(Math.abs(Math.hypot(first.quaternion.x, first.quaternion.y, first.quaternion.z, first.quaternion.w) - 1) < 1e-12);
  assert.ok(Math.abs(Math.hypot(first.spinAxis.x, first.spinAxis.y, first.spinAxis.z) - 1) < 1e-12);

  const zeroSeedRandom = createSeededRandom([0, 0, 0, 0]);
  const zeroSeedOutput = Array.from({ length: 8 }, () => zeroSeedRandom.nextUint32());
  assert.ok(zeroSeedOutput.some((value) => value !== 0));
  assert.ok(new Set(zeroSeedOutput).size > 1);
});

test('seeded launch orientations and spin axes are statistically isotropic', () => {
  const sampleCount = 12000;
  const axisTotals = { x: 0, y: 0, z: 0 };
  const axisSquares = { x: 0, y: 0, z: 0 };
  const countsByType = new Map(DICE_TYPES.map((type) => [
    type,
    Array(DICE_DEFINITIONS[type].sides).fill(0),
  ]));

  for (let index = 0; index < sampleCount; index += 1) {
    const seed = seedWordsFor(index, 17);
    const launch = createRollLaunch(DICE_DEFINITIONS.d20, seed);
    for (const axis of ['x', 'y', 'z']) {
      axisTotals[axis] += launch.spinAxis[axis];
      axisSquares[axis] += launch.spinAxis[axis] ** 2;
    }
    assert.ok(Math.abs(Math.hypot(
      launch.quaternion.x,
      launch.quaternion.y,
      launch.quaternion.z,
      launch.quaternion.w,
    ) - 1) < 1e-12);

    for (const type of DICE_TYPES) {
      const value = topFaceValue(type, launch.quaternion);
      countsByType.get(type)[value - 1] += 1;
    }
  }

  for (const axis of ['x', 'y', 'z']) {
    assert.ok(Math.abs(axisTotals[axis] / sampleCount) < 0.025, `${axis} spin-axis mean was biased`);
    assert.ok(Math.abs(axisSquares[axis] / sampleCount - 1 / 3) < 0.025, `${axis} spin-axis variance was biased`);
  }
  for (const type of DICE_TYPES) {
    const counts = countsByType.get(type);
    const expected = sampleCount / counts.length;
    const chiSquare = counts.reduce((total, count) => total + (count - expected) ** 2 / expected, 0);
    assert.ok(chiSquare < counts.length * 4, `${type} initial orientations were biased: chi-square ${chiSquare}`);
  }
});

test('a fixed-seed physics corpus shows no meaningful outcome bias', () => {
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    world.allowSleep = false;
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 14;
    const diceMaterial = new CANNON.Material(`${type}-dice`);
    const groundMaterial = new CANNON.Material(`${type}-ground`);
    const wallMaterial = new CANNON.Material(`${type}-walls`);
    world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial, groundMaterial, {
      friction: 0.28,
      restitution: definition.physics.restitution,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    }));
    world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial, wallMaterial, {
      friction: WALL_FRICTION,
      restitution: WALL_RESTITUTION,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    }));
    addTrayPhysics(world, groundMaterial, wallMaterial);
    const body = new CANNON.Body({
      mass: definition.physics.mass,
      material: diceMaterial,
      shape: createDiceCollider(definition),
      linearDamping: definition.physics.linearDamping,
      angularDamping: definition.physics.angularDamping,
      allowSleep: false,
    });
    world.addBody(body);

    const samplesPerFace = 20;
    const sampleCount = definition.sides * samplesPerFace;
    const counts = Array(definition.sides).fill(0);
    for (let index = 0; index < sampleCount; index += 1) {
      const launch = createRollLaunch(definition, seedWordsFor(index, DICE_TYPES.indexOf(type) + 31));
      body.position.set(launch.position.x, launch.position.y, launch.position.z);
      body.velocity.set(launch.velocity.x, launch.velocity.y, launch.velocity.z);
      body.quaternion.set(
        launch.quaternion.x,
        launch.quaternion.y,
        launch.quaternion.z,
        launch.quaternion.w,
      );
      body.angularVelocity.set(
        launch.angularVelocity.x,
        launch.angularVelocity.y,
        launch.angularVelocity.z,
      );
      body.force.setZero();
      body.torque.setZero();
      body.wakeUp();
      body.aabbNeedsUpdate = true;
      world.broadphase.dirty = true;
      for (let frame = 0; frame < 420; frame += 1) world.step(1 / 120);
      counts[topFaceValue(type, body.quaternion) - 1] += 1;
    }

    const expected = sampleCount / definition.sides;
    const chiSquare = counts.reduce((total, count) => total + (count - expected) ** 2 / expected, 0);
    assert.ok(counts.every((count) => count > 0), `${type} omitted a result in the physics corpus: ${counts}`);
    assert.ok(chiSquare < definition.sides * 5, `${type} physics corpus was biased: chi-square ${chiSquare}; counts ${counts}`);
  }
});

test('the animated physics path contains no Math.random calls', () => {
  for (const path of ['src/roll-random.js', 'src/dice-scene.js']) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.equal(source.includes('Math.random'), false, `${path} contains Math.random`);
  }
});

test('D10 uses the values 1 through 10', () => {
  assert.deepEqual(DICE_DEFINITIONS.d10.faceValues, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('D20 outcome boundaries remain unchanged', () => {
  assert.equal(getOutcome(1).state, 'criticalFailure');
  for (let value = 2; value <= 14; value += 1) assert.equal(getOutcome(value).state, 'failure');
  for (let value = 15; value <= 19; value += 1) assert.equal(getOutcome(value).state, 'success');
  assert.equal(getOutcome(20).state, 'critical');
});

test('D20 criticals use the natural face while ordinary outcomes use the modified total', () => {
  assert.equal(getOutcome(1, 21, true).state, 'criticalFailure');
  assert.equal(getOutcome(20, 0, true).state, 'critical');
  assert.equal(getOutcome(14, 15, true).state, 'success');
  assert.equal(getOutcome(15, 14, true).state, 'failure');

  assert.equal(getOutcome(1, 21, false).state, 'success');
  assert.equal(getOutcome(20, 0, false).state, 'failure');
});

test('D20 outcomes support a custom difficulty and a neutral disabled state', () => {
  const customRules = { criticalsEnabled: false, difficultyEnabled: true, difficulty: 18 };
  assert.equal(getOutcome(12, 17, customRules).state, 'failure');
  assert.equal(getOutcome(12, 18, customRules).state, 'success');

  const criticalsOnly = { criticalsEnabled: true, difficultyEnabled: false, difficulty: 18 };
  assert.equal(getOutcome(1, 21, criticalsOnly).state, 'criticalFailure');
  assert.equal(getOutcome(20, 0, criticalsOnly).state, 'critical');
  assert.equal(getOutcome(12, 99, criticalsOnly).state, 'neutral');

  const noEvaluation = { criticalsEnabled: false, difficultyEnabled: false, difficulty: 18 };
  assert.equal(getOutcome(1, 99, noEvaluation).state, 'neutral');
  assert.equal(getOutcome(20, -99, noEvaluation).state, 'neutral');
});

test('settling assistance waits for low energy or the fallback deadline', () => {
  assert.equal(SAFETY_CORRECTION_START_SECONDS, 3.6);
  assert.equal(PHYSICAL_ROLL_LIMIT_SECONDS, 3.85);
  const lowEnergy = {
    elapsed: SETTLE_GRACE_SECONDS,
    position: { x: 0.8, y: 0.9, z: -0.5 },
    restHeight: 0.72,
    linearVelocity: { x: 0.3, y: 0.15, z: 0.2 },
    angularVelocity: { x: 1.1, y: 0.8, z: 0.5 },
    collisionCount: 1,
  };

  assert.equal(shouldBeginSettleAssist({ ...lowEnergy, elapsed: SETTLE_GRACE_SECONDS - 0.001 }), false);
  assert.equal(shouldBeginSettleAssist({ ...lowEnergy, collisionCount: 0 }), false);
  assert.equal(shouldBeginSettleAssist({ ...lowEnergy, position: { ...lowEnergy.position, y: 1.28 } }), false);
  assert.equal(shouldBeginSettleAssist({ ...lowEnergy, linearVelocity: { x: 1.3, y: 0, z: 0 } }), false);
  assert.equal(shouldBeginSettleAssist({ ...lowEnergy, angularVelocity: { x: 5.1, y: 0, z: 0 } }), false);
  assert.equal(shouldBeginSettleAssist(lowEnergy), true);
  assert.equal(shouldBeginSettleAssist({
    ...lowEnergy,
    elapsed: SETTLE_FALLBACK_SECONDS - 0.001,
    position: { ...lowEnergy.position, y: 2.4 },
    linearVelocity: { x: 3, y: 2, z: 1 },
    angularVelocity: { x: 8, y: 7, z: 6 },
  }), false);
  assert.equal(shouldBeginSettleAssist({
    ...lowEnergy,
    elapsed: SETTLE_FALLBACK_SECONDS,
    collisionCount: 0,
    position: { ...lowEnergy.position, y: 2.4 },
    linearVelocity: { x: 3, y: 2, z: 1 },
    angularVelocity: { x: 8, y: 7, z: 6 },
  }), true);

  assert.equal(getSettleAssistProgress(0), 0);
  assert.equal(getSettleAssistProgress(0.625), 0.5);
  assert.equal(getSettleAssistProgress(1.25), 1);
});

test('hidden tray walls preserve their lower boundary and flare outward by ten degrees', () => {
  assert.equal(TRAY_RADIUS, 4.75);
  assert.ok(Math.abs(TRAY_APOTHEM - TRAY_RADIUS * Math.cos(Math.PI / 8)) < 1e-12);
  assert.ok(Math.abs(WALL_FLARE_RADIANS - Math.PI / 18) < 1e-12);
  assert.equal(WALL_FRICTION, 0.12);
  assert.equal(WALL_RESTITUTION, 0.08);

  const world = new CANNON.World();
  const groundMaterial = new CANNON.Material('test-ground');
  const wallMaterial = new CANNON.Material('test-walls');
  const { groundBody, wallBodies } = addTrayPhysics(world, groundMaterial, wallMaterial);
  assert.equal(world.bodies.length, 9);
  assert.equal(wallBodies.length, 8);
  assert.equal(groundBody.position.y, -0.15);

  for (let index = 0; index < wallBodies.length; index += 1) {
    const wall = wallBodies[index];
    const descriptor = getWallColliderDescriptor(index);
    const bottomInner = wall.quaternion.vmult(new CANNON.Vec3(0, -WALL_HALF_HEIGHT, -WALL_HALF_THICKNESS));
    bottomInner.vadd(wall.position, bottomInner);
    const topInner = wall.quaternion.vmult(new CANNON.Vec3(0, WALL_HALF_HEIGHT, -WALL_HALF_THICKNESS));
    topInner.vadd(wall.position, topInner);

    assert.ok(Math.abs(Math.hypot(bottomInner.x, bottomInner.z) - WALL_BOTTOM_INNER_RADIUS) < 1e-10);
    assert.ok(Math.abs(bottomInner.y - WALL_BOTTOM_Y) < 1e-10);
    assert.ok(Math.abs(Math.hypot(topInner.x, topInner.z) - descriptor.topInnerRadius) < 1e-10);
    assert.ok(descriptor.topInnerRadius > descriptor.bottomInnerRadius);
  }
});

test('active dice contacts distinguish tabletop and wall support', () => {
  const dice = new CANNON.Body({ mass: 1 });
  const ground = new CANNON.Body({ mass: 0 });
  const wall = new CANNON.Body({ mass: 0 });
  const other = new CANNON.Body({ mass: 0 });
  const walls = new Set([wall]);

  assert.deepEqual(classifyDiceContacts([], dice, ground, walls), { touchingGround: false, touchingWall: false });
  assert.deepEqual(
    classifyDiceContacts([{ bi: dice, bj: ground }], dice, ground, walls),
    { touchingGround: true, touchingWall: false },
  );
  assert.deepEqual(
    classifyDiceContacts([{ bi: wall, bj: dice }], dice, ground, walls),
    { touchingGround: false, touchingWall: true },
  );
  assert.deepEqual(
    classifyDiceContacts([{ bi: dice, bj: ground }, { bi: wall, bj: dice }, { bi: dice, bj: other }], dice, ground, walls),
    { touchingGround: true, touchingWall: true },
  );
});

test('an elevated body slides inward from a flared low-friction wall', () => {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
  const diceMaterial = new CANNON.Material('slide-dice');
  const groundMaterial = new CANNON.Material('slide-ground');
  const wallMaterial = new CANNON.Material('slide-wall');
  world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial, groundMaterial, {
    friction: 0.28,
    restitution: 0.35,
  }));
  world.addContactMaterial(new CANNON.ContactMaterial(diceMaterial, wallMaterial, {
    friction: WALL_FRICTION,
    restitution: WALL_RESTITUTION,
  }));
  addTrayPhysics(world, groundMaterial, wallMaterial);

  const descriptor = getWallColliderDescriptor(0);
  const startRadius = 3.95;
  const body = new CANNON.Body({
    mass: 1,
    material: diceMaterial,
    shape: new CANNON.Sphere(0.4),
    position: new CANNON.Vec3(
      Math.sin(descriptor.angle) * startRadius,
      1,
      Math.cos(descriptor.angle) * startRadius,
    ),
    linearDamping: 0.05,
  });
  world.addBody(body);
  for (let step = 0; step < 120; step += 1) world.step(1 / 120);

  assert.ok(Math.hypot(body.position.x, body.position.z) < startRadius - 0.5);
  assert.ok(body.position.y < 0.45);
});

test('natural completion requires actual tabletop support at resting height', () => {
  const landed = {
    touchingGround: true,
    positionY: 0.8,
    restHeight: 0.8,
    alignment: 1,
    topMatches: true,
    linearVelocitySquared: 0,
    angularVelocitySquared: 0,
  };
  assert.equal(LANDING_HEIGHT_TOLERANCE, 0.06);
  assert.equal(isValidTabletopLanding(landed), true);
  assert.equal(isValidTabletopLanding({ ...landed, touchingGround: false }), false);
  assert.equal(isValidTabletopLanding({ ...landed, positionY: landed.restHeight + LANDING_HEIGHT_TOLERANCE + 0.001 }), false);
  assert.equal(isValidTabletopLanding({ ...landed, topMatches: false }), false);
  assert.equal(isValidTabletopLanding({ ...landed, linearVelocitySquared: 0.018 }), false);
  assert.equal(isValidTabletopLanding({ ...landed, angularVelocitySquared: 0.035 }), false);
});

test('rolling bodies remain awake until completion restores sleeping', () => {
  const body = new CANNON.Body({ mass: 1, allowSleep: true });
  body.sleep();
  setRollingSleepState(body, true);
  assert.equal(body.allowSleep, false);
  assert.equal(body.sleepState, CANNON.Body.AWAKE);
  setRollingSleepState(body, false);
  assert.equal(body.allowSleep, true);
  body.sleep();
  assert.equal(body.sleepState, CANNON.Body.SLEEPING);
});

test('border stalls require a continuous delay before capped rescue impulses', () => {
  let state = { stallStartedAt: null, rescueCount: 0, lastRescueAt: -Infinity };
  const input = {
    elapsed: BORDER_STALL_START_SECONDS + 0.1,
    position: { x: 3.5, y: 1.4, z: 0.2 },
    restHeight: 0.72,
    linearVelocity: { x: 0.05, y: 0, z: 0.03 },
    angularVelocity: { x: 0.1, y: 0.08, z: 0.04 },
    collisionCount: 2,
    mass: 1,
    radius: 1,
    safeRadius: 3.2,
    touchingWall: true,
  };

  const noWallContact = updateBorderStall({ ...input, touchingWall: false, now: 2200 });
  assert.equal(noWallContact.rescue, null);
  assert.equal(noWallContact.stallStartedAt, null);

  const tooEarly = updateBorderStall({ ...input, elapsed: BORDER_STALL_START_SECONDS - 0.001, ...state, now: 2000 });
  assert.equal(tooEarly.rescue, null);
  assert.equal(tooEarly.stallStartedAt, null);

  state = updateBorderStall({ ...input, ...state, now: 2200 });
  assert.equal(state.rescue, null);
  assert.equal(state.stallStartedAt, 2200);
  const beforeDuration = updateBorderStall({ ...input, ...state, now: 2200 + BORDER_STALL_DURATION_MS - 1 });
  assert.equal(beforeDuration.rescue, null);
  const firstResult = updateBorderStall({ ...input, ...beforeDuration, now: 2200 + BORDER_STALL_DURATION_MS });
  const firstRescue = firstResult.rescue;
  state = firstResult;
  assert.ok(firstRescue);
  assert.equal(state.rescueCount, 1);
  assert.equal(state.stallStartedAt, null);
  assert.ok(firstRescue.impulse.x * input.position.x + firstRescue.impulse.z * input.position.z < 0);
  assert.ok(firstRescue.impulse.y < 0);

  const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(1) });
  body.applyImpulse(
    new CANNON.Vec3(firstRescue.impulse.x, firstRescue.impulse.y, firstRescue.impulse.z),
    new CANNON.Vec3(firstRescue.relativePoint.x, firstRescue.relativePoint.y, firstRescue.relativePoint.z),
  );
  assert.ok(body.velocity.x * input.position.x + body.velocity.z * input.position.z < 0);
  assert.ok(body.velocity.y < 0);
  assert.ok(body.angularVelocity.lengthSquared() > 0);

  const resumedMotion = updateBorderStall({
    ...input,
    ...state,
    position: { x: 1, y: input.restHeight, z: 0 },
    now: state.lastRescueAt + 10,
  });
  assert.equal(resumedMotion.stallStartedAt, null);

  let secondState = updateBorderStall({
    ...input,
    ...state,
    now: state.lastRescueAt + 10,
  });
  const beforeCooldown = updateBorderStall({
    ...input,
    ...secondState,
    now: state.lastRescueAt + BORDER_RESCUE_COOLDOWN_MS - 1,
  });
  assert.equal(beforeCooldown.rescue, null);
  const secondRescue = updateBorderStall({
    ...input,
    ...beforeCooldown,
    now: state.lastRescueAt + BORDER_RESCUE_COOLDOWN_MS,
  });
  assert.ok(secondRescue.rescue);
  assert.equal(secondRescue.rescueCount, MAX_BORDER_RESCUES);
  const capped = updateBorderStall({
    ...input,
    ...secondRescue,
    stallStartedAt: secondRescue.lastRescueAt,
    now: secondRescue.lastRescueAt + Math.max(BORDER_RESCUE_COOLDOWN_MS, BORDER_STALL_DURATION_MS),
  });
  assert.equal(capped.rescue, null);
  assert.equal(capped.rescueCount, MAX_BORDER_RESCUES);
});

test('safe final positioning preserves landings and only clamps wall overlaps', () => {
  assert.deepEqual(clampPlanarPosition({ x: 1.25, z: -0.8 }, 3.2), { x: 1.25, z: -0.8 });
  const clamped = clampPlanarPosition({ x: 3, z: 4 }, 3.2);
  assert.ok(Math.abs(Math.hypot(clamped.x, clamped.z) - 3.2) < 1e-12);
  assert.ok(Math.abs(clamped.x / clamped.z - 3 / 4) < 1e-12);
});

test('recentering uses a 200ms position-only smoothstep to exact center', () => {
  assert.equal(RECENTER_DURATION_MS, 200);
  const start = { x: 2.4, y: 0.83, z: -1.6 };
  assert.deepEqual(getRecenteringPosition(start, 0), { ...start, progress: 0 });
  assert.deepEqual(getRecenteringPosition(start, 100), { x: 1.2, y: 0.83, z: -0.8, progress: 0.5 });
  assert.deepEqual(getRecenteringPosition(start, 200), { x: 0, y: 0.83, z: 0, progress: 1 });
  assert.deepEqual(getRecenteringPosition(start, 400), { x: 0, y: 0.83, z: 0, progress: 1 });
  assert.deepEqual(
    getRecenteringPosition(start, 100, 200, { x: 1.15, z: 0 }),
    { x: 1.775, y: 0.83, z: -0.8, progress: 0.5 },
  );
});

test('recentering and finalization preserve the captured landing quaternion exactly', () => {
  const type = 'd20';
  const value = 13;
  const quaternionData = rotationForValue(type, value, 1.237);
  const landingQuaternion = new CANNON.Quaternion(
    quaternionData.x,
    quaternionData.y,
    quaternionData.z,
    quaternionData.w,
  );
  const restHeight = restingHeightForQuaternion(type, landingQuaternion);
  const scene = Object.create(DiceScene.prototype);
  scene.state = 'settling';
  scene.diceType = type;
  scene.definition = DICE_DEFINITIONS[type];
  scene.canvas = { dataset: {} };
  scene.diceCount = 1;
  const body = new CANNON.Body({
    mass: scene.definition.physics.mass,
    shape: createDiceCollider(scene.definition),
  });
  body.position.set(1.4, restHeight, -0.85);
  const actor = {
    index: 0,
    body,
    phase: 'settling',
    finalQuaternion: new CANNON.Quaternion(),
  };
  scene.actors = [actor];
  scene.resultValues = [];
  scene.reducedMotion = false;
  scene.syncActorMesh = () => {};
  scene.setState = (state) => { scene.state = state; };
  scene.onSettled = (result) => { scene.settledResult = result; };

  scene.finishActorRoll(actor, { value, quaternion: landingQuaternion, restHeight });
  assert.equal(actor.phase, 'landed');
  const recenterStartedAt = 1000;
  scene.beginRecentering(recenterStartedAt);
  assert.equal(scene.state, 'recentering');
  assert.deepEqual(quaternionComponents(actor.body.quaternion), quaternionComponents(landingQuaternion));

  scene.updateRecentering(actor, recenterStartedAt + RECENTER_DURATION_MS / 2);
  assert.deepEqual(quaternionComponents(actor.body.quaternion), quaternionComponents(landingQuaternion));
  scene.updateRecentering(actor, recenterStartedAt + RECENTER_DURATION_MS);
  assert.equal(scene.state, 'complete');
  assert.deepEqual(scene.settledResult, [value]);
  assert.equal(scene.canvas.dataset.resultValue, String(value));
  assert.equal(scene.canvas.dataset.topFace, String(value));
  assert.equal(scene.canvas.dataset.landingQuaternion, scene.canvas.dataset.finalQuaternion);
  assert.equal(scene.canvas.dataset.completionMode, 'natural');
  assert.deepEqual(quaternionComponents(actor.body.quaternion), quaternionComponents(landingQuaternion));
  assert.equal(actor.body.position.x, 0);
  assert.equal(actor.body.position.z, 0);
});

test('two dice complete as one roll and finish at non-overlapping presentation targets', () => {
  const type = 'd20';
  const definition = DICE_DEFINITIONS[type];
  const scene = Object.create(DiceScene.prototype);
  scene.state = 'settling';
  scene.diceType = type;
  scene.definition = definition;
  scene.diceCount = 2;
  scene.canvas = { dataset: {} };
  scene.resultValues = [];
  scene.syncActorMesh = () => {};
  scene.setState = (state) => { scene.state = state; };
  let settledCalls = 0;
  scene.onSettled = (results) => {
    settledCalls += 1;
    scene.settledResults = results;
  };

  const values = [5, 18];
  scene.actors = values.map((value, index) => {
    const quaternionData = rotationForValue(type, value, index * 0.73);
    const quaternion = new CANNON.Quaternion(
      quaternionData.x,
      quaternionData.y,
      quaternionData.z,
      quaternionData.w,
    );
    const restHeight = restingHeightForQuaternion(type, quaternion);
    const body = new CANNON.Body({
      mass: definition.physics.mass,
      shape: createDiceCollider(definition),
    });
    body.position.set(index === 0 ? -2.1 : 1.8, restHeight, index === 0 ? -0.7 : 0.9);
    const actor = {
      index,
      body,
      phase: 'settling',
      finalQuaternion: new CANNON.Quaternion(),
    };
    scene.finishActorRoll(actor, { value, quaternion, restHeight });
    return actor;
  });

  const startedAt = 2000;
  scene.beginRecentering(startedAt);
  assert.equal(scene.state, 'recentering');
  scene.actors.forEach((actor) => scene.updateRecentering(actor, startedAt + RECENTER_DURATION_MS));

  assert.equal(settledCalls, 1);
  assert.deepEqual(scene.settledResults, values);
  assert.equal(scene.canvas.dataset.resultValues, '5,18');
  assert.equal(scene.actors[0].body.position.x, -1.15);
  assert.equal(scene.actors[1].body.position.x, 1.15);
  assert.ok(scene.actors[1].body.position.x - scene.actors[0].body.position.x > 2 * definition.physics.radius);
  scene.actors.forEach((actor, index) => {
    assert.equal(topFaceValue(type, actor.body.quaternion), values[index]);
  });
});

test('two-die rolls use independent seeds and separated launch lanes', () => {
  const definition = DICE_DEFINITIONS.d20;
  const scene = Object.create(DiceScene.prototype);
  scene.state = 'idle';
  scene.diceType = 'd20';
  scene.definition = definition;
  scene.diceCount = 2;
  scene.canvas = { dataset: {} };
  scene.reducedMotion = false;
  scene.resultValues = [];
  scene.highlightDice = () => {};
  scene.setState = (state) => { scene.state = state; };
  scene.actors = [0, 1].map((index) => ({
    index,
    phase: 'idle',
    body: new CANNON.Body({
      mass: definition.physics.mass,
      shape: createDiceCollider(definition),
    }),
  }));

  assert.equal(scene.roll({
    attempts: [
      { seedWords: [1, 2, 3, 4], fallbackValue: 7 },
      { seedWords: [5, 6, 7, 8], fallbackValue: 14 },
    ],
  }), true);
  assert.equal(scene.state, 'throwing');
  assert.ok(scene.actors[0].body.position.x < -1);
  assert.ok(scene.actors[1].body.position.x > 1);
  assert.notDeepEqual(
    quaternionComponents(scene.actors[0].body.quaternion),
    quaternionComponents(scene.actors[1].body.quaternion),
  );
});

test('reduced-motion completion presents and returns both fallback values', () => {
  const definition = DICE_DEFINITIONS.d12;
  const scene = Object.create(DiceScene.prototype);
  scene.state = 'settling';
  scene.diceType = 'd12';
  scene.definition = definition;
  scene.diceCount = 2;
  scene.canvas = { dataset: {} };
  scene.resultValues = [];
  scene.syncActorMesh = () => {};
  scene.setState = (state) => { scene.state = state; };
  scene.onSettled = (results) => { scene.settledResults = results; };
  scene.actors = [0, 1].map((index) => ({
    index,
    phase: 'settling',
    finalQuaternion: new CANNON.Quaternion(),
    body: new CANNON.Body({
      mass: definition.physics.mass,
      shape: createDiceCollider(definition),
    }),
  }));

  scene.settleImmediately([
    { fallbackValue: 3 },
    { fallbackValue: 11 },
  ]);

  assert.equal(scene.state, 'complete');
  assert.deepEqual(scene.settledResults, [3, 11]);
  assert.equal(scene.canvas.dataset.resultValues, '3,11');
  assert.equal(scene.actors[0].body.position.x, -1.15);
  assert.equal(scene.actors[1].body.position.x, 1.15);
  assert.equal(topFaceValue('d12', scene.actors[0].body.quaternion), 3);
  assert.equal(topFaceValue('d12', scene.actors[1].body.quaternion), 11);
});

test('safety correction levels the current leading face with the minimum tilt', () => {
  for (const type of DICE_TYPES) {
    const definition = DICE_DEFINITIONS[type];
    for (let value = 1; value <= definition.sides; value += 1) {
      const baseData = rotationForValue(type, value, value * 0.29);
      const base = new CANNON.Quaternion(baseData.x, baseData.y, baseData.z, baseData.w);
      const tilt = new CANNON.Quaternion();
      tilt.setFromAxisAngle(new CANNON.Vec3(0.8, 0, -0.6), 0.18);
      const current = new CANNON.Quaternion();
      tilt.mult(base, current);
      assert.equal(topFaceValue(type, current), value, `${type} value ${value} was not the leading face before correction`);

      const targetData = nearestRotationForValue(type, value, current);
      const target = new CANNON.Quaternion(targetData.x, targetData.y, targetData.z, targetData.w);
      assert.equal(topFaceValue(type, target), value, `${type} value ${value} changed during correction`);
      const faceIndex = definition.faceValues.indexOf(value);
      const normal = definition.resultDirections[faceIndex];
      const currentDirection = current.vmult(new CANNON.Vec3(normal.x, normal.y, normal.z));
      const transformed = target.vmult(new CANNON.Vec3(normal.x, normal.y, normal.z));
      assert.ok(transformed.y > 0.999999999, `${type} value ${value} alignment was ${transformed.y}`);
      const requiredTilt = Math.acos(Math.max(-1, Math.min(1, currentDirection.y)));
      const quaternionDot = Math.abs(current.x * target.x + current.y * target.y + current.z * target.z + current.w * target.w);
      const appliedRotation = 2 * Math.acos(Math.max(-1, Math.min(1, quaternionDot)));
      assert.ok(Math.abs(appliedRotation - requiredTilt) < 1e-10, `${type} value ${value} received an extra yaw correction`);
      assert.equal(isValidTabletopLanding({
        touchingGround: true,
        positionY: restingHeightForQuaternion(type, target),
        restHeight: restingHeightForQuaternion(type, target),
        alignment: transformed.y,
        topMatches: topFaceValue(type, target) === value,
        linearVelocitySquared: 0,
        angularVelocitySquared: 0,
      }), true, `${type} value ${value} was not accepted as a tabletop landing`);
    }
  }
});
