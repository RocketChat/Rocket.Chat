import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/**
 * How often to look again for calls this user could join.
 *
 * A call starting is not announced to everyone who could join it: doing that would mean a broadcast to every
 * subscriber of the room, which is the same fan-out that makes ringing a large room impossible in the first
 * place. So this polls. It is not a latency-critical list — it exists precisely for calls whose ring never
 * arrived, and anything the user does themselves invalidates it immediately.
 */
const POLL_INTERVAL = 20_000;

/**
 * The calls running now that this user may join, freshest first.
 *
 * Both the sidebar and the call-history page read this one query, with different eyes: the sidebar leaves out
 * calls the user declined, while the history keeps them, because the history is the way back to a call that was
 * turned down.
 */
export const useJoinableCalls = () => {
	const getJoinable = useEndpoint('GET', '/v1/video-conference.joinable');
	const queryClient = useQueryClient();

	// A ring *is* announced, to the person being rung — and waiting up to the poll interval to show a call that is
	// ringing right now would miss it entirely. So the ring is what asks for the list again.
	const incomingCalls = useVideoConfIncomingCalls();

	useEffect(() => {
		if (!incomingCalls.length) {
			return;
		}

		void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() });
	}, [incomingCalls, queryClient]);

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
	});

	return { calls: data ?? [], isLoading };
};
