import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useConferenceEmbedded } from './useConferenceEmbedded';

const callId = 'call-id';
// `ts` is required on a membership entry and arrives as a string over REST, so the fixture carries one.
const outsider = { _id: 'outsider-id', username: 'outsider', name: 'Outsider', ts: '2026-08-01T10:00:00.000Z' };

jest.mock('./useConferenceCallUrl', () => ({
	useConferenceCallUrl: () => (url: string) => url,
}));

// The conference is read again after every change, so what the second read returns is the whole point: the
// first says a member can't see the chat, the second says the situation is resolved.
const buildInfo = (membersWithoutAccess: string[]) =>
	({
		_id: callId,
		type: 'videoconference',
		rid: 'room-id',
		users: [outsider],
		capabilities: {},
		chatAccess: {
			rid: 'room-id',
			name: 'general',
			type: 'c',
			membersWithoutAccess,
			canInvite: true,
		},
	}) as any;

const renderConference = () => {
	const streamRef: StreamControllerRef<'video-conference'> = {};
	// What the server would say right now. Set by the test, rather than derived from how many times the hook has
	// read — the hook reads whenever it has reason to, which is not the test's business.
	let membersWithoutAccess = [outsider._id];

	const result = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => buildInfo(membersWithoutAccess))
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	return {
		...result,
		streamRef,
		resolveChatAccess: () => {
			membersWithoutAccess = [];
		},
	};
};

it('resolves the chat room and the members who cannot read it', async () => {
	const { result } = renderConference();

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
	await waitFor(() => expect(result.current.room.chatAccess?.members).toEqual([{ ...outsider, ts: new Date(outsider.ts) }]));
});

it.each(['discussionUpdated', 'chatAccessUpdated', 'membersUpdated'] as const)('reads the conference again on %s', async (event) => {
	const { result, streamRef, resolveChatAccess } = renderConference();

	await waitFor(() => expect(result.current.room.chatAccess?.members).toHaveLength(1));

	resolveChatAccess();

	// Each event means "what you know about this conference is stale" — the chat moved, the same room became
	// readable, or the membership changed. Missing any of them leaves the UI wrong until the page is reloaded.
	// The event keys carry different argument tuples, so the union needs widening to emit any of them.
	(streamRef.controller?.emit as (event: string, args: unknown[]) => void)?.(`${callId}/${event}`, [{ discussionRid: undefined }]);

	await waitFor(() => expect(result.current.room.chatAccess?.members).toHaveLength(0));
});

it('follows the chat to a discussion the conference moved into', async () => {
	const streamRef: StreamControllerRef<'video-conference'> = {};
	let discussionRid: string | undefined;

	const { result } = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => ({ ...buildInfo([]), discussionRid }) as any)
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));

	discussionRid = 'discussion-id';
	streamRef.controller?.emit(`${callId}/discussionUpdated`, [{ discussionRid }]);

	await waitFor(() => expect(result.current.room.rid).toBe('discussion-id'));
});
