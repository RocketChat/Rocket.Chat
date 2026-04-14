import { Margins } from '@rocket.chat/fuselage';
import { PageContent } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import UsersInRoleTable from './UsersInRoleTable';
import { createMockedPagination } from '../../../../../../tests/mocks/data';

export default {
	component: UsersInRoleTable,
	decorators: [
		(fn) => (
			<PageContent mb='neg-x8'>
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

const paginationData = createMockedPagination(mockedUsers.length, 30);

const Template: StoryFn<typeof UsersInRoleTable> = (args) => <UsersInRoleTable {...args} />;

export const Default = Template.bind({});
Default.args = {
	total: 30,
	isLoading: false,
	isError: false,
	isSuccess: true,
	users: mockedUsers,
	onRemove: () => undefined,
	refetch: () => undefined,
	paginationData,
};

export const withLoading = Template.bind({});
withLoading.args = {
	total: 0,
	isLoading: true,
	isError: false,
	isSuccess: false,
	users: [],
	onRemove: () => undefined,
	refetch: () => undefined,
	paginationData,
};

export const withNoResults = Template.bind({});
withNoResults.args = {
	total: 0,
	isLoading: false,
	isError: false,
	isSuccess: true,
	users: [],
	onRemove: () => undefined,
	refetch: () => undefined,
	paginationData,
};

export const withError = Template.bind({});
withError.args = {
	total: 0,
	isLoading: false,
	isError: true,
	isSuccess: false,
	users: [],
	onRemove: () => undefined,
	refetch: () => undefined,
	paginationData,
};
