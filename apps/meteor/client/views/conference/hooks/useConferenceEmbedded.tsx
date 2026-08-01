import type { CallPreferences, IVideoConference, Serialized, VideoConferenceCapabilities } from '@rocket.chat/core-typings';
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
	/**
	 * Data from `video-conference.info` — available before the user joins, so
	 * the pre-flight screen can render who's in the call without marking the
	 * user as a participant.
	 */
	call: {
		type?: IVideoConference['type'];
		users: Serialized<IVideoConference>['users'];
		participants?: Serialized<IVideoConference>['participants'];
		createdBy?: IVideoConference['createdBy'];
		providerName?: string;
		capabilities?: VideoConferenceCapabilities;
	};
	conference: {
		url?: string;
		providerName?: string;
		loading: boolean;
		error: boolean;
	};
};

type UseConferenceEmbeddedOptions = {
	/**
	 * `video-conference.join` marks the user as joined server-side (message
	 * card, participants list), so it must only fire after the user clicks
	 * Join in the pre-flight screen.
	 */
	join: boolean;
	/** bump to force a fresh join call (e.g. Rejoin from the you-left state) */
	joinNonce?: number;
};

export const useConferenceEmbedded = (
	callId: string,
	state: CallPreferences = { mic: true, cam: false },
	{ join, joinNonce = 0 }: UseConferenceEmbeddedOptions = { join: true },
): UseConferenceEmbeddedResult => {
	const uid = useUserId();
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();
	const subscribeToVideoConference = useStream('notify-user');
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
		queryKey: ['conference-embedded', 'join', callId, state, uid, joinNonce],
		queryFn: async () => {
			const data = await joinConference({ callId, state });
			return data as JoinConferenceResponse;
		},
		enabled: !!callId && !!uid && join,
		retry: false,
	});

	useEffect(() => {
		if (!callId || !uid) {
			return;
		}

		return subscribeToVideoConference(`${uid}/video-conference`, ({ action, params }) => {
			if (action === 'discussionUpdated' && params?.callId === callId) {
				void queryClient.invalidateQueries({ queryKey: ['conference-embedded', 'info', callId, uid] });
			}
		});
	}, [callId, queryClient, subscribeToVideoConference, uid]);

	return useMemo(
		() => ({
			room: {
				rid: info?.discussionRid || info?.rid,
				loading: isInfoPending,
				error: isInfoError,
			},
			call: {
				type: info?.type,
				users: info?.users ?? [],
				participants: info?.participants,
				createdBy: info?.createdBy,
				providerName: info?.providerName,
				capabilities: info?.capabilities,
			},
			conference: {
				url: joined?.url ? getConferenceCallUrl(joined.url) : undefined,
				providerName: joined?.providerName,
				loading: isJoinPending,
				error: isJoinError,
			},
		}),
		[info, isInfoPending, isInfoError, joined?.url, joined?.providerName, getConferenceCallUrl, isJoinPending, isJoinError],
	);
};
