import { useEndpoint } from '@rocket.chat/ui-contexts';
import { videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { useQuery } from '@tanstack/react-query';

/** Credentials to reach the media server for this call; refused credentials surface as an error, never as `null`. */
export const useLiveKitTransport = (callId: string, enabled: boolean) => {
	const getCallConfig = useEndpoint('GET', '/v1/video-conference.callConfig');

	return useQuery({
		queryKey: [...videoConferenceInfoQueryKey(callId), 'call-config'],
		queryFn: async () => {
			const { livekit } = await getCallConfig({ callId });
			// The server answers a LiveKit call with its configuration or an error, never with neither.
			if (!livekit) {
				throw new Error('error-videoconf-unexpected');
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
