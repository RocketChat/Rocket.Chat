import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { VideoConferenceInfo } from '@rocket.chat/ui-video-conf';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useVideoConfData = ({ callId }: { callId: string }): UseQueryResult<VideoConferenceInfo, Error> => {
	const getVideoConfInfo = useEndpoint('GET', '/v1/video-conference.info');

	return useQuery({
		queryKey: ['video-conference', callId],
		queryFn: () => getVideoConfInfo({ callId }),
		staleTime: Infinity,

		refetchOnMount: (query) => {
			if (query.state.data?.endedAt) {
				return false;
			}

			return 'always';
		},
	});
};
