export const waitForElement = async (
	selector: string,
	{ parent = document.documentElement }: { parent?: HTMLElement } = {},
): Promise<Element> => {
	const element = parent.querySelector(selector);
	return new Promise((resolve) => {
		if (element) {
			return resolve(element);
		}
		const observer = new MutationObserver((_, obs) => {
			const element = parent.querySelector(selector);
			if (element) {
				obs.disconnect(); // stop observing
				return resolve(element);
			}
		});
		observer.observe(parent, {
			childList: true,
			subtree: true,
		});
	});
};
