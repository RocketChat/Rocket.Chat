import type { VideoConference, VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type VideoConfInfo = VideoConference & { capabilities: VideoConferenceCapabilities };

export const useVideoConfData = ({ callId }: { callId: string }) => {
	const getVideoConfInfo = useEndpoint('GET', '/v1/video-conference.info');

	return useQuery<VideoConfInfo, Error>({
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
