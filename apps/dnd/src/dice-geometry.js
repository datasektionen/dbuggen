const PHI = (1 + Math.sqrt(5)) / 2;

function length(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function normalizeVector(vector) {
  const magnitude = length(vector) || 1;
  return { x: vector.x / magnitude, y: vector.y / magnitude, z: vector.z / magnitude };
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(vector, amount) {
  return { x: vector.x * amount, y: vector.y * amount, z: vector.z * amount };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function centroid(points) {
  return scale(points.reduce((total, point) => add(total, point), { x: 0, y: 0, z: 0 }), 1 / points.length);
}

function polygonAreaCentroid(points) {
  if (points.length === 3) return centroid(points);
  const origin = points[0];
  let totalArea = 0;
  let weightedCenter = { x: 0, y: 0, z: 0 };
  for (let index = 1; index < points.length - 1; index += 1) {
    const triangle = [origin, points[index], points[index + 1]];
    const area = length(cross(subtract(triangle[1], origin), subtract(triangle[2], origin))) / 2;
    weightedCenter = add(weightedCenter, scale(centroid(triangle), area));
    totalArea += area;
  }
  return totalArea > 0 ? scale(weightedCenter, 1 / totalArea) : centroid(points);
}

function polygonAreaCentroid2D(points) {
  let twiceArea = 0;
  let centerX = 0;
  let centerY = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    const amount = point.x * next.y - next.x * point.y;
    twiceArea += amount;
    centerX += (point.x + next.x) * amount;
    centerY += (point.y + next.y) * amount;
  }
  if (Math.abs(twiceArea) < 1e-12) {
    return points.reduce((total, point) => ({
      x: total.x + point.x / points.length,
      y: total.y + point.y / points.length,
    }), { x: 0, y: 0 });
  }
  return {
    x: centerX / (3 * twiceArea),
    y: centerY / (3 * twiceArea),
  };
}

function normalizeVertices(vertices) {
  const maximum = Math.max(...vertices.map(length));
  return vertices.map((vertex) => scale(vertex, 1 / maximum));
}

function orientFaces(vertices, faces) {
  return faces.map((face) => {
    const [aIndex, bIndex, cIndex] = face;
    const a = vertices[aIndex];
    const b = vertices[bIndex];
    const c = vertices[cIndex];
    const normal = cross(subtract(b, a), subtract(c, a));
    const center = centroid(face.map((index) => vertices[index]));
    return dot(normal, center) >= 0 ? [...face] : [...face].reverse();
  });
}

function faceNormal(vertices, face) {
  const a = vertices[face[0]];
  const b = vertices[face[1]];
  const c = vertices[face[2]];
  return normalizeVector(cross(subtract(b, a), subtract(c, a)));
}

function sortAroundAxis(points, axis) {
  const helper = Math.abs(axis.y) < 0.85 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const basisX = normalizeVector(cross(helper, axis));
  const basisY = cross(axis, basisX);
  return [...points].sort((left, right) => {
    const leftAngle = Math.atan2(dot(left.point, basisY), dot(left.point, basisX));
    const rightAngle = Math.atan2(dot(right.point, basisY), dot(right.point, basisX));
    return leftAngle - rightAngle;
  });
}

function dualPolyhedron(sourceVertices, sourceFaces) {
  const vertices = normalizeVertices(sourceVertices);
  const faces = orientFaces(vertices, sourceFaces);
  const normals = faces.map((face) => faceNormal(vertices, face));
  const dualVertices = faces.map((face, index) => {
    const distance = dot(normals[index], vertices[face[0]]);
    return scale(normals[index], 1 / distance);
  });
  const dualFaces = vertices.map((vertex, vertexIndex) => {
    const incident = faces
      .map((face, faceIndex) => ({ faceIndex, point: dualVertices[faceIndex] }))
      .filter(({ faceIndex }) => faces[faceIndex].includes(vertexIndex));
    return sortAroundAxis(incident, normalizeVector(vertex)).map(({ faceIndex }) => faceIndex);
  });
  const normalizedDualVertices = normalizeVertices(dualVertices);
  return {
    vertices: normalizedDualVertices,
    faces: orientFaces(normalizedDualVertices, dualFaces),
  };
}

function createTetrahedron() {
  const vertices = normalizeVertices([
    { x: 1, y: 1, z: 1 },
    { x: -1, y: -1, z: 1 },
    { x: -1, y: 1, z: -1 },
    { x: 1, y: -1, z: -1 },
  ]);
  return { vertices, faces: orientFaces(vertices, [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]]) };
}

function createCube() {
  const vertices = normalizeVertices([
    { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
  ]);
  const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]];
  return { vertices, faces: orientFaces(vertices, faces) };
}

