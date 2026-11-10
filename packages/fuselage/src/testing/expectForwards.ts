import { fireEvent } from '@testing-library/dom';
import { expect } from 'storybook/test';

type Spy = (...args: any[]) => unknown;

export type Forwarded = {
	'className'?: string;
	'id'?: string;
	'title'?: string;
	'data-qa'?: string;
	'data-anything'?: string;
	'aria-label'?: string;
	'ref'?: { current: unknown } | Spy;
	/** Event handler props by name (`onClick`), each a mock the story passed in; the helper fires the event. */
	'handlers'?: Record<string, Spy>;
};

const ATTRIBUTES = ['id', 'title', 'data-qa', 'data-anything', 'aria-label'] as const;

// React does not listen to focus, blur, mouseenter or mouseleave: it derives these props from the bubbling events
const REACT_EVENTS: Record<string, string> = { focus: 'focusIn', blur: 'focusOut', mouseEnter: 'mouseOver', mouseLeave: 'mouseOut' };

const callCount = (handler: Spy) => (handler as any).mock.calls.length as number;

/**
 * Asserts that what the story passed to a component reaches the DOM element of `part` (a selector inside `canvas`, or the
 * element): the attributes, the `className` after the component's own `rcx-*` classes, the ref and the handlers.
 */
export const expectForwards = async (canvas: HTMLElement, part: string | HTMLElement, expected: Forwarded) => {
	const element = typeof part === 'string' ? canvas.querySelector<HTMLElement>(part) : part;
	if (!element) throw new Error(`No element matches ${typeof part === 'string' ? part : 'the given element'}`);

	for (const name of ATTRIBUTES) {
		if (expected[name] !== undefined) {
			await expect(element).toHaveAttribute(name, expected[name]);
		}
	}

	if (expected.className) {
		const classes = [...element.classList];
		const own = classes.map((name, index) => (name.startsWith('rcx-') ? index : -1)).filter((index) => index >= 0);
		const given = expected.className.split(/\s+/).map((name) => classes.indexOf(name));
		await expect(given).not.toContain(-1);
		await expect(Math.min(...given)).toBeGreaterThan(Math.max(...own));
	}

	const { ref } = expected;
	if (typeof ref === 'function') {
		await expect(ref).toHaveBeenCalledWith(element);
	} else if (ref) {
		await expect(ref.current).toBe(element);
	}

	for (const [name, handler] of Object.entries(expected.handlers ?? {})) {
		const domEvent = name.replace(/^on/, '').replace(/^./, (letter) => letter.toLowerCase());
		const fire = fireEvent[(REACT_EVENTS[domEvent] ?? domEvent) as keyof typeof fireEvent];
		if (typeof fire !== 'function') throw new Error(`Cannot fire ${name}`);
		const before = callCount(handler);
		fire(element);
		await expect(callCount(handler)).toBeGreaterThan(before);
	}
};
