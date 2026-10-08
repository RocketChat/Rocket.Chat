import { Badge, Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import RoomListItem from './RoomListItem';
import type { RoomListItemProps } from './RoomListItem';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

const room = createFakeSubscription({ t: 'c', name: 'general', fname: 'general' });

const meta: Meta<RoomListItemProps> = {
	component: RoomListItem,
	args: {
		room,
		title: 'general',
		href: '/channel/general',
		icon: <Icon name='hashtag' size='x20' />,
		iconLabel: 'Public channel',
		subtitle: 'Rafael: release notes are up',
		time: new Date(),
	},
	decorators: [
		mockAppRoot().buildStoryDecorator(),
		(story) => (
			<Box role='list' maxWidth='x300'>
				<div role='listitem'>{story()}</div>
			</Box>
		),
	],
};

export default meta;
type Story = StoryObj<RoomListItemProps>;

export const Condensed: Story = {
	args: { viewMode: 'condensed' },
};

export const Medium: Story = {
	args: { viewMode: 'medium' },
};

export const Extended: Story = {
	args: { viewMode: 'extended' },
};

export const Selected: Story = {
	args: { 'selected': true, 'aria-current': 'page' },
};

export const Unread: Story = {
	args: {
		'highlighted': true,
		'aria-label': '3 unread messages from general',
		'badges': (
			<Badge variant='primary' role='status' aria-label='3 unread messages'>
				3
			</Badge>
		),
	},
};

export const WithMenu: Story = {
	args: {
		menu: <IconButton mini icon='kebab' aria-label='Options' />,
	},
};

export const WithoutAvatar: Story = {
	args: { showAvatar: false },
};