function createOctahedron() {
  const vertices = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ];
  const faces = [[2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0], [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5]];
  return { vertices, faces: orientFaces(vertices, faces) };
}

function createPentagonalTrapezohedron() {
  const sourceVertices = [];
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    sourceVertices.push({ x: Math.cos(angle), y: 0.5, z: Math.sin(angle) });
  }
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5 + Math.PI / 5;
    sourceVertices.push({ x: Math.cos(angle), y: -0.5, z: Math.sin(angle) });
  }
  const sourceFaces = [[0, 1, 2, 3, 4], [9, 8, 7, 6, 5]];
  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    const previous = (index + 4) % 5;
    sourceFaces.push([index, 5 + index, 5 + previous]);
    sourceFaces.push([index, next, 5 + index]);
  }
  const dual = dualPolyhedron(sourceVertices, sourceFaces);
  const vertices = normalizeVertices(dual.vertices.map((vertex) => ({
    x: vertex.x,
    y: vertex.y * 0.597,
    z: vertex.z,
  })));
  return { vertices, faces: orientFaces(vertices, dual.faces) };
}

const ICOSAHEDRON_VERTICES = normalizeVertices([
  { x: -1, y: PHI, z: 0 }, { x: 1, y: PHI, z: 0 },
  { x: -1, y: -PHI, z: 0 }, { x: 1, y: -PHI, z: 0 },
  { x: 0, y: -1, z: PHI }, { x: 0, y: 1, z: PHI },
  { x: 0, y: -1, z: -PHI }, { x: 0, y: 1, z: -PHI },
  { x: PHI, y: 0, z: -1 }, { x: PHI, y: 0, z: 1 },
  { x: -PHI, y: 0, z: -1 }, { x: -PHI, y: 0, z: 1 },
]);

const ICOSAHEDRON_FACES = orientFaces(ICOSAHEDRON_VERTICES, [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
]);

function makeDefinition(id, geometry, physics, atlasColumns, { resultMode = 'face', labelMode = 'single' } = {}) {
  const faces = orientFaces(geometry.vertices, geometry.faces);
  const faceNormals = faces.map((face) => faceNormal(geometry.vertices, face));
  const resultDirections = resultMode === 'vertex' ? geometry.vertices : faceNormals;
  return Object.freeze({
    id,
    label: id.toUpperCase(),
    sides: faces.length,
    vertices: Object.freeze(geometry.vertices.map((vertex) => Object.freeze(vertex))),
    faces: Object.freeze(faces.map((face) => Object.freeze(face))),
    faceValues: Object.freeze(faces.map((_, index) => index + 1)),
    faceNormals: Object.freeze(faceNormals.map((normal) => Object.freeze(normal))),
    resultDirections: Object.freeze(resultDirections.map((direction) => Object.freeze(direction))),
    resultMode,
    labelMode,
    atlas: Object.freeze({ columns: atlasColumns, rows: Math.ceil(faces.length / atlasColumns) }),
    physics: Object.freeze(physics),
  });
}

const dodecahedron = dualPolyhedron(ICOSAHEDRON_VERTICES, ICOSAHEDRON_FACES);

