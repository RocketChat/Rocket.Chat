import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import type { ContextType } from 'react';
import { createElement } from 'react';

import { useReplyInDMAction } from './useReplyInDMAction';
import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { Rooms, Subscriptions } from '../../../stores';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		openRouteLink: jest.fn(),
	},
}));

const mockedOpenRouteLink = jest.mocked(roomCoordinator.openRouteLink);

const currentUser = createFakeUser({
	_id: 'current-user-id',
	username: 'currentuser',
});

const messageAuthor = {
	_id: 'author-user-id',
	username: 'authoruser',
	name: 'Author User',
};

const message = createFakeMessage({
	_id: 'reply-message-id',
	u: messageAuthor,
});

const room = createFakeRoom({
	_id: 'channel-id',
	t: 'c',
	name: 'general',
});

const subscription = createFakeSubscription({
	rid: 'channel-id',
	t: 'c',
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('useReplyInDMAction', () => {
	it('should not carry over the msg search parameter when opening a direct message', () => {
		const getSearchParameters = jest.fn().mockReturnValue({
			msg: 'stale-message-id',
			layout: 'embedded',
		});

		const { result } = renderHook(() => useReplyInDMAction(message, { room, subscription }), {
			wrapper: mockAppRoot().withUser(currentUser).withPermission('create-d').withRouter({ getSearchParameters }).build(),
		});

		expect(result.current).not.toBeNull();

		result.current?.action({ stopPropagation: jest.fn() } as unknown as UIEvent);

		expect(getSearchParameters).toHaveBeenCalled();
		expect(mockedOpenRouteLink).toHaveBeenCalledWith(
			'd',
			{ name: messageAuthor.username },
			{
				layout: 'embedded',
				reply: 'reply-message-id',
			},
		);

		const searchParams = mockedOpenRouteLink.mock.calls[0]?.[2];
		expect(searchParams).not.toHaveProperty('msg');
	});

	describe('availability', () => {
		const renderAction = (
			currentMessage = message,
			context: Partial<Parameters<typeof useReplyInDMAction>[1]> = {},
			wrapper = mockAppRoot().withUser(currentUser).withPermission('create-d').build(),
		) => renderHook(() => useReplyInDMAction(currentMessage, { room, subscription, ...context }), { wrapper }).result.current;

		const withoutCreatePermission = () => mockAppRoot().withUser(currentUser).build();

		const directRoomId = [currentUser._id, messageAuthor._id].sort().join('');

		afterEach(() => {
			Rooms.state.replaceAll([]);
			Subscriptions.state.replaceAll([]);
		});

		it('should return an enabled action for a plain message', () => {
			expect(renderAction()).toMatchObject({ id: 'reply-directly', disabled: false });
		});

		it('should return null in a livechat room', () => {
			expect(renderAction(message, { room: createFakeRoom({ t: 'l' }) })).toBeNull();
		});

		it('should return null for a user who is not in the room', () => {
			expect(renderAction(message, { subscription: undefined })).toBeNull();
		});

		it('should return null in the embedded layout', () => {
			const wrapper = mockAppRoot()
				.withUser(currentUser)
				.withPermission('create-d')
				.wrap((children) =>
					createElement(LayoutContext.Provider, { value: { isEmbedded: true } as ContextType<typeof LayoutContext> }, children),
				)
				.build();

			expect(renderAction(message, {}, wrapper)).toBeNull();
		});

		it('should return null without the permission to create a direct message and with no existing one', () => {
			expect(renderAction(message, {}, withoutCreatePermission())).toBeNull();
		});

		it('should offer the action without the permission when the direct message exists', () => {
			Rooms.state.store(createFakeRoom({ _id: directRoomId, t: 'd' }));
			Subscriptions.state.store(
				createFakeSubscription({ rid: directRoomId, u: { _id: currentUser._id, username: 'currentuser' } }) as never,
			);

			expect(renderAction(message, {}, withoutCreatePermission())).not.toBeNull();
		});

		it('should accept a subscription to another room as proof of access to the direct message', () => {
			Rooms.state.store(createFakeRoom({ _id: directRoomId, t: 'd' }));
			Subscriptions.state.store(
				createFakeSubscription({ rid: 'other-room', u: { _id: currentUser._id, username: 'currentuser' } }) as never,
			);

			expect(renderAction(message, {}, withoutCreatePermission())).not.toBeNull();
		});

		it('should offer the action on a message of the user without the permission', () => {
			const ownMessage = createFakeMessage({ u: { _id: currentUser._id, username: 'currentuser' } });

			expect(renderAction(ownMessage, {}, withoutCreatePermission())).not.toBeNull();
		});

		it('should disable the action on encrypted content and explain why', () => {
			const encrypted = createFakeMessage({ u: messageAuthor, t: 'e2e', e2e: 'done' } as never);

			expect(renderAction(encrypted)).toMatchObject({ disabled: true, tooltip: 'Action_not_available_encrypted_content' });
		});

		it('should disable the action in an ABAC room and explain why', () => {
			const abacRoom = createFakeRoom({ t: 'p', abacAttributes: [] });

			expect(renderAction(message, { room: abacRoom })).toMatchObject({ disabled: true, tooltip: 'Not_available_for_ABAC_enabled_rooms' });
		});
	});

	it('should return null when already in a direct message room', () => {
		const dmRoom = createFakeRoom({ t: 'd' });
		const dmSubscription = createFakeSubscription({ t: 'd' });

		const { result } = renderHook(() => useReplyInDMAction(message, { room: dmRoom, subscription: dmSubscription }), {
			wrapper: mockAppRoot().withUser(currentUser).withPermission('create-d').build(),
		});

		expect(result.current).toBeNull();
	});
});
