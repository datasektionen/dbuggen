export const TOOLTIP_DELAY_MS = 500;

export function calculateTooltipPosition(
  targetRect,
  tooltipRect,
  viewport,
  { gap = 8, margin = 12 } = {},
) {
  const maxLeft = Math.max(margin, viewport.width - tooltipRect.width - margin);
  const centeredLeft = targetRect.left + ((targetRect.width - tooltipRect.width) / 2);
  const left = Math.min(maxLeft, Math.max(margin, centeredLeft));
  const topAbove = targetRect.top - tooltipRect.height - gap;
  const placement = topAbove >= margin ? 'top' : 'bottom';
  const preferredTop = placement === 'top' ? topAbove : targetRect.bottom + gap;
  const maxTop = Math.max(margin, viewport.height - tooltipRect.height - margin);
  const top = Math.min(maxTop, Math.max(margin, preferredTop));

  return { left, top, placement };
}