export const DICE_DEFINITIONS = Object.freeze({
  d4: makeDefinition('d4', createTetrahedron(), { radius: 1, mass: 0.78, restitution: 0.3, spin: [12, 17], launchY: [4.45, 4.8], linearDamping: 0.055, angularDamping: 0.05 }, 2, { resultMode: 'vertex', labelMode: 'vertex-triplet' }),
  d6: makeDefinition('d6', createCube(), { radius: 0.94, mass: 0.9, restitution: 0.32, spin: [13, 18], launchY: [4.4, 4.75], linearDamping: 0.05, angularDamping: 0.045 }, 3),
  d8: makeDefinition('d8', createOctahedron(), { radius: 1.02, mass: 0.92, restitution: 0.34, spin: [14, 20], launchY: [4.45, 4.8], linearDamping: 0.048, angularDamping: 0.04 }, 4),
  d10: makeDefinition('d10', createPentagonalTrapezohedron(), { radius: 1.02, mass: 0.98, restitution: 0.35, spin: [15, 21], launchY: [4.45, 4.85], linearDamping: 0.045, angularDamping: 0.038 }, 5),
  d12: makeDefinition('d12', dodecahedron, { radius: 0.98, mass: 1.04, restitution: 0.36, spin: [15, 21], launchY: [4.45, 4.85], linearDamping: 0.044, angularDamping: 0.036 }, 4),
  d20: makeDefinition('d20', { vertices: ICOSAHEDRON_VERTICES, faces: ICOSAHEDRON_FACES }, { radius: 1.034, mass: 1, restitution: 0.35, spin: [16, 22], launchY: [4.4, 4.8], linearDamping: 0.045, angularDamping: 0.035 }, 5),
});

export const DICE_TYPES = Object.freeze(Object.keys(DICE_DEFINITIONS));

export function getDiceDefinition(type) {
  const definition = DICE_DEFINITIONS[type];
  if (!definition) throw new RangeError(`Unknown die type: ${type}`);
  return definition;
}

export function normalizeQuaternion(quaternion) {
  const magnitude = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w) || 1;
  return { x: quaternion.x / magnitude, y: quaternion.y / magnitude, z: quaternion.z / magnitude, w: quaternion.w / magnitude };
}

export function multiplyQuaternions(a, b) {
  return normalizeQuaternion({
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  });
}

export function quaternionFromAxisAngle(axis, angle) {
  const unit = normalizeVector(axis);
  const half = angle / 2;
  return normalizeQuaternion({ x: unit.x * Math.sin(half), y: unit.y * Math.sin(half), z: unit.z * Math.sin(half), w: Math.cos(half) });
}

export function quaternionBetween(from, to) {
  const fromUnit = normalizeVector(from);
  const toUnit = normalizeVector(to);
  const amount = dot(fromUnit, toUnit);
  if (amount < -0.9999) {
    const helper = Math.abs(fromUnit.x) < 0.8 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    return quaternionFromAxisAngle(normalizeVector(cross(fromUnit, helper)), Math.PI);
  }
  return normalizeQuaternion({ ...cross(fromUnit, toUnit), w: 1 + amount });
}

export function rotateVector(vector, quaternion) {
  const u = { x: quaternion.x, y: quaternion.y, z: quaternion.z };
  const uv = cross(u, vector);
  const uuv = cross(u, uv);
  return {
    x: vector.x + 2 * (quaternion.w * uv.x + uuv.x),
    y: vector.y + 2 * (quaternion.w * uv.y + uuv.y),
    z: vector.z + 2 * (quaternion.w * uv.z + uuv.z),
  };
}

export function getFaceLabelUpDirection(type, faceIndex, rotation = 0) {
  const definition = getDiceDefinition(type);
  const face = definition.faces[faceIndex];
  if (!face) throw new RangeError(`${definition.label} face index is out of range: ${faceIndex}`);
  const polygon = getFaceUvPolygon(type, faceIndex);
  const uvCenter = polygonAreaCentroid2D(polygon);
  const physicalCenter = polygonAreaCentroid(face.map((vertexIndex) => definition.vertices[vertexIndex]));
  const canvasDirection = { x: Math.sin(rotation), y: -Math.cos(rotation) };
  const tangent = face.reduce((total, vertexIndex, index) => {
    const uvOffset = {
      x: polygon[index].x - uvCenter.x,
      y: polygon[index].y - uvCenter.y,
    };
    const weight = uvOffset.x * canvasDirection.x + uvOffset.y * canvasDirection.y;
    return add(total, scale(subtract(definition.vertices[vertexIndex], physicalCenter), weight));
  }, { x: 0, y: 0, z: 0 });
  return normalizeVector(tangent);
}

