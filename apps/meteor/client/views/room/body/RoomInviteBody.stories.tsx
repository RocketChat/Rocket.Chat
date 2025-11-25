import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

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
		inviterUsername: 'rocket.cat',
	},
};

export const Loading: Story = {
	args: {
		inviterUsername: 'rocket.cat',
		isLoading: true,
	},
};
