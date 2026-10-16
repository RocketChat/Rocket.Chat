import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createElement } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';

type AxeOptions = Parameters<typeof axe>[1];

/**
 * Wraps a list in an app root where Virtuoso renders its rows, which it cannot measure in jsdom.
 */
export const listWrapper = (root = mockAppRoot()) =>
	root
		.wrap((children) => createElement(VirtuosoMockContext.Provider, { value: { viewportHeight: 1000, itemHeight: 64 } }, children))
		.build();

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
