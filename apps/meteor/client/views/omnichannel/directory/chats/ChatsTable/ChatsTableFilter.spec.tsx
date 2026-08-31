import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatsTableFilter from './ChatsTableFilter';
import type { ChatsContextValue } from '../../contexts/ChatsContext';

jest.mock('../../contexts/ChatsContext', () => ({
	useChatsContext: (): ChatsContextValue => ({
		filtersQuery: {
			guest: '',
			servedBy: [],
			status: 'all',
			department: [],
			from: '',
			to: '',
			tags: [],
			units: [],
		},
		setFiltersQuery: jest.fn(),
		resetFiltersQuery: jest.fn(),
		displayFilters: {
			from: undefined,
			to: undefined,
			guest: undefined,
			servedBy: undefined,
			department: undefined,
			status: undefined,
			tags: undefined,
		},
		removeFilter: jest.fn(),
		hasAppliedFilters: false,
		textInputRef: null,
	}),
}));

jest.mock('../../hooks/useOmnichannelDirectoryRouter', () => ({
	useOmnichannelDirectoryRouter: () => ({
		navigate: jest.fn(),
		getRouteName: jest.fn(),
	}),
}));

describe('ChatsTableFilter', () => {
	it('should show the "More" kebab menu when user has "remove-closed-livechat-rooms" permission', async () => {
		render(<ChatsTableFilter />, {
			wrapper: mockAppRoot().withPermission('remove-closed-livechat-rooms').build(),
		});

		expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
	});

	it('should not show the "More" kebab menu when user lacks "remove-closed-livechat-rooms" permission', async () => {
		render(<ChatsTableFilter />, {
			wrapper: mockAppRoot().build(),
		});

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});

	it('should show "Delete all closed chats" option inside the menu when user has the permission', async () => {
		render(<ChatsTableFilter />, {
			wrapper: mockAppRoot().withPermission('remove-closed-livechat-rooms').build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'More' }));

		expect(await screen.findByRole('menuitem', { name: 'Delete_all_closed_chats' })).toBeInTheDocument();
	});
});
