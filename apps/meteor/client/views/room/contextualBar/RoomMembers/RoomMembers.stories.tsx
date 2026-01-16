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
} satisfies Meta<typeof RoomMembers>;

const Template: StoryFn<typeof RoomMembers> = (args) => <RoomMembers {...args} />;

export const Default = Template.bind({});
Default.args = {
	loading: false,
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
	text: 'filter',
	type: 'online',
	setText: action('Lorem Ipsum'),
	setType: action('online'),
	total: 123,
	loadMoreItems: action('loadMoreItems'),
	rid: '!roomId',
	isTeam: false,
	isDirect: false,
	reload: action('reload'),
};

export const Loading = Template.bind({});
Loading.args = {
	loading: true,
	setText: action('setText'),
	setType: action('setType'),
	loadMoreItems: action('loadMoreItems'),
	reload: action('reload'),
};

export const WithABACRoom = Template.bind({});
WithABACRoom.args = {
	loading: false,
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
	text: 'filter',
	type: 'online',
	setText: action('Lorem Ipsum'),
	setType: action('online'),
	total: 123,
	loadMoreItems: action('loadMoreItems'),
	rid: '!roomId',
	isTeam: false,
	isDirect: false,
	reload: action('reload'),
	isABACRoom: true,
};

export const WithInvitedMember = Template.bind({});
WithInvitedMember.args = {
	loading: false,
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
	text: 'filter',
	type: 'online',
	setText: action('Lorem Ipsum'),
	setType: action('online'),
	total: 123,
	loadMoreItems: action('loadMoreItems'),
	rid: '!roomId',
	isTeam: false,
	isDirect: false,
	reload: action('reload'),
	isABACRoom: true,
};
