export const normalizeDOMRect = (rect: DOMRect | undefined) => {
	if (!rect) {
		throw new Error('DOMRect is not defined');
	}

	const { left, top, right, bottom } = rect;
	return {
		left,
		top,
		right,
		bottom,
	};
};
