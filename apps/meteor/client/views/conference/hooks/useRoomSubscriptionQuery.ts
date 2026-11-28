import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { subscriptionsQueryKeys } from '../../../lib/queryKeys';

/**
 * This user's subscription to one room, asked of the server.
 *
 * One hook because it was two: the start screen wanted the room's name from the subscription, and the call
 * window wants the subscription itself, and each had written out the same endpoint, key and retry policy. Two
 * copies of a query are two things to keep in step — the key most of all, since a key invented at the call site
 * is how the two of them spent a while missing each other's cache.
 *
 * `retry: false` because the interesting failure is a room this user cannot see, which will not start working on
 * the second ask; and `null` rather than `undefined` for "no subscription", so that answer is cached as an
 * answer instead of read as a query that has not run.
 */
export const useRoomSubscriptionQuery = (rid: string | undefined) => {
	const getSubscription = useEndpoint('GET', '/v1/subscriptions.getOne');

	return useQuery({
		queryKey: subscriptionsQueryKeys.subscription(rid as string),
		queryFn: async () => (await getSubscription({ roomId: rid as string })).subscription ?? null,
		enabled: !!rid,
		retry: false,
	});
};
