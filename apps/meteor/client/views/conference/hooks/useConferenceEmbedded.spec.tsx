import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useConferenceEmbedded } from './useConferenceEmbedded';

const callId = 'call-id';
const outsider = { _id: 'outsider-id', username: 'outsider', name: 'Outsider' };

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
	let reads = 0;

	const result = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => {
				reads += 1;
				return buildInfo(reads === 1 ? [outsider._id] : []);
			})
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	return { ...result, streamRef, reads: () => reads };
};

it('resolves the chat room and the members who cannot read it', async () => {
	const { result } = renderConference();

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
	await waitFor(() => expect(result.current.room.chatAccess?.members).toEqual([outsider]));
});

it.each(['discussionUpdated', 'chatAccessUpdated'] as const)('reads the conference again on %s', async (event) => {
	const { result, streamRef } = renderConference();

	await waitFor(() => expect(result.current.room.chatAccess?.members).toHaveLength(1));

	// Both events mean "what you know about this conference is stale" — the chat moved, or the same room
	// became readable. Missing either leaves a notice up until the page is reloaded.
	// The two event keys carry different argument tuples, so the union needs widening to emit either.
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
