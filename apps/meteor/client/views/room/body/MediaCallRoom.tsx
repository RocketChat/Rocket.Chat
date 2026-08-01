import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import {
	MediaCallRoomActivity,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionFeatures,
} from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';

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
 * in the current room. Two modes:
 *  - 1:1 DM VoIP call: MediaCallRoomActivity with the session-driven provider
 *  - No call: pass-through
 *
 * LiveKit calls never render in-room: the pop-out /conference/:id window is
 * the call surface and the bottom call bar is the only in-app signifier.
 */
const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const features = usePeekMediaSessionFeatures();
	const room = useRoom();
	const { isEmbedded } = useLayout();

	const screenShareEnabled = features.includes('screen-share');

	// Embedded conference windows already show the call UI in a dedicated
	// panel, so the room should only render the chat stream.
	if (isEmbedded) {
		return <>{children}</>;
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
