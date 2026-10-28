import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createElement } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';

/**
 * Wraps a list in an app root where Virtuoso renders its rows, which it cannot measure in jsdom.
 */
export const listWrapper = (root = mockAppRoot()) =>
	root
		.wrap((children) => createElement(VirtuosoMockContext.Provider, { value: { viewportHeight: 1000, itemHeight: 64 } }, children))
		.build();

type AxeOptions = Parameters<typeof axe>[1];

const rowOf = (element: Element | null, list: HTMLElement) => {
	const row = element?.closest('[data-index], [role="listitem"], li');
	return row && list.contains(row) ? row : null;
};

/**
 * Asserts the semantics every list of rows follows (see docs/frontend/list-semantics.md): a named list that owns its rows,
 * and no axe violations, which covers unnamed controls and controls nested inside other controls.
 */
export const expectListSemantics = async (name: string | RegExp, axeOptions?: AxeOptions) => {
	const list = screen.getByRole('list', { name });

	expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
	expect(await axe(list, axeOptions)).toHaveNoViolations();

	return list;
};

/**
 * Asserts the keyboard model of a list of rows (see docs/frontend/list-keyboard-navigation.md): Down and Up move between
 * rows, Tab walks the focused row, then leaves the list without entering the next row, and Shift+Tab from a row leaves it
 * without entering the previous one. Needs at least two rows.
 */
export const expectListKeyboard = async (
	list: HTMLElement,
	firstTarget = list.querySelector<HTMLElement>('.rcx-item__link') ?? undefined,
) => {
	if (!firstTarget) throw new Error('The list has no row to focus');
	const user = userEvent.setup();
	act(() => firstTarget.focus());

	await user.keyboard('{ArrowDown}');
	const secondTarget = document.activeElement;
	expect(list).toContainElement(secondTarget as HTMLElement);
	expect(rowOf(secondTarget, list)).not.toBe(rowOf(firstTarget, list));

	await user.keyboard('{ArrowUp}');
	expect(document.activeElement).toBe(firstTarget);

	// The first row has a next one, so Tab entering it would show
	const row = rowOf(firstTarget, list);
	for (let presses = 0; presses < 20; presses++) {
		await user.tab();
		if (!list.contains(document.activeElement)) {
			break;
		}
		expect(rowOf(document.activeElement, list)).toBe(row);
	}
	expect(list).not.toContainElement(document.activeElement as HTMLElement);

	// Shift+Tab from the row's focus target leaves the list too, rather than entering the previous row
	act(() => secondTarget instanceof HTMLElement && secondTarget.focus());
	await user.tab({ shift: true });
	expect(list).not.toContainElement(document.activeElement as HTMLElement);
};