export function getResultLabelCandidates(type, value) {
  const definition = getDiceDefinition(type);
  const resultIndex = definition.faceValues.indexOf(value);
  if (resultIndex < 0) throw new RangeError(`${definition.label} value must be between 1 and ${definition.sides}; received ${value}`);
  if (type !== 'd4') {
    return [{
      faceIndex: resultIndex,
      labelUp: getFaceLabelUpDirection(type, resultIndex),
    }];
  }
  return definition.faces.flatMap((face, faceIndex) => {
    if (!face.includes(resultIndex)) return [];
    const marking = getD4FaceMarkings(faceIndex).find((item) => item.value === value);
    return [{
      faceIndex,
      labelUp: getFaceLabelUpDirection(type, faceIndex, marking.rotation),
    }];
  });
}

export function presentationRotationForValue(type, value, {
  cameraPosition = { x: 0, y: 7.3, z: 9.2 },
  cameraTarget = { x: 0, y: 0.45, z: 0 },
  yawSteps = 720,
} = {}) {
  const definition = getDiceDefinition(type);
  const forward = normalizeVector(subtract(cameraTarget, cameraPosition));
  const cameraRight = normalizeVector(cross(forward, { x: 0, y: 1, z: 0 }));
  const screenUp = normalizeVector(cross(cameraRight, forward));
  const towardCamera = normalizeVector(subtract(cameraPosition, cameraTarget));
  const candidates = getResultLabelCandidates(type, value);
  let bestQuaternion = rotationForValue(type, value, 0);
  let bestScore = -Infinity;

  for (let step = 0; step < yawSteps; step += 1) {
    const quaternion = rotationForValue(type, value, step * Math.PI * 2 / yawSteps);
    for (const candidate of candidates) {
      const labelUp = rotateVector(candidate.labelUp, quaternion);
      const faceNormal = rotateVector(definition.faceNormals[candidate.faceIndex], quaternion);
      const screenX = dot(labelUp, cameraRight);
      const screenY = dot(labelUp, screenUp);
      const projectedLength = Math.hypot(screenX, screenY) || 1;
      const uprightness = screenY / projectedLength;
      const facing = dot(faceNormal, towardCamera);
      const hiddenPenalty = facing < 0.02 ? (0.02 - facing) * 6 : 0;
      const score = uprightness * 12 + facing - hiddenPenalty;
      if (score > bestScore) {
        bestScore = score;
        bestQuaternion = quaternion;
      }
    }
  }
  return bestQuaternion;
}

export function rotationForValue(type, value, yaw = 0) {
  const definition = getDiceDefinition(type);
  const faceIndex = definition.faceValues.indexOf(value);
  if (faceIndex < 0) throw new RangeError(`${definition.label} value must be between 1 and ${definition.sides}; received ${value}`);
  const align = quaternionBetween(definition.resultDirections[faceIndex], { x: 0, y: 1, z: 0 });
  return multiplyQuaternions(quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, yaw), align);
}

export function nearestRotationForValue(type, value, currentQuaternion) {
  const definition = getDiceDefinition(type);
  const resultIndex = definition.faceValues.indexOf(value);
  if (resultIndex < 0) throw new RangeError(`${definition.label} value must be between 1 and ${definition.sides}; received ${value}`);
  const current = normalizeQuaternion(currentQuaternion);
  const currentDirection = rotateVector(definition.resultDirections[resultIndex], current);
  const shortestTilt = quaternionBetween(currentDirection, { x: 0, y: 1, z: 0 });
  return multiplyQuaternions(shortestTilt, current);
}

export function topFaceValue(type, quaternion) {
  const definition = getDiceDefinition(type);
  let bestIndex = 0;
  let bestHeight = -Infinity;
  definition.resultDirections.forEach((direction, index) => {
    const height = rotateVector(direction, quaternion).y;
    if (height > bestHeight) {
      bestHeight = height;
      bestIndex = index;
    }
  });
  return definition.faceValues[bestIndex];
}

export function restingHeightForValue(type, value, yaw = 0) {
  const quaternion = rotationForValue(type, value, yaw);
  return restingHeightForQuaternion(type, quaternion);
}

export function restingHeightForQuaternion(type, quaternion) {
  const definition = getDiceDefinition(type);
  const lowest = Math.min(...definition.vertices.map((vertex) => rotateVector(vertex, quaternion).y));
  return -lowest * definition.physics.radius + 0.025;
}

