const anchor = new WeakMap<HTMLElement, () => void>();

export const deleteAnchor = (element: HTMLElement): void => {
	const fn = anchor.get(element);
	if (fn) {
		fn();
	}
};
export const registerAnchor = (element: HTMLElement, fn: () => void): void => {
	anchor.set(element, fn);
};
