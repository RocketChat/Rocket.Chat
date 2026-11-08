import type { EndpointFunction } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

/** A conference as the server describes it, which is what every reader of one gets. */
export type VideoConferenceInfo = Awaited<ReturnType<EndpointFunction<'GET', '/v1/video-conference.info'>>>;

/**
 * The one key a conference's info is cached under.
 *
 * Exported so that anything building a key *below* a conference — a join, a chat access — hangs it off the same
 * root, and so that nothing has to spell the root out a second time. Two spellings are two cache entries, and the
 * second one is a request that was already answered.
 */
export const videoConferenceInfoQueryKey = (callId: string) => ['video-conference', callId] as const;

/**
 * A conference, by id.
 *
 * Every screen that shows a call reads the same thing from the same place: the message block in the room, the
 * incoming-call popup, the call window. Holding the endpoint, the key and the query function together here is
 * what keeps that true — a reader that spells any of the three differently is quietly asking again for an answer
 * the cache already had.
 *
 * The defaults are what a conference is like rather than what any one screen wants: it changes rarely, and once
 * it has ended it does not change at all. Callers override what they need — `options` is spread last — because
 * sharing the entry is the point, not sharing the policy.
 */
export const useVideoConferenceInfo = <TData = VideoConferenceInfo>(
	callId: string,
	options?: Omit<UseQueryOptions<VideoConferenceInfo, Error, TData>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData, Error> => {
	const getVideoConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');

	return useQuery({
		queryKey: videoConferenceInfoQueryKey(callId),
		queryFn: () => getVideoConferenceInfo({ callId }),
		staleTime: Infinity,
		// A call that is over has nothing left to say, so remounting its message years later asks nobody. A call
		// that is still going may have changed while this was unmounted, and `staleTime` above would not notice.
		refetchOnMount: (query) => (query.state.data?.endedAt ? false : 'always'),
		...options,
	});
};
