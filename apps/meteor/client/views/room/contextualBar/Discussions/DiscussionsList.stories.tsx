import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta } from '@storybook/react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { action } from 'storybook/actions';

import DiscussionsList from './DiscussionsList';

const loadMoreItemsAction = action('loadMoreItems');
const loadMoreItems = (async (options) => {
	loadMoreItemsAction(options);
	return {} as Awaited<ReturnType<UseInfiniteQueryResult['fetchNextPage']>>;
}) satisfies UseInfiniteQueryResult['fetchNextPage'];

export default {
	component: DiscussionsList,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		text: '',
		loadMoreItems,
	},
} satisfies Meta<typeof DiscussionsList>;

const fakeDiscussions = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	msg: `Discussion ${i}`,
	ts: new Date('2024-01-01T00:00:00Z'),
	username: 'user.name',
	dcount: 5,
	dlm: new Date('2024-01-01T00:00:00Z'),
	drid: `drid-${i}`,
	rid: 'roomId',
	_updatedAt: new Date('2024-01-01T00:00:00Z'),
	u: {
		_id: 'user-id',
		username: 'user.name',
	},
}));

export const Default = {
	args: {
		isSuccess: true,
		discussions: fakeDiscussions,
		itemCount: fakeDiscussions.length,
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
		discussions: [],
		itemCount: 0,
	},
};
