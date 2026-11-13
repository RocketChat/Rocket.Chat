import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ModalContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useNewDiscussionMessageAction } from './useNewDiscussionMessageAction';
import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { isLivechatRoom: (type: string) => type === 'l' },
}));

const user = createFakeUser({ _id: 'current-user-id' });
const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const subscription = createFakeSubscription();
const otherUserMessage = createFakeMessage({ u: { _id: 'other-user-id', username: 'other' } });
const ownMessage = createFakeMessage({ u: { _id: user._id, username: 'me' } });
const setModal = jest.fn();

const wrapperWith = ({
	setting = true,
	permissions = ['start-discussion', 'start-discussion-other-user'],
	loggedIn = true,
	parentRoomMember = true,
} = {}) => {
	const root = mockAppRoot()
		.withSetting('Discussion_enabled', setting)
		.wrap((children) => (
			<ModalContext.Provider value={{ modal: { setModal }, currentModal: { component: null } }}>{children}</ModalContext.Provider>
		));
	permissions.forEach((permission) => root.withPermission(permission));
	if (loggedIn) {
		root.withUser(user);
	}
	if (parentRoomMember) {
		root.withSubscription(subscription);
	}
	return root.build();
};

const renderAction = (
	message = otherUserMessage,
	context: Partial<Parameters<typeof useNewDiscussionMessageAction>[1]> = {},
	wrapper = wrapperWith(),
) => renderHook(() => useNewDiscussionMessageAction(message, { room, subscription, ...context }), { wrapper }).result.current;

const openForm = async (...args: Parameters<typeof renderAction>) => {
	await renderAction(...args)?.action(undefined as never);
	return setModal.mock.calls[0][0].props;
};

describe('useNewDiscussionMessageAction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should open the form with the room and the message as parents', async () => {
		const message = createFakeMessage({ _id: 'message-id', msg: 'a'.repeat(200), u: otherUserMessage.u });

		const props = await openForm(message, { room: createFakeRoom({ _id: 'room-id', t: 'c', encrypted: true }) });

		expect(props).toMatchObject({
			defaultParentRoom: 'room-id',
			parentMessageId: 'message-id',
			nameSuggestion: 'a'.repeat(140),
			encryptedParentRoom: true,
		});
	});

	it('should use the parent room of a discussion as the parent of the new one', async () => {
		const props = await openForm(otherUserMessage, { room: createFakeRoom({ _id: 'discussion-id', t: 'c', prid: 'parent-id' }) });

		expect(props.defaultParentRoom).toBe('parent-id');
	});

	it('should close the form', async () => {
		const props = await openForm();

		props.onClose();

		expect(setModal).toHaveBeenLastCalledWith(undefined);
	});

	it('should offer a discussion from a message', () => {
		expect(renderAction()).toMatchObject({ id: 'start-discussion' });
	});

	it('should not offer a discussion when the setting is off', () => {
		expect(renderAction(otherUserMessage, {}, wrapperWith({ setting: false }))).toBeNull();
	});

	it('should not offer a second discussion on a message that has one', () => {
		expect(renderAction(createFakeMessage({ drid: 'discussion-id' }))).toBeNull();
	});

	it('should not offer a discussion on the system message of a discussion', () => {
		expect(renderAction(createFakeMessage({ dcount: 0 }))).toBeNull();
	});

	it('should not offer a discussion to a user who is not in the room', () => {
		expect(renderAction(otherUserMessage, { subscription: undefined })).toBeNull();
	});

	it('should not offer a discussion to a user who is not in the parent room', () => {
		const discussion = createFakeRoom({ _id: 'discussion-id', t: 'c', prid: 'parent-id' });

		expect(renderAction(otherUserMessage, { room: discussion }, wrapperWith({ parentRoomMember: false }))).toBeNull();
	});

	it('should not offer a discussion in a livechat room', () => {
		expect(renderAction(otherUserMessage, { room: createFakeRoom({ t: 'l' }) })).toBeNull();
	});

	it('should not offer a discussion to a visitor who is not logged in', () => {
		expect(renderAction(otherUserMessage, {}, wrapperWith({ loggedIn: false }))).toBeNull();
	});

	it('should need the permission for messages of other users on a message of another user', () => {
		const wrapper = wrapperWith({ permissions: ['start-discussion'] });

		expect(renderAction(otherUserMessage, {}, wrapper)).toBeNull();
	});

	it('should need the permission for own messages on a message of the user', () => {
		const wrapper = wrapperWith({ permissions: ['start-discussion-other-user'] });

		expect(renderAction(ownMessage, {}, wrapper)).toBeNull();
	});

	it('should accept the permission for own messages on a message of the user', () => {
		const wrapper = wrapperWith({ permissions: ['start-discussion'] });

		expect(renderAction(ownMessage, {}, wrapper)).not.toBeNull();
	});
});
