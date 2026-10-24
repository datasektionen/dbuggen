import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  createDiceBufferData,
  getD4FaceMarkings,
  getDiceDefinition,
  getFaceLabelAnchor,
  getFaceLabelLayout,
  getFaceLabelSafePolygon,
  nearestRotationForValue,
  presentationRotationForValue,
  restingHeightForQuaternion,
  topFaceValue,
} from './dice-geometry.js';
import {
  clampPlanarPosition,
  getRecenteringPosition,
  getSettleAssistProgress,
  PHYSICAL_ROLL_LIMIT_SECONDS,
  RECENTER_DURATION_MS,
  SAFETY_CORRECTION_START_SECONDS,
  shouldBeginSettleAssist,
  updateBorderStall,
} from './settling.js';
import { createRollLaunch } from './roll-random.js';
import { getDiceTheme } from './dice-theme.js';
import { SUPPORTED_FPS } from './settings.js';
import {
  TRAY_APOTHEM,
  TRAY_RADIUS,
  WALL_FRICTION,
  WALL_RESTITUTION,
  addTrayPhysics,
  classifyDiceContacts,
  createDiceCollider,
  isValidTabletopLanding,
  setRollingSleepState,
} from './tray-physics.js';

const FIXED_TIME_STEP = 1 / 120;
const MAX_SUBSTEPS = 6;
const MINIMUM_ROLL_SECONDS = 2.3;

export const DICE_CAMERA_FRAMING = Object.freeze({
  fov: 38.5,
  position: Object.freeze({ x: 0, y: 7.3, z: 9.2 }),
  target: Object.freeze({ x: 0, y: 0.45, z: 0.3 }),
});

