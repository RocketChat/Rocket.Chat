import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { action } from 'storybook/actions';

import RoomFiles from './RoomFiles';

const loadMoreItemsAction = action('loadMoreItems');
const loadMoreItems = (async (options) => {
	loadMoreItemsAction(options);
	return {} as Awaited<ReturnType<UseInfiniteQueryResult['fetchNextPage']>>;
}) satisfies UseInfiniteQueryResult['fetchNextPage'];

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
		loadMoreItems,
		setText: action('setText'),
		setType: action('setType'),
	},
} satisfies Meta<typeof RoomFiles>;

const uploadedAt = new Date('2024-01-01T00:00:00.000Z');

const fakeItems = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	name: `File ${i}`,
	url: '#',
	uploadedAt,
	user: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	_updatedAt: uploadedAt,
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
