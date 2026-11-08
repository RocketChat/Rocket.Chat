export type TargetBoundaries = {
	t: number;
	b: number;
	r: number;
	l: number;
};

export function getTargetBoundaries({
	anchorRect,
	targetRect,
	margin = 0,
}: {
	anchorRect: DOMRect;
	targetRect: DOMRect;
	margin?: number;
}): TargetBoundaries {
	return {
		t: anchorRect.top - targetRect.height - margin,
		b: anchorRect.bottom + margin,
		r: anchorRect.right + margin,
		l: anchorRect.left - targetRect.width - margin,
	};
}
