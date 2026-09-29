import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/** Credentials to reach the media server for this call; refused credentials surface as an error, never as `null`. */
export const useLiveKitTransport = (callId: string, enabled: boolean) => {
	const getTransportConfig = useEndpoint('GET', '/v1/video-conference.livekit.transport.config');

	return useQuery({
		queryKey: videoConferenceQueryKeys.livekitTransport(callId),
		queryFn: async () => {
			const { livekit } = await getTransportConfig({ callId });
			if (!livekit) {
				throw new Error('error-videoconf-livekit-transport-unavailable');
			}
			return livekit;
		},
		enabled,
		// Each token is minted for one join; a cached one could outlive its TTL.
		staleTime: Infinity,
		gcTime: 0,
		retry: false,
	});
};
