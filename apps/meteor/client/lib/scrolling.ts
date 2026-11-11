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
