import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import { MediaCallRoomActivity, usePeekMediaSessionState, usePeekMediaSessionPeerInfo } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';

const isMediaCallRoom = (room: IRoom, peerInfo?: PeerInfo) => {
	if (!peerInfo || 'number' in peerInfo) {
		return false;
	}
	if (!isDirectMessageRoom(room)) {
		return false;
	}
	if (room.uids?.length !== 2) {
		return false;
	}

	return room.uids.includes(peerInfo.userId);
};

type MediaCallRoomProps = {
	children: ReactNode;
};

const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const room = useRoom();

	const screenShareEnabled = useSetting('VoIP_TeamCollab_Screen_Sharing_Enabled', true);

	if (!screenShareEnabled) {
		return children;
	}

	if (state !== 'ongoing' || !isMediaCallRoom(room, peerInfo)) {
		return children;
	}

	return <MediaCallRoomActivity>{children}</MediaCallRoomActivity>;
};

export default memo(MediaCallRoom);
