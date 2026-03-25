import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import BannedUsers from './BannedUsers';

const meta = {
	component: BannedUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		useRealName: false,
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof BannedUsers>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		loading: false,
		bannedUsers: [
			{
				_id: 'user1',
				username: 'john.doe',
				name: 'John Doe',
			},
			{
				_id: 'user2',
				username: '@jane.smith:matrix.org',
				name: 'Jane Smith',
			},
			{
				_id: 'user3',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			},
		],
		useRealName: false,
		onClickClose: action('onClickClose'),
		onClickUnban: action('onClickUnban'),
		onLoadMore: action('onLoadMore'),
	},
};

export const Loading: Story = {
	args: {
		loading: true,
		bannedUsers: [],
		onClickClose: action('onClickClose'),
		onClickUnban: action('onClickUnban'),
		onLoadMore: action('onLoadMore'),
	},
};

export const WithRealNames: Story = {
	args: {
		...Default.args,
		useRealName: true,
	},
};

export const Empty: Story = {
	args: {
		loading: false,
		bannedUsers: [],
		onClickClose: action('onClickClose'),
		onClickUnban: action('onClickUnban'),
		onLoadMore: action('onLoadMore'),
	},
};

export const WithError: Story = {
	args: {
		loading: false,
		error: new Error('Failed to load banned users'),
		bannedUsers: [],
		onClickClose: action('onClickClose'),
		onClickUnban: action('onClickUnban'),
		onLoadMore: action('onLoadMore'),
	},
};
