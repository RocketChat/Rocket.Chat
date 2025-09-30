import { UserStatus } from '@rocket.chat/core-typings';
import type { Meta, StoryFn } from '@storybook/react';

import UsersTable from './UsersTable';

export default {
	component: UsersTable,
} satisfies Meta<typeof UsersTable>;

const mockedPagination = {
	current: 0,
	setCurrent: () => undefined,
	itemsPerPage: 25 as const,
	setItemsPerPage: () => undefined,
	itemsPerPageLabel: () => 'Items per page:',
	showingResultsLabel: () => 'Showing results 1 - 5 of 5',
};

const Template: StoryFn<typeof UsersTable> = (args) => <UsersTable {...args} paginationData={mockedPagination} />;

export const Default = Template.bind({});
Default.args = {
	users: [
		{
			_id: '1',
			username: 'example.user',
			name: 'Example User',
			emails: [{ address: 'example@rocket.chat', verified: true }],
			status: UserStatus.ONLINE,
			roles: ['user'],
			active: true,
			type: '',
		},
		{
			_id: '2',
			username: 'john.doe',
			name: 'John Doe',
			emails: [{ address: 'john@rocket.chat', verified: true }],
			status: UserStatus.OFFLINE,
			roles: ['admin', 'user'],
			active: true,
			type: '',
		},
		{
			_id: '3',
			username: 'sarah.smith',
			name: 'Sarah Smith',
			emails: [{ address: 'sarah@rocket.chat', verified: true }],
			status: UserStatus.AWAY,
			roles: ['user'],
			active: true,
			type: '',
		},
		{
			_id: '4',
			username: 'mike.wilson',
			name: 'Mike Wilson',
			emails: [{ address: 'mike@rocket.chat', verified: false }],
			status: UserStatus.BUSY,
			roles: ['user'],
			active: true,
			type: '',
		},
		{
			_id: '5',
			username: 'emma.davis',
			name: 'Emma Davis',
			emails: [{ address: 'emma@rocket.chat', verified: true }],
			status: UserStatus.ONLINE,
			roles: ['moderator', 'user'],
			active: true,
			type: '',
		},
	],
	total: 5,
	isLoading: false,
	isSuccess: true,
	tab: 'all',
};

export const Loading = Template.bind({});
Loading.args = {
	isLoading: true,
};

export const NoResults = Template.bind({});
NoResults.args = {
	users: [],
	total: 0,
	isLoading: false,
	isError: false,
	isSuccess: true,
};
