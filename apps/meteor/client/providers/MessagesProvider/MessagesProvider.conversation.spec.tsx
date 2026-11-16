import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useMessageRelatedData } from '@rocket.chat/ui-message-list';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessagesProvider from './MessagesProvider';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../tests/mocks/data';
import type { ChatAPI } from '../../lib/chats/ChatAPI';
import { Rooms, Subscriptions } from '../../stores';
import { ChatContext } from '../../views/room/contexts/ChatContext';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));

const openRoom = createFakeRoom({ _id: 'open-room', t: 'c' });
const otherRoom = createFakeRoom({ _id: 'other-room', t: 'p' });
const otherSubscription = createFakeSubscription({ rid: 'other-room' });
const chat = {
	data: {
		findRoom: async () => openRoom,
		findSubscription: async () => createFakeSubscription({ rid: 'open-room' }),
	},
} as unknown as ChatAPI;

afterEach(() => {
	Rooms.state.replaceAll([]);
	Subscriptions.state.replaceAll([]);
});

it("answers the message's own room and subscription for a message of another room than the open one (message-variants R49)", async () => {
	Rooms.state.store(otherRoom);
	Subscriptions.state.store(otherSubscription);
	const message = createFakeMessage({ rid: 'other-room' });

	const { result } = renderHook(() => useMessageRelatedData().useConversation(message, { enabled: true }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.wrap((children: ReactNode) => (
				<ChatContext.Provider value={chat}>
					<MessagesProvider>{children}</MessagesProvider>
				</ChatContext.Provider>
			))
			.build(),
	});

	await waitFor(() => expect(result.current.data?.room?._id).toBe('other-room'));
	expect(result.current.data?.subscription?.rid).toBe('other-room');
});
