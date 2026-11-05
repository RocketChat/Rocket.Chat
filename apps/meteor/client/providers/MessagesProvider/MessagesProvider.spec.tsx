import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useMessageDisplay, useMessageInteractions, useIsMessageSelected, useIsSelectingMessages } from '@rocket.chat/ui-message-list';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import MessagesProvider from './MessagesProvider';
import { messageSelectionFromStore } from './messageSelectionFromStore';
import { createFakeMessage, createFakeSubscription } from '../../../tests/mocks/data';
import { SelectedMessageStore } from '../../views/room/providers/SelectedMessageStore';

jest.mock('../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));

const appRoot = () =>
	mockAppRoot().withJohnDoe().withSetting('Message_Read_Receipt_Enabled', true).withUserPreference('displayAvatars', true);

describe('display', () => {
	it('shows messages as the settings and the viewer preferences say', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.withUserPreference('hideRoles', true)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current).toMatchObject({
			showRoles: false,
			showAvatars: true,
			readReceipts: { enabled: true, storeUsers: false },
			allowsInteraction: true,
		});
	});

	it('turns interaction off for read-only places', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider allowsInteraction={false}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.allowsInteraction).toBe(false);
	});

	it('tells whether the viewer starred a message', () => {
		const { result } = renderHook(() => useMessageDisplay(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider subscription={createFakeSubscription({ t: 'c' })}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.isStarred(createFakeMessage({ starred: [{ _id: 'john.doe' }] }))).toBe(true);
		expect(result.current.isStarred(createFakeMessage({ starred: [{ _id: 'someone-else' }] }))).toBe(false);
	});
});

describe('interactions', () => {
	it('reacts to a message through the REST API', async () => {
		const react = jest.fn().mockResolvedValue({ success: true });
		const message = createFakeMessage({ _id: 'message-id' });

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.withEndpoint('POST', '/v1/chat.react', react)
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		result.current.toggleReaction(message, ':tada:');

		await waitFor(() => expect(react).toHaveBeenCalledWith({ messageId: 'message-id', reaction: ':tada:' }));
	});

	it('tells whether the viewer reacted with an emoji', () => {
		const message = createFakeMessage({ reactions: { ':tada:': { usernames: ['john.doe'] } } });

		const { result } = renderHook(() => useMessageInteractions(), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current.hasReacted(message, ':tada:')).toBe(true);
		expect(result.current.hasReacted(message, ':eyes:')).toBe(false);
	});
});

describe('selection', () => {
	it("reads and toggles the room's selection", () => {
		const store = new SelectedMessageStore();
		const selection = messageSelectionFromStore(store);

		const { result } = renderHook(() => ({ isSelecting: useIsSelectingMessages(), isSelected: useIsMessageSelected('message-id') }), {
			wrapper: appRoot()
				.wrap((children: ReactNode) => <MessagesProvider selection={selection}>{children}</MessagesProvider>)
				.build(),
		});

		expect(result.current).toEqual({ isSelecting: false, isSelected: false });

		act(() => {
			store.setIsSelecting(true);
			store.toggle('message-id');
		});

		expect(result.current).toEqual({ isSelecting: true, isSelected: true });
	});
});
