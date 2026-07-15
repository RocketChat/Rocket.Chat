import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useConferenceScheduled = (sipAlias: string) => {
	const joinScheduledConference = useEndpoint('POST', '/v1/video-conference.join-scheduled');

	const { data, isPending, error } = useQuery({
		queryKey: ['conference-scheduled', sipAlias],
		queryFn: async () => joinScheduledConference({ sipAlias }),
	});

	return {
		loading: isPending,
		error,
		callId: data?.callId,
	};
};
