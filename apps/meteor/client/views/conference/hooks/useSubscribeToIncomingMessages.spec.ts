import type { IEditedMessage, IMessage } from '@rocket.chat/core-typings';
import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { isIncomingCallMessage, useSubscribeToIncomingMessages } from './useSubscribeToIncomingMessages';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { e2e } from '../../../lib/e2ee/rocketchat.e2e';

jest.mock('../../../lib/e2ee/rocketchat.e2e', () => ({ e2e: { decryptMessage: jest.fn() } }));

const decryptMessage = jest.mocked(e2e.decryptMessage);

const rid = 'room-id';
const joinedAt = new Date('2026-11-03T10:00:00.000Z');
const afterJoining = new Date('2026-11-03T10:05:00.000Z');
const grace = { _id: 'grace-id', username: 'grace', name: 'Grace Hopper' };

const incoming = (overrides: Partial<IMessage> = {}) => createFakeMessage({ rid, u: grace, ts: afterJoining, msg: 'Hello', ...overrides });

describe('isIncomingCallMessage', () => {
	const scope = { uid: 'john.doe', since: joinedAt };

	it('takes a message someone else sent after the reader joined', () => {
		expect(isIncomingCallMessage(incoming(), scope)).toBe(true);
	});

	it("leaves out the reader's own messages", () => {
		expect(isIncomingCallMessage(incoming({ u: { _id: 'john.doe', username: 'john.doe' } }), scope)).toBe(false);
	});

	// A reaction or a reply to an older message re-sends it whole, and that is not someone talking to the call.
	it('leaves out messages sent before the reader joined', () => {
		expect(isIncomingCallMessage(incoming({ ts: new Date('2026-11-03T09:00:00.000Z') }), scope)).toBe(false);
	});

	it('leaves out edits', () => {
		const edited = createFakeMessage<IEditedMessage>({ ...incoming(), editedAt: afterJoining, editedBy: grace });

		expect(isIncomingCallMessage(edited, scope)).toBe(false);
	});

	it('leaves out system messages', () => {
		expect(isIncomingCallMessage(incoming({ t: 'uj' }), scope)).toBe(false);
	});

	it('leaves out messages from people the reader ignores', () => {
		expect(isIncomingCallMessage(incoming(), { ...scope, ignored: [grace._id] })).toBe(false);
	});

	it('takes encrypted messages', () => {
		expect(isIncomingCallMessage(incoming({ t: 'e2e', e2e: 'pending' }), scope)).toBe(true);
	});

	describe('when the chat is the room', () => {
		it('leaves out thread replies', () => {
			expect(isIncomingCallMessage(incoming({ tmid: 'thread-id' }), scope)).toBe(false);
		});

		it('takes thread replies that were also sent to the room', () => {
			expect(isIncomingCallMessage(incoming({ tmid: 'thread-id', tshow: true }), scope)).toBe(true);
		});
	});

	describe('when the chat is a thread', () => {
		const threadScope = { ...scope, tmid: 'thread-id' };

		it("takes the thread's replies", () => {
			expect(isIncomingCallMessage(incoming({ tmid: 'thread-id' }), threadScope)).toBe(true);
		});

		it('leaves out the rest of the room', () => {
			expect(isIncomingCallMessage(incoming(), threadScope)).toBe(false);
			expect(isIncomingCallMessage(incoming({ tmid: 'other-thread-id' }), threadScope)).toBe(false);
		});
	});
});

describe('useSubscribeToIncomingMessages', () => {
	beforeEach(() => {
		decryptMessage.mockReset();
		decryptMessage.mockImplementation(async (message) => message);
	});

	const render = (since?: Date) => {
		const streamRef: StreamControllerRef<'room-messages'> = {};

		const { result } = renderHook(() => useSubscribeToIncomingMessages({ rid, since }), {
			wrapper: mockAppRoot().withJohnDoe().withStream('room-messages', streamRef).build(),
		});

		return { subscribe: result.current, streamRef };
	};

	it('offers nothing to subscribe to before the reader has joined', () => {
		expect(render().subscribe).toBeUndefined();
	});

	it('hands over who sent a message and a plain-text preview of it', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		subscribe?.(listener);

		streamRef.controller?.emit(rid, [incoming({ _id: 'message-id', msg: '*Can* everyone see my screen?' })]);

		await waitFor(() =>
			expect(listener).toHaveBeenCalledWith({
				_id: 'message-id',
				username: 'grace',
				name: 'Grace Hopper',
				text: 'Can everyone see my screen?',
			}),
		);
	});

	// The stream sends the whole message again on every change to it, such as a link preview arriving.
	it('hands each message over once', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		subscribe?.(listener);

		const message = incoming();
		streamRef.controller?.emit(rid, [message]);
		streamRef.controller?.emit(rid, [{ ...message, urls: [{ url: 'https://rocket.chat', meta: {} }] }]);

		await waitFor(() => expect(listener).toHaveBeenCalled());
		expect(listener).toHaveBeenCalledTimes(1);
	});

	// Blocks alone, or an attachment with nothing to name it, would be a preview with a sender and no message.
	it('leaves out a message with no text to show', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		subscribe?.(listener);

		streamRef.controller?.emit(rid, [incoming({ _id: 'blocks-only', msg: '' })]);
		streamRef.controller?.emit(rid, [incoming({ _id: 'with-text' })]);

		await waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ _id: 'with-text' })));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('previews an encrypted message this session can decrypt', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		subscribe?.(listener);
		decryptMessage.mockImplementation(async (message) => ({ ...message, e2e: 'done', msg: 'Hello in private' }));

		streamRef.controller?.emit(rid, [incoming({ t: 'e2e', e2e: 'pending', msg: '' })]);

		await waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello in private' })));
	});

	it('hands over an encrypted message it cannot decrypt with no text', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		subscribe?.(listener);

		streamRef.controller?.emit(rid, [incoming({ _id: 'message-id', t: 'e2e', e2e: 'pending', msg: '' })]);

		await waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ _id: 'message-id', text: undefined })));
	});

	it('stops handing messages over once unsubscribed', async () => {
		const { subscribe, streamRef } = render(joinedAt);
		const listener = jest.fn();
		const unsubscribe = subscribe?.(listener);

		streamRef.controller?.emit(rid, [incoming()]);
		unsubscribe?.();
		await Promise.resolve();

		expect(listener).not.toHaveBeenCalled();
	});
});
