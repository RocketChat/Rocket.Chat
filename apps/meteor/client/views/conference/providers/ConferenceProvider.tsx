import type { ConferenceContextValue, ConferenceFailure } from '@rocket.chat/ui-conference';
import { ConferenceContext } from '@rocket.chat/ui-conference';
import { useEndpoint, usePermission, useSetting, useUserId, useUserPreference, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { ReactiveUserStatus } from '../../../components/UserStatus';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';
import { isRefusal } from '../../../lib/utils/isRefusal';
import { useUnreadDisplay } from '../../../sidebar/hooks/useUnreadDisplay';
import PageLoading from '../../root/PageLoading';
import ConferenceChat from '../ConferenceChat';
import ConferencePageError from '../ConferencePageError';
import ConferenceUnauthorizedPage from '../ConferenceUnauthorizedPage';
import ConferenceUserPicker from '../components/ConferenceUserPicker';
import { useConferenceEmbedded } from '../hooks/useConferenceEmbedded';
import { useConferencePresenceLease } from '../hooks/useConferencePresenceLease';
import { useConferenceSubscription } from '../hooks/useConferenceSubscription';
import { useConfinedNavigation } from '../hooks/useConfinedNavigation';
import { useLeaveConferenceOnClose } from '../hooks/useLeaveConferenceOnClose';

const emptyUnreadData = { alert: false, userMentions: 0, unread: 0, groupMentions: 0 } as const;

/**
 * Why a read failed, reduced to the one distinction the window acts on.
 *
 * A refusal is an answer about the call — it is gone, or was never this reader's. Anything else is the server
 * not having been reached, which says nothing about the call at all.
 */
const failureFor = (error: unknown): ConferenceFailure | undefined =>
	error ? { kind: isRefusal(error) ? 'refused' : 'unreachable' } : undefined;

/**
 * Everything the conference window is told, answered from where the truth actually lives.
 *
 * The window itself reaches no server and knows no route: this is the whole of the wiring between it and the
 * workspace — the reads, the five things that can be done to a call, the effects that keep a participant
 * counted as present, and the three parts of the window the product has to build itself.
 */
const ConferenceProvider = ({ callId, children }: { callId: string; children: ReactNode }) => {
	const { call, room, conference } = useConferenceEmbedded(callId);
	const queryClient = useQueryClient();

	const ring = useEndpoint('POST', '/v1/video-conference.ring');
	const shareChatEndpoint = useEndpoint('POST', '/v1/video-conference.share-chat');
	const addParticipantsEndpoint = useEndpoint('POST', '/v1/video-conference.add-participants');

	// Which thread is open over the chat, rather than the thread itself. It lives here because navigation can
	// open one too — a message link followed inside the call window is confined to it, and landing on a thread is
	// how that arrives.
	const [openThread, setOpenThread] = useState<string>();
	useConfinedNavigation({ onOpenThread: room.tmid ? undefined : setOpenThread });

	const { leaveNow } = useLeaveConferenceOnClose(callId, conference.departure);

	useConferencePresenceLease(callId, conference.joined);
	useConferenceSubscription(room.rid);

	// Who is reading, and what the workspace and their preferences have already settled. Read once here rather
	// than by each row that needs one: the logged-in user, a setting, a preference and a permission are all the
	// application's to answer, and the window is meant to render without one.
	// `null` rather than `undefined` where nobody is logged in: the window has one way of saying that.
	const uid = useUserId() ?? null;
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const displayAvatars = useUserPreference<boolean>('displayAvatars', true) ?? true;
	// `video-conference.ring` refuses without it, so a caller who lacks it is offered nothing to press rather
	// than a button that can only fail.
	const canRingUsers = usePermission('videoconf-ring-users');

	// What the chat button's mark says, worked out here because which unread rules a room honours — and whether
	// its reader asked not to be told about it at all — is the product's business rather than the window's.
	const subscription = useUserSubscription(room.rid ?? '');
	const { showUnread, unreadCount, unreadVariant, unreadTitle } = useUnreadDisplay(subscription ?? emptyUnreadData);

	const thread = useMemo(
		() => ({
			tmid: openThread,
			open: (tmid: string) => setOpenThread(tmid),
			close: () => setOpenThread(undefined),
		}),
		[openThread],
	);

	const actions = useMemo(
		(): ConferenceContextValue['actions'] => ({
			join: (preferences, name) => conference.join({ state: preferences, name }),
			leave: leaveNow,
			ringMember: async (memberId) => {
				await ring({ callId, userId: memberId });
			},
			shareChat: async (mode) => {
				await shareChatEndpoint({ callId, mode });
				// The server broadcasts the change to every participant, but the one who asked for it should not
				// wait for the round trip to see their own notice go away.
				void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
			},
			addParticipants: async (users, ringThem) => {
				const { added } = await addParticipantsEndpoint({ callId, users, ring: ringThem });

				// Read the call again rather than waiting to be told about our own doing: the window is watching the
				// conference for changes other people make, and leaning on that for a change made *here* left the
				// members panel — the very panel this was opened from — still listing who was in the call before.
				if (added.length) {
					void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
				}

				return { added: added.length };
			},
		}),
		[addParticipantsEndpoint, callId, conference, leaveNow, queryClient, ring, shareChatEndpoint],
	);

	const renderMemberStatus = useCallback((uid: string) => <ReactiveUserStatus uid={uid} />, []);

	const renderUserPicker = useCallback(
		(props: Parameters<NonNullable<ConferenceContextValue['slots']['renderUserPicker']>>[0]) => (
			<ConferenceUserPicker {...props} rid={room.rid} />
		),
		[room.rid],
	);

	const value = useMemo(
		(): ConferenceContextValue => ({
			callId,
			call,
			room: {
				rid: room.rid,
				tmid: room.tmid,
				name: room.name,
				type: room.type,
				loading: room.loading,
				error: failureFor(room.error),
				retry: () => void room.retry(),
				chatAccess: room.chatAccess,
				unread: {
					count: showUnread ? unreadCount.total : 0,
					// `hideUnreadStatus` is the reader saying they do not want to be told about this room, and the
					// sidebar honours it for exactly this kind of mark — so the dot on the chat button honours it too.
					hasUnseenActivity: Boolean(subscription?.alert) && !subscription?.hideUnreadStatus,
					variant: unreadVariant,
					title: unreadTitle,
				},
			},
			session: {
				url: conference.url,
				embedded: conference.embedded,
				joined: conference.joined,
				loading: conference.loading,
				error: failureFor(conference.error),
				retry: conference.retry,
			},
			actions,
			slots: {
				// Built here, and rendered inside this very provider — so it reads the call from context rather than
				// being handed a second copy of it through props.
				chat: <ConferenceChat />,
				renderMemberStatus,
				renderUserPicker,
				loading: <PageLoading />,
				unauthorized: <ConferenceUnauthorizedPage />,
				joinRefused: <ConferencePageError />,
			},
			viewer: { uid, useRealName, displayAvatars, canRingUsers },
			thread,
		}),
		[
			actions,
			call,
			callId,
			conference,
			canRingUsers,
			displayAvatars,
			renderMemberStatus,
			renderUserPicker,
			room,
			uid,
			useRealName,
			showUnread,
			subscription,
			thread,
			unreadCount.total,
			unreadTitle,
			unreadVariant,
		],
	);

	return <ConferenceContext.Provider value={value}>{children}</ConferenceContext.Provider>;
};

export default ConferenceProvider;
