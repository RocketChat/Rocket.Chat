import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useConferenceCallUrl } from './useConferenceCallUrl';

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();
	const subscribeToVideoConference = useStream('video-conference');
	const queryClient = useQueryClient();

	// The chat room comes from the conference record: show `discussionRid` when it's set (a discussion
	// was created), otherwise the conference's `rid` (the original room). The `rid` never changes.
	const {
		data: info,
		isPending: isInfoPending,
		error: infoError,
	} = useQuery({
		queryKey: ['conference-info', callId],
		queryFn: async () => getConferenceInfo({ callId }),
		retry: false,
	});

	// When a participant changes the conference's room (e.g. adds people and creates a discussion),
	// the server broadcasts `discussionUpdated`; refetch so every participant's chat follows along.
	useEffect(
		() =>
			subscribeToVideoConference(`${callId}/discussionUpdated`, () => {
				void queryClient.invalidateQueries({ queryKey: ['conference-info', callId] });
			}),
		[callId, subscribeToVideoConference, queryClient],
	);

	const { data, isPending, error } = useQuery({
		queryKey: ['conference-embedded', callId],
		queryFn: async () => joinConference({ callId, state: { mic: true, cam: false } }),
	});

	return {
		room: { rid: info?.discussionRid || info?.rid, loading: isInfoPending, error: infoError } as const,
		conference: {
			url: data?.url ? getConferenceCallUrl(data.url) : undefined,
			providerName: data?.providerName,
			loading: isPending,
			error,
		} as const,
	};
};
