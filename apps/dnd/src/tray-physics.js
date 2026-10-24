import * as CANNON from 'cannon-es';

export const TRAY_RADIUS = 4.75;
export const TRAY_APOTHEM = TRAY_RADIUS * Math.cos(Math.PI / 8);
export const WALL_FLARE_RADIANS = Math.PI / 18;
export const WALL_HALF_HEIGHT = 1.2;
export const WALL_HALF_THICKNESS = 0.2;
export const WALL_BOTTOM_Y = -0.15;
export const WALL_BOTTOM_INNER_RADIUS = TRAY_APOTHEM - 0.28;
export const LANDING_HEIGHT_TOLERANCE = 0.06;
export const WALL_FRICTION = 0.12;
export const WALL_RESTITUTION = 0.08;

export function createDiceCollider(definition) {
  return new CANNON.ConvexPolyhedron({
    vertices: definition.vertices.map((vertex) => new CANNON.Vec3(
      vertex.x * definition.physics.radius,
      vertex.y * definition.physics.radius,
      vertex.z * definition.physics.radius,
    )),
    faces: definition.faces.map((face) => [...face]),
  });
}

export function getWallColliderDescriptor(index) {
  const angle = index * Math.PI / 4 + Math.PI / 8;
  const sine = Math.sin(WALL_FLARE_RADIANS);
  const cosine = Math.cos(WALL_FLARE_RADIANS);
  const centerRadius = WALL_BOTTOM_INNER_RADIUS
    + WALL_HALF_HEIGHT * sine
    + WALL_HALF_THICKNESS * cosine;
  const centerY = WALL_BOTTOM_Y
    + WALL_HALF_HEIGHT * cosine
    - WALL_HALF_THICKNESS * sine;
  const topInnerRadius = centerRadius
    + WALL_HALF_HEIGHT * sine
    - WALL_HALF_THICKNESS * cosine;

  return {
    angle,
    centerRadius,
    centerY,
    bottomInnerRadius: WALL_BOTTOM_INNER_RADIUS,
    topInnerRadius,
    position: {
      x: Math.sin(angle) * centerRadius,
      y: centerY,
      z: Math.cos(angle) * centerRadius,
    },
  };
}

export function addTrayPhysics(world, groundMaterial, wallMaterial) {
  const groundBody = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: new CANNON.Box(new CANNON.Vec3(TRAY_RADIUS + 1.25, 0.15, TRAY_RADIUS + 1.25)),
    position: new CANNON.Vec3(0, -0.15, 0),
  });
  world.addBody(groundBody);

  const sideLength = 2 * TRAY_RADIUS * Math.sin(Math.PI / 8);
  const wallBodies = [];
  for (let index = 0; index < 8; index += 1) {
    const descriptor = getWallColliderDescriptor(index);
    const wall = new CANNON.Body({ mass: 0, material: wallMaterial });
    wall.addShape(new CANNON.Box(new CANNON.Vec3(
      sideLength / 2 + 0.12,
      WALL_HALF_HEIGHT,
      WALL_HALF_THICKNESS,
    )));
    wall.position.set(descriptor.position.x, descriptor.position.y, descriptor.position.z);

    const yaw = new CANNON.Quaternion();
    const flare = new CANNON.Quaternion();
    yaw.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), descriptor.angle);
    flare.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), WALL_FLARE_RADIANS);
    yaw.mult(flare, wall.quaternion);
    world.addBody(wall);
    wallBodies.push(wall);
  }

  return { groundBody, wallBodies };
}

export function classifyDiceContacts(contacts, diceBody, groundBody, wallBodies) {
  const wallSet = wallBodies instanceof Set ? wallBodies : new Set(wallBodies);
  let touchingGround = false;
  let touchingWall = false;

  for (const contact of contacts) {
    let otherBody = null;
    if (contact.bi === diceBody) otherBody = contact.bj;
    else if (contact.bj === diceBody) otherBody = contact.bi;
    if (!otherBody) continue;
    if (otherBody === groundBody) touchingGround = true;
    if (wallSet.has(otherBody)) touchingWall = true;
    if (touchingGround && touchingWall) break;
  }

  return { touchingGround, touchingWall };
}

export function isValidTabletopLanding({
  touchingGround,
  positionY,
  restHeight,
  alignment,
  topMatches,
  linearVelocitySquared,
  angularVelocitySquared,
}) {
  return touchingGround
    && positionY <= restHeight + LANDING_HEIGHT_TOLERANCE
    && alignment > 0.9992
    && topMatches
    && linearVelocitySquared < 0.018
    && angularVelocitySquared < 0.035;
}

export function setRollingSleepState(body, rolling) {
  body.allowSleep = !rolling;
  if (rolling) body.wakeUp();
}
