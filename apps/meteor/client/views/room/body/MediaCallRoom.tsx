import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import {
	MediaCallRoomActivity,
	useMediaCallInstance,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionFeatures,
} from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo, useMemo } from 'react';

import LiveKitMediaCallProvider from './GroupCallView/LiveKitMediaCallProvider';
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
 *  - 1:1 DM call (existing): MediaCallRoomActivity with the default session-driven provider
 *  - Group call (new, session-tracked): MediaCallRoomActivity with the LiveKit-driven provider
 *  - No call: pass-through
 */
const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const features = usePeekMediaSessionFeatures();
	const room = useRoom();
	const { instance: session } = useMediaCallInstance();

	const screenShareEnabled = features.includes('screen-share');

	// Group-call detection: the session has a main call whose rid matches this
	// room. Set by Session.joinGroupCall via bootstrapAsGroupCall.
	const isGroupCallHere = useMemo(() => {
		if (state !== 'ongoing' || !session) return false;
		const call = session.getState(false)?.call as any;
		return Boolean(call && call.rid === room?._id);
	}, [state, session, room?._id]);

	if (isGroupCallHere) {
		return <MediaCallRoomActivity Provider={LiveKitMediaCallProvider}>{children}</MediaCallRoomActivity>;
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
