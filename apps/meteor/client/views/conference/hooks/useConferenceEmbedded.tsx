import type { CallPreferences } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useConferenceCallUrl } from './useConferenceCallUrl';

type JoinConferenceResponse = {
	url?: string;
	providerName?: string;
};

type UseConferenceEmbeddedResult = {
	room: {
		rid?: string;
		loading: boolean;
		error: boolean;
	};
	conference: {
		url?: string;
		providerName?: string;
		loading: boolean;
		error: boolean;
	};
};

export const useConferenceEmbedded = (callId: string, state: CallPreferences = { mic: true, cam: false }): UseConferenceEmbeddedResult => {
	const uid = useUserId();
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();
	const subscribeToVideoConference = useStream('video-conference');
	const queryClient = useQueryClient();

	const {
		data: info,
		isPending: isInfoPending,
		isError: isInfoError,
	} = useQuery({
		queryKey: ['conference-embedded', 'info', callId, uid],
		queryFn: async () => getConferenceInfo({ callId }),
		enabled: !!callId && !!uid,
		retry: false,
	});

	const {
		data: joined,
		isPending: isJoinPending,
		isError: isJoinError,
	} = useQuery<JoinConferenceResponse>({
		queryKey: ['conference-embedded', 'join', callId, state, uid],
		queryFn: async () => {
			const data = await joinConference({ callId, state });
			return data as JoinConferenceResponse;
		},
		enabled: !!callId && !!uid,
		retry: false,
	});

	useEffect(() => {
		if (!callId) {
			return;
		}

		return subscribeToVideoConference(`${callId}/discussionUpdated`, () => {
			void queryClient.invalidateQueries({ queryKey: ['conference-embedded', 'info', callId, uid] });
		});
	}, [callId, queryClient, subscribeToVideoConference, uid]);

	return useMemo(
		() => ({
			room: {
				rid: info?.discussionRid || info?.rid,
				loading: isInfoPending,
				error: isInfoError,
			},
			conference: {
				url: joined?.url ? getConferenceCallUrl(joined.url) : undefined,
				providerName: joined?.providerName,
				loading: isJoinPending,
				error: isJoinError,
			},
		}),
		[
			info?.discussionRid,
			info?.rid,
			isInfoPending,
			isInfoError,
			joined?.url,
			joined?.providerName,
			getConferenceCallUrl,
			isJoinPending,
			isJoinError,
		],
	);
};
