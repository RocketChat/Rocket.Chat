export const replaceReactAriaIds = (container: HTMLElement): HTMLElement => {
	const selectors = ['id', 'for', 'aria-labelledby'];
	const ariaSelector = (el: string) => `[${el}^="react-aria"]`;
	const regexp = /react-aria\d+-\d+/g;
	const staticId = 'static-id';

	const attributesMap: Record<string, string> = {};

	container.querySelectorAll(selectors.map(ariaSelector).join(', ')).forEach((el, index) => {
		selectors.forEach((selector) => {
			const attr = el.getAttribute(selector);

			if (attr?.match(regexp)) {
				const newAttr = attributesMap[attr] || `${staticId}-${index}`;
				el.setAttribute(selector, newAttr);
				attributesMap[attr] = newAttr;
			}
		});
	});

	return container;
};
