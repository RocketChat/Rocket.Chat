import type { VideoConferenceChatAccess } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { ConferenceMember } from './useCallOutcome';
import { useConferenceCallUrl } from './useConferenceCallUrl';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';
import { mapVideoConfUserFromApi } from '../../../lib/utils/mapVideoConfUserFromApi';

/** Chat access with the members it concerns resolved, since the UI has to name the people it is about. */
export type ConferenceChatAccess = VideoConferenceChatAccess & {
	members: ConferenceMember[];
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

	// Three ways the conference can change under a participant: the chat moves to another room
	// (`discussionUpdated`), the same room becomes readable by members who couldn't read it
	// (`chatAccessUpdated`), or the membership moves — someone joined, declined or left (`membersUpdated`).
	// All are answered by reading the conference again, which carries the room, who can see it, and who is in it.
	useEffect(() => {
		const invalidate = () => {
			void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
		};

		const unsubscribes = [
			subscribeToVideoConference(`${callId}/discussionUpdated`, invalidate),
			subscribeToVideoConference(`${callId}/chatAccessUpdated`, invalidate),
			subscribeToVideoConference(`${callId}/membersUpdated`, invalidate),
		];

		return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
	}, [callId, subscribeToVideoConference, queryClient]);

	// Members who are in the call but can't read its chat — membership grants no room access.
	// Membership timestamps arrive as strings over REST; revive them once here so nothing downstream has to care.
	const members = useMemo(() => info?.users.map(mapVideoConfUserFromApi) ?? [], [info?.users]);

	const chatAccess = useMemo((): ConferenceChatAccess | undefined => {
		if (!info) {
			return undefined;
		}

		const missing = new Set(info.chatAccess.membersWithoutAccess);
		return { ...info.chatAccess, members: members.filter(({ _id }) => missing.has(_id)) };
	}, [info, members]);

	const { data, isPending, error } = useQuery({
		queryKey: videoConferenceQueryKeys.join(callId),
		queryFn: async () => joinConference({ callId, state: { mic: true, cam: false } }),
	});

	// Joining changes our own membership, and the broadcast announcing it can beat the stream subscription being
	// established — which left the members list showing us as absent until something else moved.
	useEffect(() => {
		if (!data) {
			return;
		}

		void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
	}, [data, callId, queryClient]);

	return {
		call: {
			// Who is associated with the call and where each of them stands — the call window uses it to tell
			// "still ringing" from "nobody is coming".
			members,
			/** Only a direct call rang a particular person, so only there does ringing again mean anything. */
			canRing: info?.type === 'direct',
		} as const,
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
