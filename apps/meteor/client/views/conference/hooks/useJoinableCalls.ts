import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useConferenceWindowEnabled } from './useConferenceWindowEnabled';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/**
 * The calls running now that this user may join, freshest first.
 *
 * Kept whole here — declined calls included — because who filters what is the reader's business: the sidebar
 * leaves out the ones turned down, and anything showing a way *back* to a declined call needs them.
 *
 * Empty, and entirely inert, without the call window: nothing reaches a call through this list then, so nothing
 * asks the server for one — no query and no stream subscription.
 */
export const useJoinableCalls = () => {
	const getJoinable = useEndpoint('GET', '/v1/video-conference.joinable');
	const queryClient = useQueryClient();
	const uid = useUserId();
	const subscribeToNotifyUser = useStream('notify-user');
	const enabled = useConferenceWindowEnabled();

	// A ring *is* announced, to the person being rung, but the announcement arrives at the popup rather than here.
	// So the ring is what asks for the list again.
	const incomingCalls = useVideoConfIncomingCalls();

	useEffect(() => {
		if (!enabled || !incomingCalls.length) {
			return;
		}

		void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() });
	}, [enabled, incomingCalls, queryClient]);

	// Embedded (LiveKit) calls don't ring — they send a 'started' event instead. Any other video-conference
	// event (join, end) also means the joinable list may have changed. This subscription is how the list stays
	// current; nothing asks on a timer.
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
				.map(({ createdAt, ringingAt, ...call }): JoinableVideoConference => ({
					...call,
					createdAt: new Date(createdAt),
					...(ringingAt && { ringingAt: new Date(ringingAt) }),
				}))
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		},
		// What is left when the events are missed — a socket that dropped and came back having lost some. Asking
		// when the user returns to the window catches it at the only moment the answer is about to be read. The
		// workspace turns this off for queries in general, so this one says it for itself.
		refetchOnWindowFocus: true,
		enabled,
	});

	return { calls: data ?? [], isLoading };
};
