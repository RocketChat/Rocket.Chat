import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useFileUploadDropTarget } from './useFileUploadDropTarget';
import { createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';
import type { ChatAPI, ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { ChatContext } from '../../contexts/ChatContext';
import { RoomContext, RoomSubscriptionContext } from '../../contexts/RoomContext';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { readOnly: () => false } }));

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const subscription = createFakeSubscription({ rid: room._id });

// A chat whose composer registers only when the test says, so the test controls when it appears
const createChat = () => {
	const listeners = new Set<() => void>();
	const chat = {
		composer: undefined as ComposerAPI | undefined,
		flows: { uploadFiles: jest.fn() },
		subscribeToComposer: (onChange: () => void) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		setComposerAPI: (composer?: ComposerAPI) => {
			chat.composer = composer;
			listeners.forEach((onChange) => onChange());
		},
	};
	return chat;
};

const editingComposer = () => ({ editing: { get: () => true, subscribe: () => () => undefined } }) as unknown as ComposerAPI;

it('refuses files while a composer that registered after the body rendered edits a message', () => {
	const chat = createChat();
	const { result } = renderHook(() => useFileUploadDropTarget(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('FileUpload_Enabled', true)
			.withPermission('post-readonly')
			.wrap((children: ReactNode) => (
				<ChatContext.Provider value={chat as unknown as ChatAPI}>
					<RoomContext.Provider value={{ rid: room._id, room, subscribed: true }}>
						<RoomSubscriptionContext.Provider value={subscription}>{children}</RoomSubscriptionContext.Provider>
					</RoomContext.Provider>
				</ChatContext.Provider>
			))
			.build(),
	});
	expect(result.current[1].enabled).toBe(true);

	act(() => chat.setComposerAPI(editingComposer()));

	expect(result.current[1].enabled).toBe(false);
});
