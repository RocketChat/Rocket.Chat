import type { IVideoConferenceUser, VideoConferenceChatAccess } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useConferenceCallUrl } from './useConferenceCallUrl';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

/** Chat access with the members it concerns resolved, since the UI has to name the people it is about. */
export type ConferenceChatAccess = VideoConferenceChatAccess & {
	members: Pick<IVideoConferenceUser, '_id' | 'username' | 'name'>[];
};

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();
	const subscribeToVideoConference = useStream('video-conference');
	const queryClient = useQueryClient();

	// The chat room comes from the conference record: show `discussionRid` when it's set (a discussion was
	// created), otherwise the conference's `rid` (the original room). The `rid` never changes.
	const {
		data: info,
		isPending: isInfoPending,
		error: infoError,
	} = useQuery({
		queryKey: videoConferenceQueryKeys.conference(callId),
		queryFn: async () => getConferenceInfo({ callId }),
		retry: false,
	});

	// Two ways the chat can change under a participant: it moves to another room (`discussionUpdated`), or the
	// same room becomes readable by members who couldn't read it (`chatAccessUpdated`). Both are answered by
	// reading the conference again — it carries both the room and who can see it.
	useEffect(() => {
		const invalidate = () => {
			void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
		};

		const unsubscribes = [
			subscribeToVideoConference(`${callId}/discussionUpdated`, invalidate),
			subscribeToVideoConference(`${callId}/chatAccessUpdated`, invalidate),
		];

		return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
	}, [callId, subscribeToVideoConference, queryClient]);

	// Members who are in the call but can't read its chat — membership grants no room access.
	const chatAccess = useMemo((): ConferenceChatAccess | undefined => {
		if (!info) {
			return undefined;
		}

		const missing = new Set(info.chatAccess.membersWithoutAccess);
		return { ...info.chatAccess, members: info.users.filter(({ _id }) => missing.has(_id)) };
	}, [info]);

	const { data, isPending, error } = useQuery({
		queryKey: videoConferenceQueryKeys.join(callId),
		queryFn: async () => joinConference({ callId, state: { mic: true, cam: false } }),
	});

	return {
		room: {
			rid: info?.discussionRid || info?.rid,
			loading: isInfoPending,
			error: infoError,
			chatAccess,
		} as const,
		conference: {
			url: data?.url ? getConferenceCallUrl(data.url) : undefined,
			providerName: data?.providerName,
			loading: isPending,
			error,
		} as const,
	};
};
