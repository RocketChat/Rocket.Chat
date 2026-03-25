import { UserStatus } from '@rocket.chat/core-typings';
import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import RoomMembers from './RoomMembers';

export default {
	component: RoomMembers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		text: 'filter',
		type: 'online',
		setText: action('setText'),
		setType: action('setType'),
		loadMoreItems: action('loadMoreItems'),
		reload: action('reload'),
		rid: 'GENERAL',
		isTeam: false,
		isDirect: false,
	},
} satisfies Meta<typeof RoomMembers>;

const Template: StoryFn<typeof RoomMembers> = (args) => <RoomMembers {...args} />;

export const Default = Template.bind({});
Default.args = {
	isSuccess: true,
	members: [
		{
			_id: 'rocket.cat',
			username: 'rocket.cat',
			status: UserStatus.ONLINE,
			name: 'Rocket.Cat',
			roles: ['user'],
			subscription: {
				_id: 'sub-rocket.cat',
				ts: '2025-01-01T00:00:00Z',
			},
		},
	],
};

export const Loading = Template.bind({});
Loading.args = {
	isPending: true,
};

export const WithABACRoom = Template.bind({});
WithABACRoom.args = {
	isSuccess: true,
	members: [
		{
			_id: 'rocket.cat',
			username: 'rocket.cat',
			status: UserStatus.ONLINE,
			name: 'Rocket.Cat',
			roles: ['user'],
			subscription: {
				_id: 'sub-rocket.cat',
				ts: '2025-01-01T00:00:00Z',
			},
		},
	],
	isABACRoom: true,
};

export const WithInvitedMember = Template.bind({});
WithInvitedMember.args = {
	isSuccess: true,
	members: [
		{
			_id: 'rocket.cat',
			username: 'rocket.cat',
			roles: ['user'],
			subscription: {
				_id: 'sub-rocket.cat',
				status: 'INVITED',
				ts: '2025-01-01T00:00:00Z',
			},
			name: 'Rocket.Cat',
		},
	],
};

export const Empty = Template.bind({});
Empty.args = {
	isSuccess: true,
	members: [],
	total: 0,
};