export function createFaceUvCoordinates(type, faceIndex) {
  const definition = getDiceDefinition(type);
  const face = definition.faces[faceIndex];
  if (!face) throw new RangeError(`${definition.label} face index is out of range: ${faceIndex}`);
  const { columns, rows } = definition.atlas;
  const column = faceIndex % columns;
  const row = Math.floor(faceIndex / columns);

  if (type === 'd10') {
    const points = face.map((vertexIndex) => definition.vertices[vertexIndex]);
    const physicalCenter = polygonAreaCentroid(points);
    const normal = definition.faceNormals[faceIndex];
    const diagonals = [[0, 2], [1, 3]].map(([start, end]) => ({
      start,
      end,
      length: length(subtract(points[end], points[start])),
    }));
    const longest = diagonals.sort((left, right) => right.length - left.length)[0];
    let basisY = normalizeVector(subtract(points[longest.end], points[longest.start]));
    if (basisY.y < 0) basisY = scale(basisY, -1);
    const basisX = normalizeVector(cross(normal, basisY));
    const projected = points.map((point) => {
      const offset = subtract(point, physicalCenter);
      return { x: dot(offset, basisX), y: -dot(offset, basisY) };
    });
    const projectedCenter = polygonAreaCentroid2D(projected);
    const centered = projected.map((point) => ({
      x: point.x - projectedCenter.x,
      y: point.y - projectedCenter.y,
    }));
    const maximumExtent = Math.max(...centered.flatMap((point) => [Math.abs(point.x), Math.abs(point.y)])) || 1;
    const atlasScale = 0.44 / maximumExtent;
    return centered.map((point) => {
      const localX = 0.5 + point.x * atlasScale;
      const localY = 0.5 + point.y * atlasScale;
      return {
        x: (column + localX) / columns,
        y: 1 - (row + localY) / rows,
      };
    });
  }

  if (face.length === 3) {
    const paddingU = 0.08 / columns;
    const paddingV = 0.08 / rows;
    const uMin = column / columns + paddingU;
    const uMax = (column + 1) / columns - paddingU;
    const vMin = 1 - (row + 1) / rows + paddingV;
    const vMax = 1 - row / rows - paddingV;
    return [
      { x: (uMin + uMax) / 2, y: vMax },
      { x: uMin, y: vMin },
      { x: uMax, y: vMin },
    ];
  }

  const radius = 0.46;
  const rotation = Math.PI / 2 + Math.PI / face.length;
  return face.map((_, vertexIndex) => {
    const angle = rotation - vertexIndex * Math.PI * 2 / face.length;
    return {
      x: (column + 0.5 + Math.cos(angle) * radius) / columns,
      y: 1 - (row + 0.5 - Math.sin(angle) * radius) / rows,
    };
  });
}

export function getFaceUvPolygon(type, faceIndex) {
  const definition = getDiceDefinition(type);
  const column = faceIndex % definition.atlas.columns;
  const row = Math.floor(faceIndex / definition.atlas.columns);
  return createFaceUvCoordinates(type, faceIndex).map((point) => ({
    x: point.x * definition.atlas.columns - column,
    y: (1 - point.y) * definition.atlas.rows - row,
  }));
}

export function getFaceLabelAnchor(type, faceIndex) {
  return polygonAreaCentroid2D(getFaceUvPolygon(type, faceIndex));
}

export function getFaceLabelSafePolygon(type, faceIndex) {
  const polygon = getFaceUvPolygon(type, faceIndex);
  const center = polygonAreaCentroid2D(polygon);
  const scaleAmount = type === 'd4' ? 0.98 : type === 'd10' ? 0.86 : 0.78;
  return polygon.map((point) => ({
    x: center.x + (point.x - center.x) * scaleAmount,
    y: center.y + (point.y - center.y) * scaleAmount,
  }));
}

export function getFaceLabelLayout(type, value) {
  const definition = getDiceDefinition(type);
  const faceIndex = definition.faceValues.indexOf(value);
  if (faceIndex < 0) throw new RangeError(`${definition.label} value must be between 1 and ${definition.sides}; received ${value}`);
  const triangular = definition.faces[faceIndex].length === 3;
  if (type === 'd4') return { fontSize: 36, centerY: 0.5, underlineY: 0.72, lineWidth: 4 };
  const anchor = triangular ? getFaceLabelAnchor(type, faceIndex) : { x: 0.5, y: 0.5 };
  if (type === 'd8') return { fontSize: 85, centerY: anchor.y, underlineY: anchor.y + 0.14, lineWidth: 9 };
  if (type === 'd20') return { fontSize: value >= 10 ? 68 : 78, centerY: anchor.y, underlineY: anchor.y + 0.14, lineWidth: 8.25 };
  return triangular
    ? { fontSize: value >= 10 ? 82 : 94, centerY: anchor.y, underlineY: anchor.y + 0.14, lineWidth: 10 }
    : { fontSize: value >= 10 ? 68 : 80, centerY: 0.5, underlineY: 0.69, lineWidth: 8 };
}

