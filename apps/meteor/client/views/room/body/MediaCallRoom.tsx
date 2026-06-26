import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import { MediaCallRoomActivity, usePeekMediaSessionState, usePeekMediaSessionPeerInfo } from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';

const isSameList = (list1: string[], list2: string[]): boolean => {
	for (const item of list1) {
		if (!list2.includes(item)) {
			return false;
		}
	}
	for (const item of list2) {
		if (!list1.includes(item)) {
			return false;
		}
	}
	return true;
};

const isMediaCallRoom = (room: IRoom, peerInfo?: PeerInfo, myUserId?: string) => {
	if (!myUserId) {
		return false;
	}
	if (!peerInfo || !('userId' in peerInfo) || !peerInfo.userId) {
		return false;
	}
	if (!isDirectMessageRoom(room) || !room.uids?.length) {
		return false;
	}

	return isSameList([myUserId, peerInfo.userId], room.uids);
};

type MediaCallRoomProps = {
	children: ReactNode;
};

const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const userId = useUserId();
	const room = useRoom();

	if (state !== 'ongoing' || !isMediaCallRoom(room, peerInfo, userId)) {
		return children;
	}

	return <MediaCallRoomActivity>{children}</MediaCallRoomActivity>;
};

export default memo(MediaCallRoom);
