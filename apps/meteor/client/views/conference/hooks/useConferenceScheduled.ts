import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/**
 * The conference a dialled number stands for.
 *
 * Asking is what brings it into being when nobody has dialled it yet, so this is deliberately not retried: a
 * second attempt would be a second conference if the first one had in fact got through.
 */
export const useConferenceScheduled = (sipAlias: string) => {
	const joinScheduledConference = useEndpoint('POST', '/v1/video-conference.join-scheduled');

	const { data, isPending, error } = useQuery({
		queryKey: videoConferenceQueryKeys.scheduled(sipAlias),
		queryFn: async () => joinScheduledConference({ sipAlias }),
		retry: false,
	});

	return { loading: isPending, error, callId: data?.callId };
};
