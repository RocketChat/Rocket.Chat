import type { CallPreferences } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useRouteParameter, useSearchParameter, useSetModal, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { MediaCallRoomSection, useMediaCallView } from '@rocket.chat/ui-voip';
import { useEffect, useMemo, useRef, useState } from 'react';

import ConferenceChat from './ConferenceChat';
import ConferenceDisconnectedModal from './ConferenceDisconnectedModal';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import PageLoading from '../root/PageLoading';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLiveKitVideoConf } from '../videoConference/livekit/LiveKitVideoConfContext';

const LiveKitConferenceEmbeddedPage = () => {
	const setModal = useSetModal();

	const callId = useRouteParameter('id') ?? '';
	const micParam = useSearchParameter('mic');
	const camParam = useSearchParameter('cam');

	const preferences = useMemo<CallPreferences>(
		() => ({
			mic: micParam !== 'false',
			cam: camParam === 'true',
		}),
		[micParam, camParam],
	);

	const { joinCall: joinEmbeddedCall, leaveCall } = useLiveKitVideoConf();
	const { sessionState } = useMediaCallView();

	useConfinedNavigation();

	const { room, conference } = useConferenceEmbedded(callId, preferences);

	const [disconnected, setDisconnected] = useState(false);
	const wasConnected = useRef(false);
	const hasJoined = useRef(false);

	useEffect(() => {
		if (sessionState.state === 'ongoing') {
			wasConnected.current = true;
		}

		if (!disconnected && wasConnected.current && sessionState.state === 'closed') {
			setDisconnected(true);
			setModal(
				<ConferenceDisconnectedModal
					onCancel={() => setModal(null)}
					onClose={() => {
						setModal(null);
						leaveCall();
						if (window.videoCallWindow?.close) {
							window.videoCallWindow.close();
							return;
						}
						window.close();
					}}
				/>,
			);
		}
	}, [disconnected, leaveCall, sessionState.state, setModal]);

	useEffect(() => {
		if (hasJoined.current) {
			return;
		}

		if (sessionState.state === 'ongoing') {
			return;
		}

		if (conference.loading || room.loading || !room.rid || conference.providerName !== 'livekit') {
			return;
		}

		hasJoined.current = true;
		joinEmbeddedCall({ callId, rid: room.rid, preferences });
	}, [callId, conference.loading, conference.providerName, joinEmbeddedCall, preferences, room.loading, room.rid, sessionState.state]);

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

	if (conference.error || (conference.providerName && conference.providerName !== 'livekit')) {
		return <ConferencePageError />;
	}

	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (conference.loading || room.loading || !room.rid || (!disconnected && sessionState.state !== 'ongoing')) {
		return <PageLoading />;
	}

	return (
		<Box bg='surface-light' w='full' h='full' display='flex' overflow='hidden'>
			<Box display='flex' flexDirection='column' flexShrink={0} width={400} h='full' borderInlineEndWidth={1} borderColor='stroke-light'>
				<ConferenceChat rid={room.rid} loading={room.loading} />
			</Box>
			<Box flexGrow={1} display='flex' flexDirection='column' position='relative' minWidth={0} minHeight={0}>
				<MediaCallRoomSection showChat={false} onToggleChat={() => undefined} user={ownUser} hideChatToggle />
			</Box>
		</Box>
	);
};

export default LiveKitConferenceEmbeddedPage;
