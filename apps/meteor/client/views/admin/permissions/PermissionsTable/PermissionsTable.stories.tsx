import type { IPermission, IRole } from '@rocket.chat/core-typings';
import { Margins } from '@rocket.chat/fuselage';
import { PageContent } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import PermissionsTable from './PermissionsTable';
import { createMockedPagination } from '../../../../../tests/mocks/data';

export default {
	component: PermissionsTable,
	decorators: [
		(fn) => (
			<PageContent mb='neg-x8'>
				<Margins block={8}>{fn()}</Margins>
			</PageContent>
		),
	],
} satisfies Meta<typeof PermissionsTable>;

const roles: IRole[] = [
	{
		description: 'Owner of the workspace',
		name: 'owner',
		protected: true,
		scope: 'Users',
		_id: 'owner',
	},
	{
		description: 'Administrator',
		name: 'admin',
		protected: true,
		scope: 'Users',
		_id: 'admin',
	},
	{
		description: 'Leader',
		name: 'leader',
		protected: false,
		scope: 'Subscriptions',
		_id: 'leader',
	},
	{
		description: 'Moderator',
		name: 'moderator',
		protected: false,
		scope: 'Subscriptions',
		_id: 'moderator',
	},
	{
		description: 'User',
		name: 'user',
		protected: true,
		scope: 'Users',
		_id: 'user',
	},
	{
		description: 'Guest',
		name: 'guest',
		protected: true,
		scope: 'Users',
		_id: 'guest',
	},
	{
		description: 'Bot',
		name: 'bot',
		protected: true,
		scope: 'Users',
		_id: 'bot',
	},
	{
		description: 'App',
		name: 'app',
		protected: true,
		scope: 'Users',
		_id: 'app',
	},
];

const permissions: IPermission[] = [
	{
		_id: '0',
		_updatedAt: new Date('2023-01-01'),
		roles: ['admin'],
	},
	{
		_id: '1',
		_updatedAt: new Date('2023-01-01'),
		roles: ['user'],
	},
	{
		_id: '2',
		_updatedAt: new Date('2023-01-01'),
		roles: ['user'],
	},
	{
		_id: '3',
		_updatedAt: new Date('2023-01-01'),
		roles: ['user'],
	},
];

const paginationData = createMockedPagination(permissions.length, 10);

const Template: StoryFn<typeof PermissionsTable> = (args) => <PermissionsTable {...args} />;

export const Default = Template.bind({});
Default.args = {
	total: 10,
	permissions,
	roleList: roles,
	setFilter: () => undefined,
	paginationData,
};

export const Empty = Template.bind({});
Empty.args = {
	total: 0,
	permissions: [],
	roleList: [],
	setFilter: () => undefined,
	paginationData,
};
