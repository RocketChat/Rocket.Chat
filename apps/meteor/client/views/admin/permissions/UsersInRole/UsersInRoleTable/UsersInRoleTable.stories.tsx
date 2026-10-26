import { Margins } from '@rocket.chat/fuselage';
import { PageContent } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';

import UsersInRoleTable from './UsersInRoleTable';

export default {
	component: UsersInRoleTable,
	decorators: [
		(fn) => (
			<PageContent marginBlock='neg-x8'>
				<Margins block={8}>{fn()}</Margins>
			</PageContent>
		),
	],
} satisfies Meta<typeof UsersInRoleTable>;

const generateMockedUsers = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		_id: `${i + 1}`,
		username: `user.${i + 1}`,
		name: `User ${i + 1}`,
		emails: [{ address: `user${i + 1}@example.com`, verified: i % 2 === 0 }],
		createdAt: new Date().toISOString(),
		_updatedAt: new Date().toISOString(),
		roles: [i < 5 ? 'admin' : 'user'],
		type: 'user',
		active: true,
	}));

const mockedUsers = generateMockedUsers(5);

const paginationProps = {
	count: 30,
	current: 0,
	itemsPerPage: 25 as const,
	itemsPerPageLabel: () => 'Items per page:',
	showingResultsLabel: () => `Showing results 1 - ${mockedUsers.length} of 30`,
	onSetCurrent: () => undefined,
	onSetItemsPerPage: () => undefined,
};

export const Default = {
	args: {
		isLoading: false,
		isError: false,
		isSuccess: true,
		users: mockedUsers,
		onRemove: () => undefined,
		refetch: () => undefined,
		paginationProps,
	},
};

export const withLoading = {
	args: {
		isLoading: true,
		isError: false,
		isSuccess: false,
		users: [],
		onRemove: () => undefined,
		refetch: () => undefined,
		paginationProps,
	},
};

export const withNoResults = {
	args: {
		isLoading: false,
		isError: false,
		isSuccess: true,
		users: [],
		onRemove: () => undefined,
		refetch: () => undefined,
		paginationProps,
	},
};

export const withError = {
	args: {
		isLoading: false,
		isError: true,
		isSuccess: false,
		users: [],
		onRemove: () => undefined,
		refetch: () => undefined,
		paginationProps,
	},
};
