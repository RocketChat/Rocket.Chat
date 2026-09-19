import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useVideoConferenceInfo } from '@rocket.chat/ui-video-conf';
import { renderHook, waitFor } from '@testing-library/react';

import { useConferenceEmbedded } from './useConferenceEmbedded';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

const callId = 'call-id';

const info = {
	_id: callId,
	type: 'videoconference',
	rid: 'room-id',
	title: '',
	createdBy: { _id: 'someone-else', username: 'someone.else', name: 'Someone Else' },
	users: [],
	messages: { started: 'some-msg-id' },
	capabilities: { mic: true },
	chatAccess: { rid: 'room-id', name: 'general', type: 'c', membersWithoutAccess: [], canInvite: true },
} as any;

// The call window and everything that shows a call in the room — the message block, the incoming-call popup —
// are separate readers of the same conference. What must not happen is each of them asking for it: a second key
// for the same endpoint is a second request and a second answer, which can then disagree.
it('answers the call window and the rest of the app from one request', async () => {
	let reads = 0;

	const { result } = renderHook(
		() => ({
			window: useConferenceEmbedded(callId),
			elsewhere: useVideoConferenceInfo(callId),
		}),
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint('GET', '/v1/video-conference.info', () => {
					reads += 1;
					return info;
				})
				.build(),
		},
	);

	await waitFor(() => {
		expect(result.current.elsewhere.data).toBeDefined();
	});

	expect(result.current.window.room.rid).toBe('room-id');
	expect(reads).toBe(1);
});

it('hangs the keys it builds off the shared one, so invalidating a conference reaches them', () => {
	expect(videoConferenceQueryKeys.join(callId)).toEqual([...videoConferenceQueryKeys.conference(callId), 'join']);
});
