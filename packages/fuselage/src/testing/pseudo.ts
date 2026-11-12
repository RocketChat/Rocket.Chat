import { expect, waitFor } from 'storybook/test';

/** jsdom has no layout and no stylesheet cascade, so a spec about computed styles runs in the browser only. */
export const isJsdom = () => navigator.userAgent.includes('jsdom');

type ForcedState = 'hover' | 'active' | 'focus' | 'focus-visible';

/** Rules the addon never saw: Tamagui's runtime build injects its `:hover` rules after the addon has scanned the sheets. */
const mirroredRules = (states: ForcedState[]) => {
	const pattern = new RegExp(`:(${states.join('|')})(?![\\w-])`, 'g');
	const mirrored: string[] = [];
	for (const sheet of [...document.styleSheets, ...document.adoptedStyleSheets]) {
		let rules: CSSRuleList;
		try {
			rules = sheet.cssRules;
		} catch {
			continue;
		}
		for (const { cssText } of rules) {
			if (pattern.test(cssText)) mirrored.push(cssText.replace(pattern, '.pseudo-$1'));
			pattern.lastIndex = 0;
		}
	}
	return mirrored;
};

/**
 * Applies `states` to `element` the way storybook-addon-pseudo-states does: the addon rewrites every `:hover` rule into a
 * `.pseudo-hover` one, and a `play` function cannot drive the real pointer. The rules in the document now are mirrored the
 * same way, so the ones injected at runtime are covered too. Returns the function that removes them.
 */
export const forcePseudo = (element: Element, ...states: ForcedState[]) => {
	const classes = states.map((state) => `pseudo-${state}`);
	const style = document.createElement('style');
	style.textContent = mirroredRules(states).join('\n');
	document.head.append(style);
	element.classList.add(...classes);
	return () => {
		element.classList.remove(...classes);
		style.remove();
	};
};

export const computed = (element: Element, property: string) => getComputedStyle(element).getPropertyValue(property);

/** Waits for the computed `property` of `element` to be `value`: the rewritten rules land after the render. */
export const expectComputed = async (element: Element, property: string, value: string | RegExp) =>
	waitFor(() =>
		typeof value === 'string' ? expect(computed(element, property)).toBe(value) : expect(computed(element, property)).toMatch(value),
	);
