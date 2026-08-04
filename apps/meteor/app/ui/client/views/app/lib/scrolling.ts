export function isAtBottom(element: HTMLElement, scrollThreshold = 0): boolean {
	return element.scrollTop + scrollThreshold >= element.scrollHeight - element.clientHeight;
}

// Mainly used for allow mock during testing

export const getBoundingClientRect = (ref: HTMLElement) => {
	const { top, bottom, left, right } = ref.getBoundingClientRect();
	const { scrollTop, scrollHeight, clientHeight } = ref;

	return {
		top,
		bottom,
		left,
		right,
		scrollTop,
		scrollHeight,
		clientHeight,
	};
};
