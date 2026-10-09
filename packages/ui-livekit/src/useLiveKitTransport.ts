import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Its own root rather than a child of the conference's key: that one is invalidated whenever the call changes,
 * and credentials asked for again mid-call would be a second join's worth of rate limit for nothing.
 */
export const liveKitCredentialsQueryKey = (callId: string, join: number) => ['livekit-credentials', callId, join] as const;

/** Counts the times `connect` has turned on, so each join is told apart from the one before it. */
const useJoinCount = (connect: boolean) => {
	const [state, setState] = useState({ connect, joins: connect ? 1 : 0 });
	if (state.connect !== connect) {
		setState({ connect, joins: state.joins + (connect ? 1 : 0) });
	}
	return state.joins;
};

/** Credentials to reach the media server for this call; refused credentials surface as an error, never as `null`. */
export const useLiveKitTransport = (callId: string, enabled: boolean) => {
	const getCallConfig = useEndpoint('GET', '/v1/video-conference.callConfig');
	const join = useJoinCount(enabled);

	return useQuery({
		// Keyed by the join: each token is minted for one, and a later join must not be handed an earlier one's.
		queryKey: liveKitCredentialsQueryKey(callId, join),
		queryFn: async () => {
			const { livekit } = await getCallConfig({ callId });
			// The server answers a LiveKit call with its configuration or an error, never with neither.
			if (!livekit) {
				throw new Error('error-videoconf-unexpected');
			}
			return livekit;
		},
		enabled,
		staleTime: Infinity,
		gcTime: 0,
		retry: false,
	});
};
