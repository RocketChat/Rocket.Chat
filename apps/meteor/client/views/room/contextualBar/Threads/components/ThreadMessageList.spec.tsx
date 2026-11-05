import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { MessageListProps } from '@rocket.chat/ui-message-list';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import ThreadMessageList from './ThreadMessageList';
import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const mockListProps: { current?: MessageListProps<IMessage> } = {};

jest.mock('@rocket.chat/ui-message-list', () => ({
	...jest.requireActual('@rocket.chat/ui-message-list'),
	MessageList: (props: MessageListProps<IMessage>) => {
		mockListProps.current = props;
		return null;
	},
}));

jest.mock('../../../../../providers/MessagesProvider', () => ({
	MessagesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('../hooks/useThreadMessagesQuery', () => ({ useThreadMessagesQuery: jest.fn() }));

jest.mock('../../../contexts/RoomContext', () => ({
	useRoom: () => room,
	useRoomSubscription: () => undefined,
}));

jest.mock('../../../hooks/useFirstUnreadMessageId', () => ({ useFirstUnreadMessageId: () => undefined }));

const mainMessage = createFakeMessage<IThreadMainMessage>({ _id: 'thread-id', rid: room._id, msg: 'main message', tcount: 2 });
const replies = [1, 2].map((index) => createFakeMessage<IThreadMessage>({ _id: `reply-${index}`, rid: room._id, tmid: 'thread-id' }));

const mockThreadMessages = (overrides: Record<string, unknown> = {}) =>
	jest.mocked(useThreadMessagesQuery).mockReturnValue({
		data: { messages: replies },
		isLoading: false,
		fetchNextPage: jest.fn(),
		hasNextPage: false,
		isFetchingNextPage: false,
		fetchPreviousPage: jest.fn(),
		hasPreviousPage: false,
		isFetchingPreviousPage: false,
		loadMessageAround: jest.fn().mockResolvedValue(undefined),
		jumpToRecent: jest.fn(),
		...overrides,
	} as any);

const renderThreadMessageList = (search: Record<string, string> = {}) =>
	render(<ThreadMessageList mainMessage={mainMessage} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withRouter({ getSearchParameters: () => search })
			.build(),
	});

it('lists the main message first once no older reply remains to load', () => {
	mockThreadMessages();

	renderThreadMessageList();

	expect(mockListProps.current?.messages.map(({ _id }) => _id)).toEqual(['thread-id', 'reply-1', 'reply-2']);
	expect(mockListProps.current?.groupsThreadReplies).toBe(false);
});

it('lists only the replies while older replies remain to load', () => {
	mockThreadMessages({ hasPreviousPage: true });

	renderThreadMessageList();

	expect(mockListProps.current?.messages.map(({ _id }) => _id)).toEqual(['reply-1', 'reply-2']);
	expect(mockListProps.current?.hasOlderMessages).toBe(true);
});

it('loads the replies around a linked reply that is not loaded', () => {
	const loadMessageAround = jest.fn().mockResolvedValue(undefined);
	mockThreadMessages({ loadMessageAround });

	renderThreadMessageList({ msg: 'reply-9' });

	expect(mockListProps.current?.targetMessageId).toBe('reply-9');
	expect(loadMessageAround).toHaveBeenCalledWith('reply-9');
});

it('pages with the thread query', () => {
	const fetchPreviousPage = jest.fn();
	const fetchNextPage = jest.fn();
	const jumpToRecent = jest.fn();
	mockThreadMessages({ fetchPreviousPage, fetchNextPage, jumpToRecent });

	renderThreadMessageList();
	mockListProps.current?.onLoadOlderMessages?.();
	mockListProps.current?.onLoadNewerMessages?.();
	mockListProps.current?.onJumpToLatest?.();

	expect(fetchPreviousPage).toHaveBeenCalled();
	expect(fetchNextPage).toHaveBeenCalled();
	expect(jumpToRecent).toHaveBeenCalled();
});
