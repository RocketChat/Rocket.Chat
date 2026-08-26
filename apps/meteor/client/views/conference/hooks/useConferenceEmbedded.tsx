import type { IVideoConferenceUser, VideoConferenceChatAccess } from '@rocket.chat/core-typings';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting, useStream, useToastMessageDispatch, useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { CallPreferences } from './useCallPreferences';
import { conferenceNameFor } from '../../../../lib/videoConference/conferenceName';
import { isUnaskedConferenceMember } from '../../../../lib/videoConference/memberStatus';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';
import { mapVideoConfUserFromApi } from '../../../lib/utils/mapVideoConfUserFromApi';

/**
 * A member of the call, as this window holds them: who they are, and where they stand with the call.
 *
 * Narrower than `IVideoConferenceUser` on purpose — the avatar etag and the `ts` are of no interest to anything
 * rendering a member, and leaving them out keeps the fixtures honest about what the UI actually reads.
 */
export type ConferenceMember = Pick<
	IVideoConferenceUser,
	'_id' | 'username' | 'name' | 'joined' | 'declined' | 'declinedAt' | 'leftAt' | 'ringingAt'
>;

/** Chat access with the members it concerns resolved, since the UI has to name the people it is about. */
export type ConferenceChatAccess = VideoConferenceChatAccess & {
	members: ConferenceMember[];
};

/** Adds the viewer's display name to the provider's URL, so they arrive named rather than anonymous. */
const withDisplayName = (callUrl: string, displayName?: string): string => {
	if (!displayName) {
		return callUrl;
	}

	const url = new URL(callUrl);
	url.searchParams.set('name', displayName);
	return url.toString();
};

export const useConferenceEmbedded = (callId: string) => {
	const joinConference = useEndpoint('POST', '/v1/video-conference.join');
	const renameConference = useEndpoint('POST', '/v1/video-conference.rename');
	const dispatchToastMessage = useToastMessageDispatch();
	const getConferenceInfo = useEndpoint('GET', '/v1/video-conference.info');
	const subscribeToVideoConference = useStream('video-conference');
	const queryClient = useQueryClient();
	const uid = useUserId();
	// The provider is told who is arriving, so the name in the call is the one the workspace shows.
	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });

	// Matches the EE setting's own default, so an unset workspace behaves the same on both sides.
	const chatMode = useSetting('VideoConf_Persistent_Chat_Mode', 'main_room') as 'thread' | 'main_room';

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

	/**
	 * What the call is called. A group call with a title uses that title. A DM or GDM call lists every
	 * participant's name so each viewer sees who the call is with at a glance. Everything else falls back
	 * to the room name.
	 */
	const currentName = useMemo(() => {
		if (!info) return '';

		const isDM = info.type === 'direct' || info.chatAccess.type === 'd';

		// A group conference with an explicit title — but not in a DM, where the "title" is the
		// subscription name the server defaulted to, not a user-chosen name.
		if (!isDM && info.type === 'videoconference' && 'title' in info && info.title) {
			return info.title;
		}

		// DM and GDM calls: list everyone in the call so each viewer sees who it is with.
		// `info.type === 'direct'` covers 1:1 DMs (including when the chat lives in a discussion
		// room whose type is 'p'); `chatAccess.type === 'd'` catches GDM calls.
		if (isDM) {
			const names = info.users.map((u) => u.name || u.username).filter(Boolean);
			// When the other party isn't in `users` yet (ring unchecked, or they haven't joined),
			// the title carries their name — include it so both sides appear.
			const title = 'title' in info ? info.title : undefined;
			if (title && !names.includes(title)) {
				names.push(title);
			}
			if (names.length > 0) {
				return names.join(', ');
			}
		}

		return conferenceNameFor({ ...info, ...('title' in info ? { title: undefined } : {}) }, uid) || info.chatAccess.name;
	}, [info, uid]);

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
			/** Whether the conference has ended and can no longer be joined. */
			ended: info ? 'endedAt' in info && !!info.endedAt : false,
			/** What the call is called: its own name if it has one, otherwise the room it belongs to. */
			name: currentName,
			/** When the conference was created — serves as the timer's start point. */
			createdAt: info?.createdAt ? new Date(info.createdAt) : undefined,
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
			tmid: !info?.discussionRid && chatMode === 'thread' ? info?.messages.started : undefined,
			name: info?.chatAccess.name,
			type: info?.chatAccess.type,
			loading: isInfoPending,
			error: infoError,
			chatAccess,
		} as const,
		conference: {
			url: data?.url ? withDisplayName(data.url, displayName) : undefined,
			/**
			 * A provider that runs the call inside Rocket.Chat rather than at a URL of its own. The server says so
			 * by answering the join with an empty url — there is no page to send anyone to — so that is what this
			 * reads, rather than a second capability the two sides would have to keep in step.
			 */
			embedded: data ? data.url === '' : false,
			/** Whether this window has joined yet, which for an embedded provider is all there is to wait for. */
			joined: !!data,
			loading: isPending,
			error,
			join,
		} as const,
	};
};
