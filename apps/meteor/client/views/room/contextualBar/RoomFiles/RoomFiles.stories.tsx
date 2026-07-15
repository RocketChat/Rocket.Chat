import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import RoomFiles from './RoomFiles';

export default {
	component: RoomFiles,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		type: 'all',
		text: '',
		loadMoreItems: action('loadMoreItems'),
		setText: action('setText'),
		setType: action('setType'),
	},
} satisfies Meta<typeof RoomFiles>;

const fakeItems = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	name: `File ${i}`,
	url: '#',
	uploadedAt: new Date(),
	user: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	_updatedAt: new Date(),
}));

export const Default = {
	args: {
		filesItems: fakeItems,
		total: fakeItems.length,
		isSuccess: true,
	},
};

export const Loading = {
	args: {
		isPending: true,
	},
};

export const Empty = {
	args: {
		isSuccess: true,
		filesItems: [],
		total: 0,
	},
};
