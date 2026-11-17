import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/** An alias is all digits; a booking's id never is. */
const isSipAlias = (id: string) => /^\d+$/.test(id);

/**
 * The conference a dialled number or a booking stands for.
 *
 * Asking is what brings it into being when nobody has reached it yet, so this is deliberately not retried: a
 * second attempt would be a second conference if the first one had in fact got through.
 */
export const useConferenceScheduled = (id: string) => {
	const joinScheduledConference = useEndpoint('POST', '/v1/video-conference.join-scheduled');

	const { data, isPending, error } = useQuery({
		queryKey: videoConferenceQueryKeys.scheduled(id),
		queryFn: async () => joinScheduledConference(isSipAlias(id) ? { sipAlias: id } : { scheduledConferenceId: id }),
		retry: false,
	});

	return { loading: isPending, error, callId: data?.callId };
};
