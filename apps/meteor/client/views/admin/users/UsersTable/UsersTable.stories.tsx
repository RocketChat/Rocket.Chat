import { UserStatus } from '@rocket.chat/core-typings';
import type { Meta } from '@storybook/react';

import UsersTable from './UsersTable';
import { createMockedPagination } from '../../../../../tests/mocks/data';

export default {
	component: UsersTable,
} satisfies Meta<typeof UsersTable>;

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

const { setCurrent: onSetCurrent, setItemsPerPage: onSetItemsPerPage, ...pagination } = createMockedPagination(mockedUsers.length, 5);
const paginationProps = { ...pagination, onSetCurrent, onSetItemsPerPage, count: 5 };

export const Default = {
	args: {
		users: mockedUsers,
		isLoading: false,
		isSuccess: true,
		tab: 'all',
		paginationProps,
	},
};

export const Loading = {
	args: {
		isLoading: true,
		paginationProps,
	},
};

export const NoResults = {
	args: {
		users: [],
		isLoading: false,
		isError: false,
		isSuccess: true,
		paginationProps,
	},
};
