export const waitForElement = async <TElement extends Element>(
	selector: string,
	{ parent = document.documentElement, signal }: { parent?: Element; signal?: AbortSignal } = {},
): Promise<TElement> => {
	const element = parent.querySelector<TElement>(selector);
	return new Promise((resolve, reject) => {
		if (element) {
			return resolve(element);
		}
		const observer = new MutationObserver((_, obs) => {
			const element = parent.querySelector<TElement>(selector);
			if (element) {
				obs.disconnect(); // stop observing
				return resolve(element);
			}
		});
		observer.observe(parent, {
			childList: true,
			subtree: true,
		});

		signal?.addEventListener('abort', () => {
			observer.disconnect();
			reject(new DOMException('Aborted', 'AbortError'));
		});
	});
};