export function getD4FaceMarkings(faceIndex) {
  const definition = getDiceDefinition('d4');
  const face = definition.faces[faceIndex];
  if (!face) throw new RangeError(`D4 face index is out of range: ${faceIndex}`);
  const polygon = getFaceUvPolygon('d4', faceIndex);
  const center = polygonAreaCentroid2D(polygon);
  const rotations = [0, -Math.PI / 3, Math.PI / 3];
  const positions = polygon.map((point, cornerIndex) => ({
    x: center.x + (point.x - center.x) * 0.68,
    y: center.y + (point.y - center.y) * 0.68,
    rotation: rotations[cornerIndex],
  }));
  return face.map((vertexIndex, cornerIndex) => ({ value: vertexIndex + 1, ...positions[cornerIndex] }));
}

export function getFaceAreaCentroid(type, faceIndex) {
  const definition = getDiceDefinition(type);
  const face = definition.faces[faceIndex];
  if (!face) throw new RangeError(`${definition.label} face index is out of range: ${faceIndex}`);
  return polygonAreaCentroid(face.map((vertexIndex) => definition.vertices[vertexIndex]));
}

export function createDiceBufferData(type) {
  const definition = getDiceDefinition(type);
  const positions = [];
  const normals = [];
  const uvs = [];

  definition.faces.forEach((face, faceIndex) => {
    const faceUvs = createFaceUvCoordinates(type, faceIndex);
    const normal = definition.faceNormals[faceIndex];
    if (face.length > 3) {
      const center = getFaceAreaCentroid(type, faceIndex);
      const centerUv = type === 'd10'
        ? polygonAreaCentroid2D(faceUvs)
        : faceUvs.reduce((total, point) => ({
          x: total.x + point.x / faceUvs.length,
          y: total.y + point.y / faceUvs.length,
        }), { x: 0, y: 0 });
      for (let edgeIndex = 0; edgeIndex < face.length; edgeIndex += 1) {
        const nextEdgeIndex = (edgeIndex + 1) % face.length;
        const triangle = [
          { vertex: center, uv: centerUv },
          { vertex: definition.vertices[face[edgeIndex]], uv: faceUvs[edgeIndex] },
          { vertex: definition.vertices[face[nextEdgeIndex]], uv: faceUvs[nextEdgeIndex] },
        ];
        triangle.forEach(({ vertex, uv }) => {
          positions.push(vertex.x * definition.physics.radius, vertex.y * definition.physics.radius, vertex.z * definition.physics.radius);
          normals.push(normal.x, normal.y, normal.z);
          uvs.push(uv.x, uv.y);
        });
      }
      return;
    }
    for (let triangleIndex = 1; triangleIndex < face.length - 1; triangleIndex += 1) {
      for (const vertexOffset of [0, triangleIndex, triangleIndex + 1]) {
        const vertex = definition.vertices[face[vertexOffset]];
        positions.push(vertex.x * definition.physics.radius, vertex.y * definition.physics.radius, vertex.z * definition.physics.radius);
        normals.push(normal.x, normal.y, normal.z);
        const projected = faceUvs[vertexOffset];
        uvs.push(projected.x, projected.y);
      }
    }
  });

  return { positions, normals, uvs };
}

export const UINT32_RANGE = 4_294_967_296;

export function getAcceptanceLimit(sideCount) {
  if (!Number.isInteger(sideCount) || sideCount < 2) throw new RangeError('sideCount must be an integer of at least 2');
  return Math.floor(UINT32_RANGE / sideCount) * sideCount;
}

export function getSecureRoll(sideCount, randomUint32) {
  const limit = getAcceptanceLimit(sideCount);
  let value;
  do {
    value = randomUint32();
  } while (value >= limit);
  return (value % sideCount) + 1;
}
