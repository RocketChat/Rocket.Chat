import type { IRoom, IUser, RoomType } from '@rocket.chat/core-typings';

import { Rooms } from '../../../app/models/server';

export const getRoomData = (
	roomId: IRoom['_id'],
	ownUserId?: IUser['_id'],
):
	| {
			roomId: string;
			roomName: string;
			userId: string | undefined;
			exportedCount: number;
			status: string;
			type: RoomType;
			targetFile: string;
	  }
	| Record<string, never> => {
	const roomData: IRoom = Rooms.findOneById(roomId);

	if (!roomData) {
		return {};
	}

	const roomName = roomData.name && roomData.t !== 'd' ? roomData.name : roomId;
	const userId = roomData.t === 'd' ? roomData.uids?.find((uid) => uid !== ownUserId) : undefined;

	return {
		roomId,
		roomName,
		userId,
		exportedCount: 0,
		status: 'pending',
		type: roomData.t,
		targetFile: '',
	};
};
