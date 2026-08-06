import type { VideoConferenceChatAccess } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { ConferenceMember } from './useCallOutcome';
import type { CallPreferences } from './useCallPreferences';
import { useConferenceCallUrl } from './useConferenceCallUrl';
import { isUnaskedConferenceMember } from '../../../../lib/videoConference/memberStatus';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';
import { mapVideoConfUserFromApi } from '../../../lib/utils/mapVideoConfUserFromApi';

/** Chat access with the members it concerns resolved, since the UI has to name the people it is about. */
export type ConferenceChatAccess = VideoConferenceChatAccess & {
	members: ConferenceMember[];
};

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const renameConference = useEndpoint('POST', '/v1/video-conference.rename');
	const dispatchToastMessage = useToastMessageDispatch();
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const getConferenceCallUrl = useConferenceCallUrl();
	const subscribeToVideoConference = useStream('video-conference');
	const queryClient = useQueryClient();
	const uid = useUserId();

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

	// The conference can change under a participant in several ways — the chat moves to another room, the same room
	// becomes readable by members who couldn't read it, someone joins, declines or leaves — and every one of them
	// has the same answer: read the conference again. It carries the room, who can see it, and who is in it.
	useEffect(
		() =>
			subscribeToVideoConference(`${callId}/updated`, () => {
				void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
			}),
		[callId, subscribeToVideoConference, queryClient],
	);

	// Members who are in the call but can't read its chat — membership grants no room access.
	// Membership timestamps arrive as strings over REST; revive them once here so nothing downstream has to care.
	const members = useMemo(() => info?.users.map(mapVideoConfUserFromApi) ?? [], [info?.users]);

	/** What the call is called: its own name if it has one, otherwise the room it belongs to. */
	const currentName = (info?.type === 'videoconference' && info.title) || info?.chatAccess.name || '';

	const chatAccess = useMemo((): ConferenceChatAccess | undefined => {
		if (!info) {
			return undefined;
		}

		const missing = new Set(info.chatAccess.membersWithoutAccess);
		return { ...info.chatAccess, members: members.filter(({ _id }) => missing.has(_id)) };
	}, [info, members]);

	// Joining is the user's decision, made on the preflight screen, because it is what turns their mic and camera
	// choices into the provider's URL — and what marks them as present. So this waits to be asked, rather than
	// running as soon as the window opens.
	//
	// The result is held in the cache rather than in this hook's state, so a window that has *already* joined —
	// one that just created the conference on the start screen — finds it there and goes straight into the call
	// instead of asking again.
	const { data } = useQuery({
		queryKey: videoConferenceQueryKeys.join(callId),
		queryFn: async () => joinConference({ callId, state: {} }),
		enabled: false,
	});

	const {
		mutate: join,
		isPending,
		error,
	} = useMutation({
		mutationFn: async ({ state, name }: { state: CallPreferences; name?: string }) => {
			// Naming is not worth failing the join over: if it doesn't take, the toast says so and the user still
			// gets the call, which is what they actually asked for.
			if (name && name !== currentName) {
				try {
					await renameConference({ callId, title: name });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			}

			return joinConference({ callId, state });
		},
		onSuccess: (joined) => {
			queryClient.setQueryData(videoConferenceQueryKeys.join(callId), joined);
			// Joining changes our own membership, and the broadcast announcing it can beat the stream subscription
			// being established — which left the members list showing us as absent until something else moved.
			void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
		},
	});

	return {
		call: {
			// Who is associated with the call and where each of them stands — the call window uses it to tell
			// "still ringing" from "nobody is coming".
			members,
			/** Only a direct call rang a particular person, so only there does ringing again mean anything. */
			canRing: info?.type === 'direct',
			/** What the call is called: its own name if it has one, otherwise the room it belongs to. */
			name: currentName,
			/**
			 * Naming a call is the creator's to do, and only a group call has a name of its own — a direct call is
			 * named after the other person, per viewer.
			 */
			canRename: info?.type === 'videoconference' && info.createdBy._id === uid,
			/** Which devices the provider can actually be told about, which is all the preflight offers. */
			capabilities: info?.capabilities ?? {},
			/**
			 * A direct call this user placed whose other side has not been asked to answer yet — entering the call
			 * is what calls them, so the preflight says so rather than pretending they are already ringing.
			 */
			placing:
				info?.type === 'direct' &&
				info.createdBy._id === uid &&
				members.some((member) => member._id !== uid && isUnaskedConferenceMember(member)),
		} as const,
		room: {
			rid: info?.discussionRid || info?.rid,
			loading: isInfoPending,
			error: infoError,
			chatAccess,
		} as const,
		conference: {
			url: data?.url ? getConferenceCallUrl(data.url) : undefined,
			loading: isPending,
			error,
			join,
		} as const,
	};
};
