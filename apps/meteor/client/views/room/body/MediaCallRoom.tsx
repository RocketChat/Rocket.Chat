// import { Box } from '@rocket.chat/fuselage';
import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import { MediaCallRoom as MediaCallRoomComponent, useMediaCallContext } from '@rocket.chat/ui-voip';
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
	if (!room.uids || room.uids.length !== 2) {
		return false;
	}

	return room.uids.includes(peerInfo.userId);
};

const MediaCallRoom = ({ body }: { body: ReactNode }) => {
	const { peerInfo, state } = useMediaCallContext();
	const room = useRoom();
	console.log({ room, peerInfo });
	if (state !== 'ongoing' || !isMediaCallRoom(room, peerInfo)) {
		return body;
	}

	return <MediaCallRoomComponent body={body} />;
};

export default memo(MediaCallRoom);
