import { UserStatus } from '@rocket.chat/core-typings';
import type { Meta, StoryFn } from '@storybook/react';

import UsersTable from './UsersTable';
import { createMockedPagination } from '../../../../../tests/mocks/data';

export default {
	component: UsersTable,
} satisfies Meta<typeof UsersTable>;

const Template: StoryFn<typeof UsersTable> = (args) => <UsersTable {...args} />;

const mockedUsers = [
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
];

const paginationData = createMockedPagination(mockedUsers.length, 5);

export const Default = Template.bind({});
Default.args = {
	users: mockedUsers,
	total: 5,
	isLoading: false,
	isSuccess: true,
	tab: 'all',
	paginationData,
};

export const Loading = Template.bind({});
Loading.args = {
	isLoading: true,
	paginationData,
};

export const NoResults = Template.bind({});
NoResults.args = {
	users: [],
	total: 0,
	isLoading: false,
	isError: false,
	isSuccess: true,
	paginationData,
};
