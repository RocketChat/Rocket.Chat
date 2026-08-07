import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarAISearch from './NavBarAISearch';

import '@testing-library/jest-dom';

jest.mock('./NavBarAISearchListbox', () => () => null);
jest.mock('./NavBarSearchListbox', () => () => null);
jest.mock('tinykeys', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('./hooks/useNavBarAISearch', () => ({
	useNavBarAISearch: () => ({
		aiSearchActive: false,
		canSearchWithAIFromTopBar: true,
		appliedFilterChips: [],
		aiSearchButtonTooltip: 'Search with AI',
		handleRemoveFilter: jest.fn(),
		handleToggleAISearch: jest.fn(),
	}),
}));

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
