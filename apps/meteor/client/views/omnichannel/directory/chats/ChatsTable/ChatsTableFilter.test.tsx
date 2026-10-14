import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import type { ChatsContextValue } from '../../contexts/ChatsContext';

const { default: ChatsTableFilter } = proxyquire.noCallThru().load<typeof import('./ChatsTableFilter')>('./ChatsTableFilter', {
	'../../contexts/ChatsContext': {
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
			setFiltersQuery: fn<FunctionLike>(),
			resetFiltersQuery: fn<FunctionLike>(),
			displayFilters: {
				from: undefined,
				to: undefined,
				guest: undefined,
				servedBy: undefined,
				department: undefined,
				status: undefined,
				tags: undefined,
			},
			removeFilter: fn<FunctionLike>(),
			hasAppliedFilters: false,
			textInputRef: null,
		}),
	},
	'../../hooks/useOmnichannelDirectoryRouter': {
		useOmnichannelDirectoryRouter: () => ({
			navigate: fn<FunctionLike>(),
			getRouteName: fn<FunctionLike>(),
		}),
	},
});

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
