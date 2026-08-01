import { Box } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import {
	useLanguage,
	useRouteParameter,
	useSearchParameter,
	useUser,
	useUserAvatarPath,
	useUserSubscription,
} from '@rocket.chat/ui-contexts';
import type { PreFlightJoinPreferences } from '@rocket.chat/ui-voip';
import { CallLeftScreen, MediaCallRoomSection, PreFlight, useMediaCallView } from '@rocket.chat/ui-voip';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import PageLoading from '../root/PageLoading';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLiveKitVideoConf } from '../videoConference/livekit/LiveKitVideoConfContext';

const LiveKitConferenceEmbeddedPage = () => {
	const { t } = useTranslation();
	const language = useLanguage();

	const callId = useRouteParameter('id') ?? '';
	const micParam = useSearchParameter('mic');
	const camParam = useSearchParameter('cam');

	const initialMic = micParam !== 'false';
	const initialCam = camParam === 'true';

	const { joinCall: joinEmbeddedCall, leaveCall } = useLiveKitVideoConf();
	const { sessionState } = useMediaCallView();

	useConfinedNavigation();

	// Pre-flight state: the join REST call (which marks this user as joined
	// server-side) and the LK connection only happen after the user clicks
	// Join. Until then the window shows the pre-flight screen.
	const [joinPreferences, setJoinPreferences] = useState<PreFlightJoinPreferences | null>(null);
	const joinRequested = joinPreferences !== null;
	const [joinNonce, setJoinNonce] = useState(0);

	const restPreferences = useMemo(
		() => ({ mic: joinPreferences?.mic ?? initialMic, cam: joinPreferences?.cam ?? initialCam }),
		[joinPreferences, initialMic, initialCam],
	);

	const { room, call, conference } = useConferenceEmbedded(callId, restPreferences, { join: joinRequested, joinNonce });

	// "You left" state: the window survives for ~10s with a Rejoin action,
	// then closes itself (never a modal — edge states live in the window).
	const [leftCall, setLeftCall] = useState(false);
	const hasJoined = useRef(false);
	const previousSessionState = useRef(sessionState.state);

	const [showChat, setShowChat] = useState(false);
	const toggleChat = useCallback(() => setShowChat((prev) => !prev), []);
	const closeChat = useCallback(() => setShowChat(false), []);

	useEffect(() => {
		if (previousSessionState.current === 'ongoing' && sessionState.state === 'closed') {
			setLeftCall(true);
		}
		previousSessionState.current = sessionState.state;
	}, [sessionState.state]);

	const closeWindow = useCallback(() => {
		leaveCall();
		if (window.videoCallWindow?.close) {
			window.videoCallWindow.close();
			return;
		}
		window.close();
	}, [leaveCall]);

	const handleRejoin = useCallback(() => {
		hasJoined.current = false;
		setLeftCall(false);
		setJoinNonce((nonce) => nonce + 1);
	}, []);

	useEffect(() => {
		if (!joinRequested || hasJoined.current) {
			return;
		}

		if (sessionState.state === 'ongoing') {
			return;
		}

		if (conference.loading || room.loading || !room.rid || conference.providerName !== 'livekit') {
			return;
		}

		hasJoined.current = true;
		joinEmbeddedCall({
			callId,
			rid: room.rid,
			preferences: {
				mic: joinPreferences?.mic,
				cam: joinPreferences?.cam,
				audioDeviceId: joinPreferences?.audioDeviceId,
				videoDeviceId: joinPreferences?.videoDeviceId,
			},
		});
	}, [
		callId,
		conference.loading,
		conference.providerName,
		joinEmbeddedCall,
		joinPreferences,
		joinRequested,
		room.loading,
		room.rid,
		sessionState.state,
	]);

	const user = useUser();
	const displayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const getUserAvatarPath = useUserAvatarPath();
	const ownUser = useMemo(
		() => ({
			id: user?._id || 'local',
			displayName: displayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		}),
		[displayName, getUserAvatarPath, user?._id],
	);

	const subscription = useUserSubscription(room.rid ?? '');
	const unreadCount = subscription?.unread ?? 0;

	// Who's currently in the call: LiveKit tracks joins/leaves in
	// `participants`; `users` (everyone who ever joined) is the fallback.
	const activeParticipantNames = useMemo(() => {
		const others = call.participants
			? call.participants.filter((p) => !p.leftAt && p.id !== user?._id).map((p) => p.displayName || p.username || '')
			: call.users.filter((u) => u._id !== user?._id).map((u) => u.name || u.username);
		return others.filter(Boolean);
	}, [call.participants, call.users, user?._id]);

	const nameList = useMemo(() => {
		try {
			return new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(activeParticipantNames);
		} catch {
			return activeParticipantNames.join(', ');
		}
	}, [activeParticipantNames, language]);

	// DM caller variant: nobody in the call yet and it's a direct call — the
	// window is about to become the ringing window (see "DM call flow").
	const isDirect = call.type === 'direct';
	const dmPeerName = subscription?.fname || subscription?.name || '';
	const isDmCaller = isDirect && activeParticipantNames.length === 0;

	const statusText = (() => {
		if (joinRequested) {
			return activeParticipantNames.length > 0 ? t('Connecting_you_to_users', { users: nameList }) : t('Joining_call');
		}
		if (isDmCaller) {
			return t('User_will_be_notified_when_you_start_the_call', { user: dmPeerName });
		}
		if (activeParticipantNames.length === 0) {
			return t('No_one_else_is_here_yet');
		}
		if (activeParticipantNames.length === 1) {
			return t('User_is_in_this_call', { user: nameList });
		}
		return t('Users_are_in_this_call', { users: nameList });
	})();

	const joinLabel = isDmCaller && dmPeerName ? t('Call_user', { user: dmPeerName }) : t('Join_call');

	// Role policy forbids devices entirely: pre-flight hides the device strip
	// and explains that the call is listen-only.
	const devicesForbidden = call.capabilities ? call.capabilities.mic === false && call.capabilities.cam === false : false;

	const providerName = call.providerName ?? conference.providerName;

	if ((joinRequested && conference.error) || (providerName && providerName !== 'livekit')) {
		return <ConferencePageError />;
	}

	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (room.loading || !room.rid) {
		return <PageLoading />;
	}

	if (leftCall) {
		return (
			<Box bg='surface-light' w='full' h='full' display='flex' overflow='hidden'>
				<CallLeftScreen participantCount={activeParticipantNames.length} onRejoin={handleRejoin} onClose={closeWindow} />
			</Box>
		);
	}

	if (sessionState.state !== 'ongoing') {
		return (
			<Box bg='surface-light' w='full' h='full' display='flex' overflow='hidden'>
				<PreFlight
					statusText={statusText}
					helperText={devicesForbidden ? t('Calls_are_listen_only_for_your_role') : undefined}
					joinLabel={joinLabel}
					joining={joinRequested}
					devicesForbidden={devicesForbidden}
					initialMic={initialMic}
					initialCam={initialCam}
					user={ownUser}
					onJoin={setJoinPreferences}
				/>
			</Box>
		);
	}

	return (
		<Box bg='surface-light' w='full' h='full' display='flex' overflow='hidden'>
			<MediaCallRoomSection showChat={showChat} onToggleChat={toggleChat} user={ownUser} unreadCount={unreadCount}>
				<ConferenceChat rid={room.rid} loading={room.loading} onClose={closeChat} />
			</MediaCallRoomSection>
		</Box>
	);
};

export default LiveKitConferenceEmbeddedPage;
