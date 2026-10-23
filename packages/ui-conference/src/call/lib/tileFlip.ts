/** Past this many pixels a tile has visibly moved; below it an animation would only be a shimmer. */
const MOVE_THRESHOLD_PX = 1;

/** How far a tile has to travel back to where it was, or null when it has not really moved. */
export const flipOffset = (
	previous: Pick<DOMRect, 'left' | 'top'>,
	current: Pick<DOMRect, 'left' | 'top'>,
): { dx: number; dy: number } | null => {
	const dx = previous.left - current.left;
	const dy = previous.top - current.top;
	return Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX ? { dx, dy } : null;
};
