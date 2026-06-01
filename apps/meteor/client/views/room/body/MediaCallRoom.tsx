import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { type PeerInfo, isInternalPeer } from '@rocket.chat/ui-voip';
import {
	MediaCallRoomActivity,
	usePeekMediaSessionState,
	usePeekMediaSessionPeerInfo,
	usePeekMediaSessionHidden,
} from '@rocket.chat/ui-voip';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useRoom } from '../contexts/RoomContext';

const isSameList = (list1: string[], list2: string[]): boolean => {
	const extraList1 = list1.filter((uid) => !list2.includes(uid));
	const extraList2 = list2.filter((uid) => !list1.includes(uid));

	return !extraList1.length && !extraList2.length;
};

const isMediaCallRoom = (room: IRoom, peerInfo?: PeerInfo, myUserId?: string) => {
	if (!myUserId) {
		return false;
	}
	if (!peerInfo || !isInternalPeer(peerInfo)) {
		return false;
	}
	if (!isDirectMessageRoom(room) || !room.uids?.length) {
		return false;
	}

	return isSameList([myUserId, peerInfo.userId], room.uids);
};

export type MediaCallRoomProps = {
	children: ReactNode;
};

const MediaCallRoom = ({ children }: MediaCallRoomProps) => {
	const state = usePeekMediaSessionState();
	const hidden = usePeekMediaSessionHidden();
	const peerInfo = usePeekMediaSessionPeerInfo();
	const userId = useUserId();
	const room = useRoom();

	if (hidden || state !== 'ongoing' || !isMediaCallRoom(room, peerInfo, userId)) {
		return children;
	}

	return <MediaCallRoomActivity>{children}</MediaCallRoomActivity>;
};

export default memo(MediaCallRoom);
