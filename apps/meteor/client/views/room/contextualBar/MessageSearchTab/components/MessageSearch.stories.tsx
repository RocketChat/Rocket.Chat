import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';

import MessageSearch from './MessageSearch';
import { createFakeMessageWithMd, createFakeRoom, createFakeSubscription } from '../../../../../../tests/mocks/data';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';

const room = createFakeRoom({ _id: 'room-id', t: 'c', name: 'general', fname: 'General' });
const subscription = createFakeSubscription({
	rid: room._id,
	tunread: ['message-2'],
	tunreadUser: ['message-2'],
	tunreadGroup: [],
});

const fetchNextPageAction = action('fetchNextPage');
const fetchNextPage = (async (options) => {
	fetchNextPageAction(options);
	return {} as Awaited<ReturnType<UseInfiniteQueryResult['fetchNextPage']>>;
}) satisfies UseInfiniteQueryResult['fetchNextPage'];

const formatDate = (date: Date | string | number): string => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date));

const createMessage = (overrides: Partial<IMessage>): MessageSearchItem =>
	createFakeMessageWithMd({
		rid: room._id,
		u: {
			_id: 'user-id',
			username: 'ana.silva',
			name: 'Ana Silva',
		},
		...overrides,
	}) as MessageSearchItem;

const messages = [
	createMessage({
		_id: 'message-1',
		msg: 'Can you share the deployment checklist?',
		ts: new Date('2026-06-09T14:15:00.000Z'),
	}),
	createMessage({
		_id: 'message-2',
		msg: 'The checklist is attached to the release room topic.',
		ts: new Date('2026-06-09T14:18:00.000Z'),
		u: {
			_id: 'user-id-2',
			username: 'sam.chen',
			name: 'Sam Chen',
		},
	}),
	createMessage({
		_id: 'message-3',
		msg: 'I found the rollback notes as well.',
		ts: new Date('2026-06-09T14:22:00.000Z'),
	}),
];

const systemMessages = [
	createMessage({
		_id: 'system-message-1',
		msg: 'Sam Chen joined the room',
		t: 'uj',
		ts: new Date('2026-06-09T09:00:00.000Z'),
	}),
	createMessage({
		_id: 'system-message-2',
		msg: 'Room topic changed to Release coordination',
		t: 'room_changed_topic',
		ts: new Date('2026-06-09T09:05:00.000Z'),
	}),
];

const multipleDateMessages = [
	createMessage({
		_id: 'date-message-1',
		msg: 'Initial search result from Monday.',
		ts: new Date('2026-06-08T10:00:00.000Z'),
	}),
	createMessage({
		_id: 'date-message-2',
		msg: 'Follow-up result from Tuesday.',
		ts: new Date('2026-06-09T10:00:00.000Z'),
	}),
	createMessage({
		_id: 'date-message-3',
		msg: 'Final result from Wednesday.',
		ts: new Date('2026-06-10T10:00:00.000Z'),
	}),
];

const meta = {
	component: MessageSearch,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		mockAppRoot().withJohnDoe().withRoom(room).withSubscription(subscription).buildStoryDecorator(),
		(fn) => (
			<Contextualbar height='100vh'>
				<Box w='full' h='full' overflow='hidden'>
					{fn()}
				</Box>
			</Contextualbar>
		),
	],
	args: {
		itemCount: 0,
		isPending: false,
		isSuccess: true,
		fetchNextPage,
		subscription,
		showUserAvatar: true,
		formatDate,
		searchText: 'release',
		noResultsTitle: 'No results found',
	},
} satisfies Meta<typeof MessageSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		items: [],
		itemCount: 0,
	},
};

export const Messages: Story = {
	args: {
		items: messages,
		itemCount: messages.length,
	},
};

export const SystemMessages: Story = {
	args: {
		items: systemMessages,
		itemCount: systemMessages.length,
	},
};

export const MultipleDateGroups: Story = {
	args: {
		items: multipleDateMessages,
		itemCount: multipleDateMessages.length,
	},
};
