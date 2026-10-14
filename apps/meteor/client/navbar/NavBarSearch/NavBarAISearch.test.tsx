import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

const { default: NavBarAISearch } = proxyquire.noCallThru().load<typeof import('./NavBarAISearch')>('./NavBarAISearch', {
	'tinykeys': {
		__esModule: true,
		default: () => fn<FunctionLike>(),
	},
	'./NavBarAISearchListbox': (
		() => () =>
			null
	)(),
	'./NavBarSearchListbox': (
		() => () =>
			null
	)(),
	'./hooks/useNavBarAISearch': {
		useNavBarAISearch: () => ({
			aiSearchActive: false,
			canSearchWithAIFromTopBar: true,
			appliedFilterChips: [],
			aiSearchButtonTooltip: 'Search with AI',
			handleRemoveFilter: fn<FunctionLike>(),
			handleToggleAISearch: fn<FunctionLike>(),
		}),
	},
});

describe('NavBarAISearch', () => {
	it('clears the search text', async () => {
		const user = userEvent.setup();
		const wrapper = mockAppRoot()
			.withTranslations('en', 'core', {
				Clear: 'Clear',
				Search_rooms: 'Search rooms',
			})
			.build();

		render(<NavBarAISearch />, { wrapper });

		const searchInput = screen.getByRole('combobox', { name: 'Search rooms' });
		await user.type(searchInput, 'deployment errors');
		expect(searchInput).toHaveValue('deployment errors');

		await user.click(screen.getByRole('button', { name: 'Clear' }));

		expect(searchInput).toHaveValue('');
		expect(searchInput).toHaveFocus();
	});
});
