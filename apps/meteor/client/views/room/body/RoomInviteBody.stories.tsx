import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import RoomInvite from './RoomInviteBody';

const meta = {
	component: RoomInvite,
	parameters: {
		layout: 'centered',
	},
	args: {
		onAccept: action('onAccept'),
		onReject: action('onReject'),
	},
} satisfies Meta<typeof RoomInvite>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		inviter: {
			username: 'rocket.cat',
			name: 'Rocket Cat',
			_id: 'rocket.cat',
		},
	},
};

export const WithInfoLink: Story = {
	args: {
		infoLink: {
			label: 'Learn more',
			href: 'https://rocket.chat',
		},
		inviter: {
			username: 'rocket.cat',
			name: 'Rocket Cat',
			_id: 'rocket.cat',
		},
	},
};

export const Loading: Story = {
	args: {
		isLoading: true,
		inviter: {
			username: 'rocket.cat',
			name: 'Rocket Cat',
			_id: 'rocket.cat',
		},
	},
};
