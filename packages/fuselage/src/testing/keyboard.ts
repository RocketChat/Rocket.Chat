import { userEvent } from '@testing-library/user-event';
import { expect } from 'storybook/test';

type Spy = (...args: any[]) => unknown;

const callCount = (handler: Spy) => (handler as any).mock.calls.length as number;

const focus = async (element: HTMLElement) => {
	element.focus();
	await expect(element).toHaveFocus();
};

/** A control that takes Enter and Space calls `handler` once for each, as a native button does. */
export const expectKeyboardActivation = async (element: HTMLElement, handler: Spy) => {
	const user = userEvent.setup();
	await focus(element);
	const before = callCount(handler);
	await user.keyboard('{Enter}');
	await expect(callCount(handler)).toBe(before + 1);
	await user.keyboard(' ');
	await expect(callCount(handler)).toBe(before + 2);
};

/** Tab moves through `elements` in this order, starting from the first; what follows the last one is not checked. */
export const expectTabOrder = async (elements: HTMLElement[]) => {
	const user = userEvent.setup();
	await focus(elements[0]);
	for (const element of elements.slice(1)) {
		await user.tab();
		await expect(element).toHaveFocus();
	}
};

const DEFAULT_ROW = '[data-index], [role="listitem"], li, .rcx-item, .rcx-item-group-header';

const rowOf = (element: Element | null, list: HTMLElement, rowSelector: string) => {
	const row = element?.closest(rowSelector);
	return row && list.contains(row) ? row : null;
};

/**
 * Composite list, as docs/frontend/list-keyboard-navigation.md describes it: Down and Up move between rows, Tab walks the
 * focused row and then leaves the list without entering the next row. Needs at least two rows; `firstTarget` is the focus
 * target of the first row. `rowSelector` matches a row when the list's rows are none of Fuselage's own.
 */
export const expectCompositeList = async (list: HTMLElement, firstTarget: HTMLElement, rowSelector = DEFAULT_ROW) => {
	const user = userEvent.setup();
	await focus(firstTarget);

	await user.keyboard('{ArrowDown}');
	const second = document.activeElement as HTMLElement;
	await expect(list).toContainElement(second);
	await expect(rowOf(second, list, rowSelector)).not.toBe(rowOf(firstTarget, list, rowSelector));

	await user.keyboard('{ArrowUp}');
	await expect(firstTarget).toHaveFocus();

	const row = rowOf(firstTarget, list, rowSelector);
	for (let presses = 0; presses < 20 && list.contains(document.activeElement); presses++) {
		await user.tab();
		if (list.contains(document.activeElement)) await expect(rowOf(document.activeElement, list, rowSelector)).toBe(row);
	}
	await expect(list).not.toContainElement(document.activeElement as HTMLElement);
};

/**
 * Combobox: focus stays on `input`, the arrows move `aria-activedescendant` through `options`, and Enter picks the active
 * option, which `onPick` reports.
 */
export const expectCombobox = async (input: HTMLElement, options: HTMLElement[], onPick: Spy) => {
	const user = userEvent.setup();
	await focus(input);

	await user.keyboard('{ArrowDown}');
	await expect(input).toHaveFocus();
	await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
	await user.keyboard('{ArrowDown}');
	await expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
	await user.keyboard('{ArrowUp}');
	await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

	const before = callCount(onPick);
	await user.keyboard('{Enter}');
	await expect(callCount(onPick)).toBe(before + 1);
};

/**
 * Menu: Enter on `trigger` opens the menu whose items `getItems()` returns, the arrows move the focus between them, and
 * Escape closes the menu and returns the focus to the trigger.
 */
export const expectMenu = async (trigger: HTMLElement, getItems: () => HTMLElement[]) => {
	const user = userEvent.setup();
	await focus(trigger);

	await user.keyboard('{Enter}');
	const items = getItems();
	await expect(items.length).toBeGreaterThan(1);
	await expect(items).toContain(document.activeElement);

	const first = document.activeElement;
	await user.keyboard('{ArrowDown}');
	await expect(document.activeElement).not.toBe(first);
	await expect(items).toContain(document.activeElement);

	await user.keyboard('{Escape}');
	await expect(trigger).toHaveFocus();
	await expect(getItems()).toHaveLength(0);
};
