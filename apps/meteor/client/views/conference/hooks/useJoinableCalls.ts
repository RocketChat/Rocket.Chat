import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

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

	const { data, isLoading } = useQuery({
		queryKey: videoConferenceQueryKeys.joinable(),
		queryFn: async () => {
			const { calls } = await getJoinable();

			// `createdAt` arrives as a string over REST. Newest first, and sorted here rather than trusted from
			// the server, since both readers present it as a most-recent-first list.
			return calls
				.map((call): JoinableVideoConference => ({ ...call, createdAt: new Date(call.createdAt) }))
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		},
		refetchInterval: POLL_INTERVAL,
	});

	return { calls: data ?? [], isLoading };
};
