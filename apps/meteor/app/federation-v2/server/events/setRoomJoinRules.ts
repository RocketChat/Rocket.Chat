import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { Rooms, Subscriptions } from '../../../models/server/raw';
import { MatrixBridgedRoom } from '../../../models/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { SetRoomJoinRules } from '../definitions/IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';

export const setRoomJoinRules = async (event: IMatrixEvent<MatrixEventType.SET_ROOM_JOIN_RULES>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		content: { join_rule: joinRule },
	} = event;

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);
	if (!roomId) {
		return;
	}

	const localRoom = await Rooms.findOneById(roomId);

	if (!localRoom || localRoom?.t === RoomType.DIRECT_MESSAGE) {
		return;
	}

	let type;

	switch (joinRule) {
		case SetRoomJoinRules.INVITE:
			type = RoomType.PRIVATE_GROUP;
			break;
		case SetRoomJoinRules.JOIN:
		default:
			type = RoomType.CHANNEL;
	}

	await Rooms.update(
		{ _id: roomId },
		{
			$set: {
				t: type,
			},
		},
	);

	await Subscriptions.update(
		{ rid: roomId },
		{
			$set: {
				t: type,
			},
		},
		{ multi: true },
	);
};
