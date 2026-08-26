import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { canDeclineCall, useOngoingCallsList } from './useOngoingCalls';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const renderList = (calls: JoinableVideoConference[]) =>
	renderHook(() => useOngoingCallsList(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.build(),
	});

// The three states a call can be in for this list, and each belongs somewhere different: one is asking, one is
// simply there, and one was turned down and waits under the rest.
it('splits the calls into ringing, running and declined', async () => {
	const { result } = renderList([
		buildJoinableCall({ callId: 'ringing', ringingAt: new Date() }),
		buildJoinableCall({ callId: 'running' }),
		buildJoinableCall({ callId: 'refused', declined: true }),
	]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(1));

	expect(result.current.ringing.map(({ callId }) => callId)).toEqual(['ringing']);
	expect(result.current.ongoing.map(({ callId }) => callId)).toEqual(['running']);
	expect(result.current.declined.map(({ callId }) => callId)).toEqual(['refused']);
});

// Declining quiets a call rather than losing it: it leaves the list proper, and the way back to it is the toggle
// under the group rather than a trip to the call history.
it('keeps a declined call out of the list proper', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'refused', declined: true })]);

	await waitFor(() => expect(result.current.declined).toHaveLength(1));

	expect(result.current.ringing).toHaveLength(0);
	expect(result.current.ongoing).toHaveLength(0);
});

// The call the reader is in stays listed, because leaving one is easy to do by accident and a call that vanished on
// being joined left no way back into it.
it('keeps the call the reader is already in, as one simply running', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'here', joined: true }), buildJoinableCall({ callId: 'elsewhere' })]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(2));

	expect(result.current.ongoing.map(({ callId }) => callId)).toEqual(['here', 'elsewhere']);
	expect(result.current.declined).toHaveLength(0);
});

// Joining answers the ring, so the row stops asking — it is listed as running even while the record of the ring is
// still on the call.
it('does not treat a call it has joined as ringing', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'answered', joined: true, ringingAt: new Date() })]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(1));

	expect(result.current.ringing).toHaveLength(0);
});

// A call turned down and then joined anyway is a call the reader is in, not one waiting under the list.
it('lists a call it has joined even if it was declined first', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'rejoined', joined: true, declined: true })]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(1));

	expect(result.current.declined).toHaveLength(0);
});

// Nothing to turn down for a call the reader is in: the way out is to leave it.
it('offers no decline for a call the reader is in', () => {
	expect(canDeclineCall(buildJoinableCall({ callId: 'here', joined: true }))).toBe(false);
	expect(canDeclineCall(buildJoinableCall({ callId: 'gone', declined: true }))).toBe(false);
	expect(canDeclineCall(buildJoinableCall({ callId: 'fresh' }))).toBe(true);
});
