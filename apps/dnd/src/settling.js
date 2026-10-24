function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(value) {
  const amount = clamp(value, 0, 1);
  return amount * amount * (3 - 2 * amount);
}

export const SETTLE_GRACE_SECONDS = 1.9;
export const SETTLE_FALLBACK_SECONDS = 2.75;
export const SETTLE_ASSIST_RAMP_SECONDS = 1.25;
export const SAFETY_CORRECTION_START_SECONDS = 3.6;
export const PHYSICAL_ROLL_LIMIT_SECONDS = 3.85;
export const BORDER_STALL_START_SECONDS = 2.05;
export const BORDER_STALL_DURATION_MS = 180;
export const BORDER_RESCUE_COOLDOWN_MS = 350;
export const MAX_BORDER_RESCUES = 2;
export const RECENTER_DURATION_MS = 200;

export function getSettleAssistProgress(assistElapsed, rampSeconds = SETTLE_ASSIST_RAMP_SECONDS) {
  return smoothstep(assistElapsed / rampSeconds);
}

export function shouldBeginSettleAssist({
  elapsed,
  position,
  restHeight,
  linearVelocity,
  angularVelocity,
  collisionCount,
}) {
  if (elapsed < SETTLE_GRACE_SECONDS) return false;
  if (elapsed >= SETTLE_FALLBACK_SECONDS) return true;
  if (collisionCount < 1 || position.y > restHeight + 0.55) return false;

  const linearSpeed = Math.hypot(linearVelocity.x, linearVelocity.y, linearVelocity.z);
  const angularSpeed = Math.hypot(angularVelocity.x, angularVelocity.y, angularVelocity.z);
  return linearSpeed < 1.25 && angularSpeed < 5;
}

export function getRecenteringPosition(position, elapsedMs, durationMs = RECENTER_DURATION_MS, target = { x: 0, z: 0 }) {
  const progress = smoothstep(elapsedMs / durationMs);
  if (progress >= 1) return { x: target.x, y: position.y, z: target.z, progress: 1 };
  return {
    x: position.x + (target.x - position.x) * progress,
    y: position.y,
    z: position.z + (target.z - position.z) * progress,
    progress,
  };
}

export function clampPlanarPosition(position, maximumRadius) {
  const radius = Math.hypot(position.x, position.z);
  if (radius <= maximumRadius || radius < 1e-9) return { x: position.x, z: position.z };
  const amount = maximumRadius / radius;
  return { x: position.x * amount, z: position.z * amount };
}

export function updateBorderStall({
  elapsed,
  position,
  restHeight,
  linearVelocity,
  angularVelocity,
  collisionCount,
  stallStartedAt = null,
  rescueCount = 0,
  lastRescueAt = -Infinity,
  now,
  mass,
  radius,
  safeRadius,
  touchingWall = false,
}) {
  const planarRadius = Math.hypot(position.x, position.z);
  const linearSpeed = Math.hypot(linearVelocity.x, linearVelocity.y, linearVelocity.z);
  const angularSpeed = Math.hypot(angularVelocity.x, angularVelocity.y, angularVelocity.z);
  const stalled = elapsed >= BORDER_STALL_START_SECONDS
    && collisionCount > 0
    && touchingWall
    && planarRadius > safeRadius
    && position.y > restHeight + 0.18
    && linearSpeed < 0.4
    && angularSpeed < 0.75;
  if (!stalled) return { stallStartedAt: null, rescueCount, lastRescueAt, rescue: null };

  const nextStallStartedAt = Number.isFinite(stallStartedAt) ? stallStartedAt : now;
  const canRescue = now - nextStallStartedAt >= BORDER_STALL_DURATION_MS
    && rescueCount < MAX_BORDER_RESCUES
    && now - lastRescueAt >= BORDER_RESCUE_COOLDOWN_MS;
  if (!canRescue) {
    return {
      stallStartedAt: nextStallStartedAt,
      rescueCount,
      lastRescueAt,
      rescue: null,
    };
  }

  const inward = planarRadius > 1e-9
    ? { x: -position.x / planarRadius, z: -position.z / planarRadius }
    : { x: 0, z: 1 };
  const tangent = { x: -inward.z, z: inward.x };
  return {
    stallStartedAt: null,
    rescueCount: rescueCount + 1,
    lastRescueAt: now,
    rescue: {
      impulse: {
        x: inward.x * mass * 1.15,
        y: -mass * 0.55,
        z: inward.z * mass * 1.15,
      },
      relativePoint: {
        x: tangent.x * radius * 0.35,
        y: radius * 0.25,
        z: tangent.z * radius * 0.35,
      },
    },
  };
}
