import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarAISearch from './NavBarAISearch';

import '@testing-library/jest-dom';

jest.mock('tinykeys', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('./hooks/useNavBarAISearch', () => ({
	useNavBarAISearch: () => ({
		aiSearchActive: true,
		canSearchWithAIFromTopBar: true,
		aiSearchButtonTooltip: 'Search with AI',
		handleToggleAISearch: jest.fn(),
	}),
}));
jest.mock('./hooks/useAISearchRooms', () => ({
	useAISearchRooms: () => ({ items: [], isLoading: false }),
}));
jest.mock('./hooks/useAISearchItems', () => ({
	useAISearchItems: () => ({
		data: {
			intelligent: [{ _id: 'message-id', msgId: 'message-id', text: 'Deployment failed during startup' }],
			filterSuggestions: [{ key: 'before-2026-10-18', filterKey: 'before', title: 'Before today', value: '2026-10-18', icon: 'calendar' }],
			searchText: 'deployment',
			notConfigured: false,
		},
		isFetching: false,
		refetch: jest.fn(),
	}),
}));

describe('NavBarAISearchListbox', () => {
	beforeAll(() => {
		Element.prototype.scrollIntoView = jest.fn();
	});

	it('lets the arrow keys move from the filter suggestions into the results', async () => {
		const user = userEvent.setup();
		render(<NavBarAISearch />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Search_rooms_or_ask_AI: 'Search rooms or ask AI',
					Search_filter_suggestions: 'Filter suggestions',
				})
				.build(),
		});

		const input = screen.getByRole('combobox', { name: 'Search rooms or ask AI' });
		await user.click(input);
		expect(screen.getByRole('listbox', { name: 'Filter suggestions' })).toBeInTheDocument();

		await user.keyboard('{ArrowDown}');
		expect(input).toHaveAttribute('aria-activedescendant', 'search-filter-before-2026-10-18');

		await user.keyboard('{ArrowDown}');
		expect(input).toHaveAttribute('aria-activedescendant', 'search-intelligent-message-id');
	});
});
