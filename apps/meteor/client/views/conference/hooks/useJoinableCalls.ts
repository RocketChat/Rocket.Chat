import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useConferenceWindowEnabled } from './useConferenceWindowEnabled';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/**
 * How often to poll for joinable calls as a safety net.
 *
 * The subscription to `notify-user/video-conference` below handles instant discovery when the server sends a
 * per-user event (ring, join, end, and — for embedded providers — started). Polling stays as a fallback for
 * edge cases (missed events, reconnections, server not yet broadcasting 'started') and keeps the list
 * self-healing.
 */
const POLL_INTERVAL = 20_000;

/**
 * The calls running now that this user may join, freshest first.
 *
 * Kept whole here — declined calls included — because who filters what is the reader's business: the sidebar
 * leaves out the ones turned down, and anything showing a way *back* to a declined call needs them.
 *
 * Empty, and entirely inert, without the call window: nothing reaches a call through this list then, so nothing
 * asks the server for one — no query, no 20-second poll and no stream subscription.
 */
export const useJoinableCalls = () => {
	const getJoinable = useEndpoint('GET', '/v1/video-conference.joinable');
	const queryClient = useQueryClient();
	const uid = useUserId();
	const subscribeToNotifyUser = useStream('notify-user');
	const enabled = useConferenceWindowEnabled();

	// A ring *is* announced, to the person being rung — and waiting up to the poll interval to show a call that is
	// ringing right now would miss it entirely. So the ring is what asks for the list again.
	const incomingCalls = useVideoConfIncomingCalls();

	useEffect(() => {
		if (!enabled || !incomingCalls.length) {
			return;
		}

		void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() });
	}, [enabled, incomingCalls, queryClient]);

	// Embedded (LiveKit) calls don't ring — they send a 'started' event instead. Any other video-conference
	// event (join, end) also means the joinable list may have changed. Subscribing here makes discovery
	// effectively instant instead of waiting for the next poll.
	useEffect(() => {
		if (!enabled || !uid) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/video-conference`, () => {
			void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() });
		});
	}, [enabled, uid, subscribeToNotifyUser, queryClient]);

	const { data, isLoading } = useQuery({
		queryKey: videoConferenceQueryKeys.joinable(),
		queryFn: async () => {
			const { calls } = await getJoinable();

			// `createdAt` arrives as a string over REST. Newest first, and sorted here rather than trusted from
			// the server, since both readers present it as a most-recent-first list.
			return calls
				.map(
					({ createdAt, ringingAt, ...call }): JoinableVideoConference => ({
						...call,
						createdAt: new Date(createdAt),
						...(ringingAt && { ringingAt: new Date(ringingAt) }),
					}),
				)
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		},
		refetchInterval: POLL_INTERVAL,
		enabled,
	});

	return { calls: data ?? [], isLoading };
};
