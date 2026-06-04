import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import {
	MediaCallRoomActivity,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionFeatures,
} from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useLiveKitVideoConf } from '../../videoConference/livekit/LiveKitVideoConfContext';
import { useRoom } from '../contexts/RoomContext';

const isOneToOneDirectCallRoom = (room: IRoom, peerInfo?: PeerInfo) => {
	if (!peerInfo || 'number' in peerInfo) return false;
	if (!isDirectMessageRoom(room)) return false;
	if (room.uids?.length !== 2) return false;
	return room.uids.includes(peerInfo.userId);
};

type MediaCallRoomProps = {
	children: ReactNode;
};

/**
 * Decides whether to render the call activity (top-half call view + chat below)
 * in the current room. Three modes:
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
	const features = usePeekMediaSessionFeatures();
	const room = useRoom();
	const { activeCall: activeLkCall } = useLiveKitVideoConf();

	const screenShareEnabled = features.includes('screen-share');

	// Group-call detection: the LiveKit context owns the active LK call's rid
	// (set by useGroupCallRoomAction.joinCall). Decoupled from VoIP entirely.
	const isGroupCallHere = activeLkCall?.rid === room?._id;

	if (isGroupCallHere) {
		return <MediaCallRoomActivity provider={null}>{children}</MediaCallRoomActivity>;
	}

	if (!screenShareEnabled) {
		return <>{children}</>;
	}

	if (state !== 'ongoing' || !isOneToOneDirectCallRoom(room, peerInfo)) {
		return <>{children}</>;
	}

	return <MediaCallRoomActivity>{children}</MediaCallRoomActivity>;
};

export default memo(MediaCallRoom);
