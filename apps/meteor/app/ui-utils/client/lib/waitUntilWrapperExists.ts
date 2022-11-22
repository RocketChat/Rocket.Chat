export const waitUntilWrapperExists = async (selector = '.messages-box .wrapper'): Promise<Element> => {
	const element = document.querySelector(selector);
	return new Promise((resolve) => {
		if (element) {
			return resolve(element);
		}
		const observer = new MutationObserver(function (_, obs) {
			const element = document.querySelector(selector);
			if (element) {
				obs.disconnect(); // stop observing
				return resolve(element);
			}
		});
		observer.observe(document, {
			childList: true,
			subtree: true,
		});
	});
};