export function frameIntervalForFps(value) {
  const normalized = String(value);
  if (normalized === 'auto') return 0;
  if (SUPPORTED_FPS.includes(normalized)) return 1000 / Number(normalized);
  throw new RangeError(`Unsupported FPS setting: ${value}`);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(value) {
  const amount = clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function setQuaternion(target, source) {
  target.set(source.x, source.y, source.z, source.w);
}

function serializeQuaternion(quaternion) {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
    .map((value) => Number(value).toFixed(8))
    .join(',');
}

function pointInsideConvexPolygon(point, polygon) {
  let sign = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const amount = (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
    if (Math.abs(amount) < 0.001) continue;
    const nextSign = Math.sign(amount);
    if (sign && nextSign !== sign) return false;
    sign = nextSign;
  }
  return true;
}

function rotatePoint(point, rotation) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
}

function paintCenteredNumber(context, {
  value,
  x,
  y,
  fontSize,
  lineWidth,
  rotation = 0,
  underlineOffset = null,
  safePolygon = null,
  centerCompound = false,
  fillColor = '#fff0c4',
  strokeColor = 'rgba(62, 18, 10, .92)',
}) {
  const maximumFontSize = fontSize;
  let resolvedFontSize = fontSize;
  let resolvedLineWidth = lineWidth;
  let resolvedUnderlineOffset = underlineOffset;
  let resolvedMetrics;
  let contentOffsetY = 0;
  let underlineHalfWidth = 0;
  const minimumFontSize = Math.min(24, maximumFontSize);

  while (true) {
    context.font = `700 ${resolvedFontSize}px Georgia, serif`;
    const metrics = context.measureText(String(value));
    const left = metrics.actualBoundingBoxLeft ?? 0;
    const right = metrics.actualBoundingBoxRight ?? metrics.width;
    const ascent = metrics.actualBoundingBoxAscent ?? resolvedFontSize * 0.72;
    const descent = metrics.actualBoundingBoxDescent ?? resolvedFontSize * 0.18;
    const halfStroke = resolvedLineWidth / 2;
    let minimumY = -(ascent + descent) / 2 - halfStroke;
    let maximumY = (ascent + descent) / 2 + halfStroke;
    underlineHalfWidth = Math.max(13 * resolvedFontSize / maximumFontSize, (left + right) * 0.34);
    if ((value === 6 || value === 9) && resolvedUnderlineOffset !== null) {
      const underlineHalfStroke = (Math.max(7, resolvedLineWidth - 1) + 3) / 2;
      minimumY = Math.min(minimumY, resolvedUnderlineOffset - underlineHalfStroke);
      maximumY = Math.max(maximumY, resolvedUnderlineOffset + underlineHalfStroke);
    }
    contentOffsetY = centerCompound ? -(minimumY + maximumY) / 2 : 0;
    const halfWidth = Math.max((left + right) / 2 + halfStroke, underlineHalfWidth + halfStroke);
    const bounds = [
      { x: -halfWidth, y: minimumY + contentOffsetY },
      { x: halfWidth, y: minimumY + contentOffsetY },
      { x: halfWidth, y: maximumY + contentOffsetY },
      { x: -halfWidth, y: maximumY + contentOffsetY },
    ].map((point) => {
      const rotated = rotatePoint(point, rotation);
      return { x: x + rotated.x, y: y + rotated.y };
    });
    resolvedMetrics = {
      actualBoundingBoxLeft: left,
      actualBoundingBoxRight: right,
      actualBoundingBoxAscent: ascent,
      actualBoundingBoxDescent: descent,
      width: left + right,
    };
    if (!safePolygon || bounds.every((point) => pointInsideConvexPolygon(point, safePolygon)) || resolvedFontSize <= minimumFontSize) break;
    resolvedFontSize -= 1;
    const ratio = resolvedFontSize / maximumFontSize;
    resolvedLineWidth = lineWidth * ratio;
    resolvedUnderlineOffset = underlineOffset === null ? null : underlineOffset * ratio;
  }

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.font = `700 ${resolvedFontSize}px Georgia, serif`;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  const text = String(value);
  const metrics = resolvedMetrics ?? context.measureText(text);
  const left = metrics.actualBoundingBoxLeft ?? 0;
  const right = metrics.actualBoundingBoxRight ?? metrics.width;
  const ascent = metrics.actualBoundingBoxAscent ?? resolvedFontSize * 0.72;
  const descent = metrics.actualBoundingBoxDescent ?? resolvedFontSize * 0.18;
  const drawX = (left - right) / 2;
  const drawY = (ascent - descent) / 2 + contentOffsetY;

  context.lineWidth = resolvedLineWidth;
  context.strokeStyle = strokeColor;
  context.strokeText(text, drawX, drawY);
  context.fillStyle = fillColor;
  context.fillText(text, drawX, drawY);

  if ((value === 6 || value === 9) && resolvedUnderlineOffset !== null) {
    context.beginPath();
    context.moveTo(-underlineHalfWidth, resolvedUnderlineOffset + contentOffsetY);
    context.lineTo(underlineHalfWidth, resolvedUnderlineOffset + contentOffsetY);
    context.lineWidth = Math.max(7, resolvedLineWidth - 1) + 3;
    context.strokeStyle = strokeColor;
    context.stroke();
    context.lineWidth = Math.max(7, resolvedLineWidth - 1);
    context.strokeStyle = fillColor;
    context.stroke();
  }
  context.restore();
}

function createFaceAtlas(definition, theme) {
  const cellSize = 256;
  const atlas = document.createElement('canvas');
  atlas.width = cellSize * definition.atlas.columns;
  atlas.height = cellSize * definition.atlas.rows;
  const context = atlas.getContext('2d');

  for (let index = 0; index < definition.sides; index += 1) {
    const column = index % definition.atlas.columns;
    const row = Math.floor(index / definition.atlas.columns);
    const x = column * cellSize;
    const y = row * cellSize;
    const gradient = context.createLinearGradient(x, y, x + cellSize, y + cellSize);
    theme.gradient.forEach(({ offset, color }) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.fillRect(x, y, cellSize, cellSize);

    if (definition.labelMode === 'vertex-triplet') {
      const layout = getFaceLabelLayout(definition.id, 1);
      getD4FaceMarkings(index).forEach((marking) => paintCenteredNumber(context, {
        value: marking.value,
        x: x + cellSize * marking.x,
        y: y + cellSize * marking.y,
        fontSize: layout.fontSize,
        lineWidth: layout.lineWidth,
        rotation: marking.rotation,
        fillColor: theme.numberFill,
        strokeColor: theme.numberStroke,
      }));
    } else {
      const value = index + 1;
      const labelLayout = getFaceLabelLayout(definition.id, value);
      const fitToFace = definition.id === 'd8' || definition.id === 'd10' || definition.id === 'd20';
      const anchor = fitToFace ? getFaceLabelAnchor(definition.id, index) : { x: 0.5, y: 0.5 };
      const safePolygon = fitToFace
        ? getFaceLabelSafePolygon(definition.id, index).map((point) => ({
          x: x + point.x * cellSize,
          y: y + point.y * cellSize,
        }))
        : null;
      paintCenteredNumber(context, {
        value,
        x: x + cellSize * anchor.x,
        y: y + cellSize * labelLayout.centerY,
        fontSize: labelLayout.fontSize,
        lineWidth: labelLayout.lineWidth,
        underlineOffset: (labelLayout.underlineY - labelLayout.centerY) * cellSize,
        safePolygon,
        centerCompound: fitToFace,
        fillColor: theme.numberFill,
        strokeColor: theme.numberStroke,
      });
    }
  }

  const texture = new THREE.CanvasTexture(atlas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createDiceMesh(definition, theme = getDiceTheme(definition.id)) {
  const data = createDiceBufferData(definition.id);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    map: createFaceAtlas(definition, theme),
    color: 0xffffff,
    roughness: theme.roughness,
    metalness: theme.metalness,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 12);
  const edges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({
    color: theme.edge,
    transparent: true,
    opacity: 0.92,
  }));
  edges.renderOrder = 2;
  mesh.add(edges);
  return mesh;
}

function disposeDiceMesh(mesh) {
  if (!mesh) return;
  mesh.children.forEach((child) => {
    child.geometry?.dispose();
    child.material?.dispose();
  });
  mesh.geometry.dispose();
  mesh.material.map.dispose();
  mesh.material.dispose();
}

function addTray(scene) {
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: 0x211a1d,
    roughness: 0.82,
    metalness: 0.08,
  });
  const tray = new THREE.Mesh(
    new THREE.CylinderGeometry(TRAY_RADIUS, TRAY_RADIUS, 0.24, 8, 1, false, Math.PI / 8),
    trayMaterial,
  );
  tray.position.y = -0.12;
  tray.receiveShadow = true;
  scene.add(tray);

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(TRAY_RADIUS - 0.13, TRAY_RADIUS + 0.08, 8, 1, Math.PI / 8),
    new THREE.MeshStandardMaterial({
      color: 0xb87332,
      emissive: 0x4b1d0f,
      emissiveIntensity: 0.38,
      metalness: 0.66,
      roughness: 0.34,
      side: THREE.DoubleSide,
    }),
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.012;
  scene.add(rim);

  for (const radius of [1.7, 3.15]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.015, radius + 0.015, 96),
      new THREE.MeshBasicMaterial({
        color: 0xd29348,
        transparent: true,
        opacity: radius < 2 ? 0.24 : 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    scene.add(ring);
  }
}

export class DiceScene {
  constructor({ canvas, onSettled = () => {}, onStateChange = () => {}, getTheme = getDiceTheme }) {
    this.canvas = canvas;
    this.onSettled = onSettled;
    this.onStateChange = onStateChange;
    this.state = 'idle';
    this.rollStartedAt = 0;
    this.lastFrameAt = performance.now();
    this.frameRequest = 0;
    this.slowFrames = 0;
    this.qualityScale = 1;
    this.fps = 'auto';
    this.frameInterval = 0;
    this.nextFrameAt = 0;
    this.themeProvider = getTheme;
    this.themeOverrides = new Map();
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.disposed = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0c10);
    this.scene.fog = new THREE.FogExp2(0x0b0c10, 0.035);

    this.camera = new THREE.PerspectiveCamera(DICE_CAMERA_FRAMING.fov, 1, 0.1, 60);
    this.camera.position.set(
      DICE_CAMERA_FRAMING.position.x,
      DICE_CAMERA_FRAMING.position.y,
      DICE_CAMERA_FRAMING.position.z,
    );
    this.camera.lookAt(
      DICE_CAMERA_FRAMING.target.x,
      DICE_CAMERA_FRAMING.target.y,
      DICE_CAMERA_FRAMING.target.z,
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene.add(new THREE.HemisphereLight(0xeadcc8, 0x29171b, 1.5));
    const keyLight = new THREE.SpotLight(0xffb45d, 72, 28, Math.PI / 5.2, 0.48, 1.25);
    keyLight.position.set(-4.4, 9.2, 5.8);
    keyLight.target.position.set(0, 0, 0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.bias = -0.0008;
    keyLight.shadow.normalBias = 0.025;
    this.scene.add(keyLight, keyLight.target);
    const fillLight = new THREE.DirectionalLight(0xffe2c2, 1.1);
    fillLight.position.set(5.4, 5.8, 4.2);
    this.scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x8f3d31, 1.8);
    rimLight.position.set(5, 4, -4);
    this.scene.add(rimLight);
    addTray(this.scene);

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    this.world.allowSleep = true;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 14;
    this.diceMaterial = new CANNON.Material('dice');
    const groundMaterial = new CANNON.Material('tray');
    const wallMaterial = new CANNON.Material('tray-walls');
    this.groundContactMaterial = new CANNON.ContactMaterial(this.diceMaterial, groundMaterial, {
      friction: 0.28,
      restitution: 0.35,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    });
    this.wallContactMaterial = new CANNON.ContactMaterial(this.diceMaterial, wallMaterial, {
      friction: WALL_FRICTION,
      restitution: WALL_RESTITUTION,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    });
    this.world.addContactMaterial(this.groundContactMaterial);
    this.world.addContactMaterial(this.wallContactMaterial);
    this.diceContactMaterial = new CANNON.ContactMaterial(this.diceMaterial, this.diceMaterial, {
      friction: 0.22,
      restitution: 0.32,
      contactEquationStiffness: 1e8,
      contactEquationRelaxation: 3,
    });
    this.world.addContactMaterial(this.diceContactMaterial);
    const trayPhysics = addTrayPhysics(this.world, groundMaterial, wallMaterial);
    this.groundBody = trayPhysics.groundBody;
    this.wallBodies = trayPhysics.wallBodies;
    this.wallBodySet = new Set(this.wallBodies);
    this.definition = null;
    this.diceType = 'd20';
    this.diceCount = 1;
    this.actors = [];
    this.resultValues = [];
    this.reducedMotionTimeout = 0;

    this.setDie('d20', 12);
    this.resizeRequest = 0;
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeRequest);
      this.resizeRequest = requestAnimationFrame(() => this.resize());
    });
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.animate = this.animate.bind(this);
    this.frameRequest = requestAnimationFrame(this.animate);
  }

  setState(nextState) {
    if (nextState === this.state) return;
    this.state = nextState;
    this.onStateChange(nextState);
  }

  isBusy() {
    return this.actors.some((actor) => ['throwing', 'settling', 'correcting', 'recentering'].includes(actor.phase));
  }

  getTheme(type) {
    return this.themeOverrides.get(type) ?? this.themeProvider(type);
  }

  createActor(index, previewValue) {
    const mesh = createDiceMesh(this.definition, this.getTheme(this.definition.id));
    this.scene.add(mesh);
    const body = new CANNON.Body({
      mass: this.definition.physics.mass,
      material: this.diceMaterial,
      shape: createDiceCollider(this.definition),
      linearDamping: this.definition.physics.linearDamping,
      angularDamping: this.definition.physics.angularDamping,
      allowSleep: true,
      sleepSpeedLimit: 0.08,
      sleepTimeLimit: 0.35,
    });
    this.world.addBody(body);

    const actor = {
      index,
      mesh,
      body,
      phase: 'idle',
      resultValue: previewValue,
      finalQuaternion: new CANNON.Quaternion(),
      correctionValue: previewValue,
      correctionTargetQuaternion: new CANNON.Quaternion(),
      correctionStartedAt: 0,
      recenterStartedAt: 0,
      collisionCount: 0,
      lastImpactAt: 0,
      stableFrames: 0,
      stableCandidateValue: null,
      settleAssistStartedAt: 0,
      borderStallStartedAt: null,
      borderRescueCount: 0,
      lastBorderRescueAt: -Infinity,
      contactState: { touchingGround: false, touchingWall: false },
    };
    actor.handleCollision = () => {
      if (actor.phase !== 'throwing' && actor.phase !== 'settling') return;
      const now = performance.now();
      if (now - actor.lastImpactAt > 130) {
        actor.collisionCount += 1;
        actor.lastImpactAt = now;
      }
    };
    body.addEventListener('collide', actor.handleCollision);
    const targetX = this.diceCount === 2 ? (index === 0 ? -1.15 : 1.15) : 0;
    this.setActorToValue(actor, previewValue, targetX, 0, true);
    return actor;
  }

  disposeActor(actor) {
    actor.body.removeEventListener('collide', actor.handleCollision);
    this.world.removeBody(actor.body);
    this.scene.remove(actor.mesh);
    disposeDiceMesh(actor.mesh);
  }

  rebuildActors(previewValue = Math.min(12, this.definition.sides)) {
    this.actors.forEach((actor) => this.disposeActor(actor));
    this.actors = Array.from({ length: this.diceCount }, (_, index) => this.createActor(index, previewValue));
    this.diceBody = this.actors[0]?.body ?? null;
    this.diceMesh = this.actors[0]?.mesh ?? null;
    this.resultValues = this.actors.map((actor) => actor.resultValue);
    this.highlightDice([]);
  }

  setDie(type, previewValue) {
    if (this.isBusy()) return false;
    const definition = getDiceDefinition(type);
    this.definition = definition;
    this.diceType = type;
    this.groundContactMaterial.restitution = definition.physics.restitution;
    this.diceContactMaterial.restitution = definition.physics.restitution;
    this.canvas.dataset.dieType = type;
    this.rebuildActors(previewValue ?? Math.min(12, definition.sides));
    this.setState('idle');
    return true;
  }

  setDiceCount(count) {
    if (![1, 2].includes(count) || this.isBusy()) return false;
    if (count === this.diceCount) return true;
    this.diceCount = count;
    this.rebuildActors();
    this.setState('idle');
    return true;
  }

  setFps(value) {
    const normalized = String(value);
    if (!SUPPORTED_FPS.includes(normalized)) return false;
    this.fps = normalized;
    this.frameInterval = frameIntervalForFps(normalized);
    this.nextFrameAt = 0;
    this.lastFrameAt = performance.now();
    this.slowFrames = 0;
    return true;
  }

  setDiceTheme(type, theme) {
    getDiceDefinition(type);
    if (!theme?.gradient || !theme.edge || !theme.numberFill) return false;
    this.themeOverrides.set(type, theme);
    if (type !== this.diceType) return true;

    this.actors.forEach((actor) => {
      const nextMap = createFaceAtlas(this.definition, theme);
      const previousMap = actor.mesh.material.map;
      actor.mesh.material.map = nextMap;
      actor.mesh.material.roughness = theme.roughness;
      actor.mesh.material.metalness = theme.metalness;
      actor.mesh.material.needsUpdate = true;
      previousMap?.dispose();
      actor.mesh.children.forEach((child) => child.material.color.set(theme.edge));
      if (actor.mesh.material.emissiveIntensity > 0) actor.mesh.material.emissive.set(theme.accent);
    });
    return true;
  }

  setActorToValue(actor, value, x = 0, z = 0, sleep = false) {
    const target = presentationRotationForValue(this.diceType, value);
    actor.resultValue = value;
    actor.finalQuaternion.set(target.x, target.y, target.z, target.w);
    actor.restHeight = restingHeightForQuaternion(this.diceType, target);
    actor.body.position.set(x, actor.restHeight, z);
    actor.body.velocity.setZero();
    actor.body.angularVelocity.setZero();
    actor.body.force.setZero();
    actor.body.torque.setZero();
    setQuaternion(actor.body.quaternion, target);
    actor.body.previousPosition.copy(actor.body.position);
    actor.body.interpolatedPosition.copy(actor.body.position);
    actor.body.previousQuaternion.copy(actor.body.quaternion);
    actor.body.interpolatedQuaternion.copy(actor.body.quaternion);
    actor.body.aabbNeedsUpdate = true;
    if (sleep) {
      setRollingSleepState(actor.body, false);
      actor.body.sleep();
    }
    else actor.body.wakeUp();
    actor.phase = 'idle';
    this.syncActorMesh(actor, false);
  }

  roll({ attempts }) {
    if (this.isBusy() || !Array.isArray(attempts) || attempts.length !== this.diceCount) return false;
    this.highlightDice([]);
    if (this.reducedMotion) {
      this.actors.forEach((actor) => { actor.phase = 'settling'; });
      this.setState('settling');
      this.reducedMotionTimeout = window.setTimeout(() => this.settleImmediately(attempts), 120);
      return true;
    }

    this.resultValues = [];
    delete this.canvas.dataset.resultValue;
    delete this.canvas.dataset.resultValues;
    delete this.canvas.dataset.topFace;
    delete this.canvas.dataset.landingValue;
    delete this.canvas.dataset.landingValues;
    delete this.canvas.dataset.landingQuaternion;
    delete this.canvas.dataset.finalQuaternion;
    delete this.canvas.dataset.completionMode;
    this.rollStartedAt = performance.now();
    attempts.forEach(({ seedWords }, index) => {
      const actor = this.actors[index];
      const launch = createRollLaunch(this.definition, seedWords);
      if (this.diceCount === 2) {
        const direction = index === 0 ? -1 : 1;
        launch.position.x = direction * 1.25 + launch.position.x * 0.2;
        launch.position.z += direction * 0.08;
        launch.velocity.x = -direction * 0.32 + launch.velocity.x * 0.35;
      }
      actor.phase = 'throwing';
      actor.resultValue = null;
      actor.collisionCount = 0;
      actor.lastImpactAt = 0;
      actor.stableFrames = 0;
      actor.stableCandidateValue = null;
      actor.settleAssistStartedAt = 0;
      actor.borderStallStartedAt = null;
      actor.borderRescueCount = 0;
      actor.lastBorderRescueAt = -Infinity;
      actor.contactState = { touchingGround: false, touchingWall: false };
      actor.body.type = CANNON.Body.DYNAMIC;
      actor.body.mass = this.definition.physics.mass;
      actor.body.updateMassProperties();
      actor.body.position.set(launch.position.x, launch.position.y, launch.position.z);
      actor.body.velocity.set(launch.velocity.x, launch.velocity.y, launch.velocity.z);
      setQuaternion(actor.body.quaternion, launch.quaternion);
      actor.body.angularVelocity.set(
        launch.angularVelocity.x,
        launch.angularVelocity.y,
        launch.angularVelocity.z,
      );
      actor.body.linearDamping = this.definition.physics.linearDamping;
      actor.body.angularDamping = this.definition.physics.angularDamping;
      actor.body.force.setZero();
      actor.body.torque.setZero();
      actor.body.aabbNeedsUpdate = true;
      setRollingSleepState(actor.body, true);
    });
    this.setState('throwing');
    return true;
  }

  settleImmediately(attempts) {
    attempts.forEach(({ fallbackValue }, index) => {
      const targetX = this.diceCount === 2 ? (index === 0 ? -1.15 : 1.15) : 0;
      this.setActorToValue(this.actors[index], fallbackValue, targetX, 0, true);
      this.actors[index].phase = 'complete';
    });
    this.resultValues = attempts.map(({ fallbackValue }) => fallbackValue);
    this.updateCanvasResults();
    this.setState('complete');
    this.onSettled([...this.resultValues]);
  }

  getLandingCandidate(actor, quaternion = actor.body.quaternion) {
    const value = topFaceValue(this.diceType, quaternion);
    const target = nearestRotationForValue(this.diceType, value, quaternion);
    const faceIndex = this.definition.faceValues.indexOf(value);
    const direction = this.definition.resultDirections[faceIndex];
    const transformed = quaternion.vmult(new CANNON.Vec3(direction.x, direction.y, direction.z));
    return {
      value,
      target,
      alignment: transformed.y,
      restHeight: restingHeightForQuaternion(this.diceType, target),
    };
  }

  applySettleDamping(actor, elapsed) {
    const assistElapsed = Math.max(0, elapsed - actor.settleAssistStartedAt);
    const assist = getSettleAssistProgress(assistElapsed);
    actor.body.linearDamping = this.definition.physics.linearDamping
      + assist * (0.42 - this.definition.physics.linearDamping);
    actor.body.angularDamping = this.definition.physics.angularDamping
      + assist * (0.35 - this.definition.physics.angularDamping);
  }

  applyBorderRescue(actor, elapsed, now) {
    const safeRadius = TRAY_APOTHEM - this.definition.physics.radius - 0.12;
    const candidate = this.getLandingCandidate(actor);
    const result = updateBorderStall({
      elapsed,
      position: actor.body.position,
      restHeight: candidate.restHeight,
      linearVelocity: actor.body.velocity,
      angularVelocity: actor.body.angularVelocity,
      collisionCount: actor.collisionCount,
      stallStartedAt: actor.borderStallStartedAt,
      rescueCount: actor.borderRescueCount,
      lastRescueAt: actor.lastBorderRescueAt,
      now,
      mass: this.definition.physics.mass,
      radius: this.definition.physics.radius,
      safeRadius,
      touchingWall: actor.contactState.touchingWall,
    });
    actor.borderStallStartedAt = result.stallStartedAt;
    actor.borderRescueCount = result.rescueCount;
    actor.lastBorderRescueAt = result.lastRescueAt;
    if (!result.rescue) return;
    const { impulse, relativePoint } = result.rescue;
    actor.body.applyImpulse(
      new CANNON.Vec3(impulse.x, impulse.y, impulse.z),
      new CANNON.Vec3(relativePoint.x, relativePoint.y, relativePoint.z),
    );
  }

  beginCorrection(actor, now) {
    const candidate = this.getLandingCandidate(actor);
    actor.correctionValue = candidate.value;
    actor.correctionTargetQuaternion.set(
      candidate.target.x,
      candidate.target.y,
      candidate.target.z,
      candidate.target.w,
    );
    actor.restHeight = candidate.restHeight;
    actor.correctionStartedAt = now;
    actor.correctionFromQuaternion = actor.body.quaternion.clone();
    actor.correctionFromPosition = actor.body.position.clone();
    const safeRadius = TRAY_APOTHEM - this.definition.physics.radius - 0.12;
    const safePosition = clampPlanarPosition(actor.correctionFromPosition, safeRadius);
    actor.correctionTargetPosition = new CANNON.Vec3(safePosition.x, actor.restHeight, safePosition.z);
    actor.body.type = CANNON.Body.KINEMATIC;
    actor.body.velocity.setZero();
    actor.body.angularVelocity.setZero();
    actor.body.updateMassProperties();
    actor.phase = 'correcting';
  }

  updateCorrection(actor, now) {
    const progress = smoothstep((now - actor.correctionStartedAt) / ((PHYSICAL_ROLL_LIMIT_SECONDS - SAFETY_CORRECTION_START_SECONDS) * 1000));
    actor.correctionFromQuaternion.slerp(actor.correctionTargetQuaternion, progress, actor.body.quaternion);
    actor.body.position.set(
      actor.correctionFromPosition.x + (actor.correctionTargetPosition.x - actor.correctionFromPosition.x) * progress,
      actor.correctionFromPosition.y + (actor.correctionTargetPosition.y - actor.correctionFromPosition.y) * progress,
      actor.correctionFromPosition.z + (actor.correctionTargetPosition.z - actor.correctionFromPosition.z) * progress,
    );
    actor.body.aabbNeedsUpdate = true;
    if (progress >= 0.999) this.finishActorRoll(actor, {
      value: actor.correctionValue,
      quaternion: actor.correctionTargetQuaternion,
      restHeight: actor.restHeight,
      completionMode: 'corrected',
    });
  }

  finishActorRoll(actor, { value, quaternion, restHeight, completionMode = 'natural' }) {
    if (actor.phase === 'landed' || actor.phase === 'recentering' || actor.phase === 'complete') return;
    actor.resultValue = value;
    actor.restHeight = restHeight;
    actor.finalQuaternion.copy(quaternion);
    actor.completionMode = completionMode;
    actor.body.type = CANNON.Body.KINEMATIC;
    actor.body.updateMassProperties();
    actor.body.position.y = actor.restHeight;
    actor.body.velocity.setZero();
    actor.body.angularVelocity.setZero();
    actor.body.quaternion.copy(actor.finalQuaternion);
    actor.body.aabbNeedsUpdate = true;
    actor.phase = 'landed';
    this.syncActorMesh(actor, false);
  }

  beginRecentering(now) {
    if (!this.actors.every((actor) => actor.phase === 'landed')) return;
    this.actors.forEach((actor, index) => {
      actor.recenterStartedAt = now;
      actor.recenterFromPosition = actor.body.position.clone();
      actor.recenterTarget = {
        x: this.diceCount === 2 ? (index === 0 ? -1.15 : 1.15) : 0,
        z: 0,
      };
      actor.phase = 'recentering';
    });
    this.setState('recentering');
  }

  updateRecentering(actor, now) {
    const position = getRecenteringPosition(
      actor.recenterFromPosition,
      now - actor.recenterStartedAt,
      RECENTER_DURATION_MS,
      actor.recenterTarget,
    );
    actor.body.position.set(
      position.x,
      actor.restHeight,
      position.z,
    );
    actor.body.aabbNeedsUpdate = true;
    if (position.progress >= 0.999) this.completeActor(actor);
  }

  completeActor(actor) {
    actor.body.type = CANNON.Body.DYNAMIC;
    actor.body.mass = this.definition.physics.mass;
    actor.body.updateMassProperties();
    actor.body.position.set(actor.recenterTarget.x, actor.restHeight, actor.recenterTarget.z);
    actor.body.velocity.setZero();
    actor.body.angularVelocity.setZero();
    actor.body.quaternion.copy(actor.finalQuaternion);
    actor.body.aabbNeedsUpdate = true;
    setRollingSleepState(actor.body, false);
    actor.body.sleep();
    actor.phase = 'complete';
    this.syncActorMesh(actor, false);
    if (this.actors.every((candidate) => candidate.phase === 'complete')) this.completeRollGroup();
  }

  updateCanvasResults() {
    this.canvas.dataset.resultValues = this.resultValues.join(',');
    this.canvas.dataset.landingValues = this.resultValues.join(',');
    this.canvas.dataset.completionMode = this.actors.map((actor) => actor.completionMode ?? 'immediate').join(',');
    if (this.diceCount === 1) {
      const actor = this.actors[0];
      this.canvas.dataset.resultValue = String(actor.resultValue);
      this.canvas.dataset.topFace = String(topFaceValue(this.diceType, actor.body.quaternion));
      this.canvas.dataset.landingValue = String(actor.resultValue);
      this.canvas.dataset.landingQuaternion = serializeQuaternion(actor.finalQuaternion);
      this.canvas.dataset.finalQuaternion = serializeQuaternion(actor.body.quaternion);
    }
  }

  completeRollGroup() {
    this.resultValues = this.actors.map((actor) => actor.resultValue);
    this.updateCanvasResults();
    this.setState('complete');
    this.onSettled([...this.resultValues]);
  }

  checkForCompletion(actor, elapsed) {
    if (elapsed < MINIMUM_ROLL_SECONDS) return;
    const candidate = this.getLandingCandidate(actor);
    const stable = isValidTabletopLanding({
      touchingGround: actor.contactState.touchingGround,
      positionY: actor.body.position.y,
      restHeight: candidate.restHeight,
      alignment: candidate.alignment,
      topMatches: topFaceValue(this.diceType, actor.body.quaternion) === candidate.value,
      linearVelocitySquared: actor.body.velocity.lengthSquared(),
      angularVelocitySquared: actor.body.angularVelocity.lengthSquared(),
    });
    if (!stable || actor.stableCandidateValue !== candidate.value) {
      actor.stableFrames = stable ? 1 : 0;
      actor.stableCandidateValue = stable ? candidate.value : null;
      return;
    }
    actor.stableFrames += 1;
    if (actor.stableFrames >= 10) this.finishActorRoll(actor, {
      value: candidate.value,
      quaternion: actor.body.quaternion,
      restHeight: actor.body.position.y,
    });
  }

  syncActorMesh(actor, interpolated = true) {
    const position = interpolated ? actor.body.interpolatedPosition : actor.body.position;
    const quaternion = interpolated ? actor.body.interpolatedQuaternion : actor.body.quaternion;
    actor.mesh.position.set(position.x, position.y, position.z);
    actor.mesh.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }

  highlightDice(selectedIndices) {
    const hasSelection = selectedIndices.length > 0;
    const theme = this.definition ? this.getTheme(this.definition.id) : null;
    this.actors.forEach((actor, index) => {
      const selected = selectedIndices.includes(index);
      actor.mesh.material.color.setHex(hasSelection && !selected ? 0xa3a3a3 : 0xffffff);
      actor.mesh.material.emissive.set(hasSelection && selected ? theme.accent : 0x000000);
      actor.mesh.material.emissiveIntensity = hasSelection && selected ? 0.22 : 0;
      actor.mesh.children.forEach((child) => { child.material.opacity = hasSelection && !selected ? 0.58 : 0.92; });
    });
  }

  updateQuality(deltaSeconds) {
    if (this.state !== 'throwing' && this.state !== 'settling') return;
    const slowFrameThreshold = this.frameInterval > 0 ? (this.frameInterval / 1000) * 1.35 : 0.022;
    this.slowFrames = deltaSeconds > slowFrameThreshold ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2);
    if (this.slowFrames < 30 || this.qualityScale <= 0.7) return;
    this.qualityScale = Math.max(0.7, this.qualityScale - 0.15);
    this.slowFrames = 0;
    this.resize();
  }

  animate(now) {
    if (this.disposed) return;
    this.frameRequest = requestAnimationFrame(this.animate);
    if (this.frameInterval > 0 && now + 0.75 < this.nextFrameAt) return;
    this.nextFrameAt = this.frameInterval > 0 ? now + this.frameInterval : now;
    const deltaSeconds = clamp((now - this.lastFrameAt) / 1000, 0, 0.05);
    this.lastFrameAt = now;
    const elapsed = (now - this.rollStartedAt) / 1000;

    const movingActors = this.actors.filter((actor) => actor.phase === 'throwing' || actor.phase === 'settling');
    if (movingActors.length > 0) {
      movingActors.forEach((actor) => {
        const candidate = this.getLandingCandidate(actor);
        if (actor.phase === 'throwing' && shouldBeginSettleAssist({
          elapsed,
          position: actor.body.position,
          restHeight: candidate.restHeight,
          linearVelocity: actor.body.velocity,
          angularVelocity: actor.body.angularVelocity,
          collisionCount: actor.collisionCount,
        })) {
          actor.settleAssistStartedAt = elapsed;
          actor.phase = 'settling';
        }
        if (actor.phase === 'settling') this.applySettleDamping(actor, elapsed);
      });
      this.world.step(FIXED_TIME_STEP, deltaSeconds, MAX_SUBSTEPS);
      movingActors.forEach((actor) => {
        if (actor.phase !== 'throwing' && actor.phase !== 'settling') return;
        actor.contactState = classifyDiceContacts(
          this.world.contacts,
          actor.body,
          this.groundBody,
          this.wallBodySet,
        );
        this.applyBorderRescue(actor, elapsed, now);
        this.checkForCompletion(actor, elapsed);
        if (elapsed >= SAFETY_CORRECTION_START_SECONDS && (actor.phase === 'throwing' || actor.phase === 'settling')) {
          this.beginCorrection(actor, now);
        }
      });
    }

    this.actors
      .filter((actor) => actor.phase === 'correcting')
      .forEach((actor) => this.updateCorrection(actor, now));
    this.beginRecentering(now);
    this.actors
      .filter((actor) => actor.phase === 'recentering')
      .forEach((actor) => this.updateRecentering(actor, now));

    this.actors.forEach((actor) => this.syncActorMesh(
      actor,
      actor.phase === 'throwing' || actor.phase === 'settling',
    ));

    if (this.isBusy()) {
      if (this.actors.some((actor) => actor.phase === 'throwing')) this.setState('throwing');
      else if (this.actors.some((actor) => actor.phase === 'settling')) this.setState('settling');
      else if (this.actors.some((actor) => actor.phase === 'correcting')) this.setState('correcting');
      else if (this.actors.some((actor) => actor.phase === 'recentering')) this.setState('recentering');
    }

    this.updateQuality(deltaSeconds);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const bounds = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    const mobileLimit = matchMedia('(max-width: 760px)').matches ? 1.5 : 2;
    const baseRatio = Math.min(devicePixelRatio || 1, mobileLimit);
    this.renderer.setPixelRatio(baseRatio * this.qualityScale);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    window.clearTimeout(this.reducedMotionTimeout);
    cancelAnimationFrame(this.frameRequest);
    cancelAnimationFrame(this.resizeRequest);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.actors.forEach((actor) => this.disposeActor(actor));
    this.actors = [];
  }
}
