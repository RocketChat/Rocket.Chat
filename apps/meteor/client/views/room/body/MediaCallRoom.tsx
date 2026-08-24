import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useCurrentRoutePath, useUserSubscription } from '@rocket.chat/ui-contexts';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import { MediaCallRoomActivity, usePeekMediaSessionState, usePeekMediaSessionPeerInfo } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useUnreadDisplay } from '../../../sidebar/hooks/useUnreadDisplay';
import { useLiveKitVideoConf } from '../../videoConference/livekit/LiveKitVideoConfContext';
import { useRoom } from '../contexts/RoomContext';

const emptyUnreadData = { alert: false, userMentions: 0, unread: 0, groupMentions: 0 } as const;

const isOneToOneDirectCallRoom = (room: IRoom, peerInfo?: PeerInfo) => {
	if (!peerInfo || 'number' in peerInfo) return false;
	if (!isDirectMessageRoom(room)) return false;
	if (room.uids?.length !== 2) return false;
	return room.uids.includes(peerInfo.userId);
};

export type MediaCallRoomProps = {
	children: ReactNode;
};

/**
 * Decides whether to render the call activity (top-half call view + chat below)
 * in the current room.
 *
 * Never in the dedicated call window: that window already shows the call, and the room it renders in its chat
 * panel *is* the call's room — so this would draw a second, fully live copy of the call inside the chat beside
 * the first one.
 *
 * Otherwise, three modes:
 *  - 1:1 DM call: MediaCallRoomActivity with the default session-driven provider
 *  - Group call in this room: MediaCallRoomActivity reading from the app-level
 *    LiveKitVideoConfBridge (mounted in MeteorProvider.tsx). The LK connection
 *    lives above the room router so it survives navigation to other channels —
 *    without that, switching channels mid-call disconnects.
 *  - No call: pass-through
 */
const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const room = useRoom();
	const { activeCall: activeLkCall } = useLiveKitVideoConf();

	const subscription = useUserSubscription(room._id);
	const { showUnread, unreadCount, unreadVariant } = useUnreadDisplay(subscription ?? emptyUnreadData);
	const unread = showUnread ? unreadCount.total : 0;

	// The call window renders this room inside its chat panel; the call itself is already on screen there.
	const inCallWindow = !!useCurrentRoutePath()?.startsWith('/conference/');

	// Group-call detection: the LiveKit context owns the active LK call's rid
	// (set by useGroupCallRoomAction.joinCall). Decoupled from VoIP entirely.
	const isGroupCallHere = activeLkCall?.rid === room?._id;

	if (inCallWindow) {
		return <>{children}</>;
	}

	if (isGroupCallHere) {
		return (
			<MediaCallRoomActivity provider={null} unreadCount={unread} unreadVariant={unreadVariant}>
				{children}
			</MediaCallRoomActivity>
		);
	}

	if (state !== 'ongoing' || !isOneToOneDirectCallRoom(room, peerInfo)) {
		return <>{children}</>;
	}

	return (
		<MediaCallRoomActivity unreadCount={unread} unreadVariant={unreadVariant}>
			{children}
		</MediaCallRoomActivity>
	);
};

export default memo(MediaCallRoom);
