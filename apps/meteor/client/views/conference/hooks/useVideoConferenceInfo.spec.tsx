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

/**
 * The call window, with or without a second reader of the same conference beside it.
 *
 * `enabled` rather than rendering one hook or two, because a hook cannot be called conditionally — and because
 * what is being measured is what the second reader costs, which needs the same tree either way.
 */
const renderReaders = (alsoElsewhere: boolean) => {
	let reads = 0;

	const view = renderHook(
		() => ({
			window: useConferenceEmbedded(callId),
			elsewhere: useVideoConferenceInfo(callId, { enabled: alsoElsewhere }),
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

	return { ...view, reads: () => reads };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

// The call window and everything that shows a call in the room — the message block, the incoming-call popup —
// are separate readers of the same conference. What must not happen is each of them asking for it: a second key
// for the same endpoint is a second request and a second answer, which can then disagree.
//
// Measured as what the second reader *adds*, not as an absolute count, because how often the window itself asks
// is its own business — it re-reads whenever it (re-)subscribes, since whatever moved while it was away was
// announced to nobody.
it('answers the call window and the rest of the app from one request', async () => {
	const { result: windowOnly, reads: readsAlone } = renderReaders(false);
	await waitFor(() => expect(windowOnly.current.window.room.rid).toBe('room-id'));
	await settle();

	const { result: bothReaders, reads: readsTogether } = renderReaders(true);
	await waitFor(() => expect(bothReaders.current.elsewhere.data).toBeDefined());
	await settle();

	expect(readsAlone()).toBeGreaterThan(0);
	expect(readsTogether()).toBe(readsAlone());
});

it('hangs the keys it builds off the shared one, so invalidating a conference reaches them', () => {
	expect(videoConferenceQueryKeys.join(callId)).toEqual([...videoConferenceQueryKeys.conference(callId), 'join']);
});
