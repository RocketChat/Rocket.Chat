import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarAISearch from './NavBarAISearch';

import '@testing-library/jest-dom';

jest.mock('./NavBarAISearchListbox', () => () => <button type='button'>AI search toggle</button>);
jest.mock('tinykeys', () => ({ __esModule: true, default: () => jest.fn() }));
jest.mock('./hooks/useNavBarAISearch', () => ({
	useNavBarAISearch: () => ({
		aiSearchActive: false,
		canSearchWithAIFromTopBar: true,
		aiSearchButtonTooltip: 'Search with AI',
		handleToggleAISearch: jest.fn(),
	}),
}));

describe('NavBarAISearch', () => {
	it('clears the search text', async () => {
		const user = userEvent.setup();
		const wrapper = mockAppRoot()
			.withTranslations('en', 'core', {
				clear: 'Clear',
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

	it('lets Tab reach the dropdown controls and closes the dropdown once focus leaves the search', async () => {
		const user = userEvent.setup();
		const wrapper = mockAppRoot().withTranslations('en', 'core', { Search_rooms: 'Search rooms' }).build();

		render(
			<>
				<NavBarAISearch />
				<button type='button'>Outside</button>
			</>,
			{ wrapper },
		);

		await user.click(screen.getByRole('combobox', { name: 'Search rooms' }));
		await user.tab();
		expect(screen.getByRole('button', { name: 'AI search toggle' })).toHaveFocus();

		await user.tab();
		expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
		expect(screen.queryByRole('button', { name: 'AI search toggle' })).not.toBeInTheDocument();
	});

	it('closes the dropdown on Shift+Tab from the search input', async () => {
		const user = userEvent.setup();
		const wrapper = mockAppRoot().withTranslations('en', 'core', { Search_rooms: 'Search rooms' }).build();

		render(<NavBarAISearch />, { wrapper });

		await user.click(screen.getByRole('combobox', { name: 'Search rooms' }));
		expect(screen.getByRole('button', { name: 'AI search toggle' })).toBeInTheDocument();

		await user.tab({ shift: true });
		expect(screen.queryByRole('button', { name: 'AI search toggle' })).not.toBeInTheDocument();
	});
});
