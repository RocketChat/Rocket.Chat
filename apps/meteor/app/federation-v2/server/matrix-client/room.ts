import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';
import { matrixBridge } from '../bridge';
import { Rooms } from '../../../models/server/raw';

interface ICreateRoomResult {
	rid: string;
	mri: string;
}

const parametersForDirectMessagesIfNecessary = (room: IRoom, invitedUserId: string): Record<string, any> => {
	return room.t === RoomType.DIRECT_MESSAGE
		? {
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_direct: true,
				invite: [invitedUserId],
		  }
		: {};
};

export const create = async (inviterUser: IUser, room: IRoom, invitedUserId: string): Promise<ICreateRoomResult> => {
	// Check if this room already exists (created by another method)
	// and if so, ignore the callback
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(room._id);
	if (roomMatrixId) {
		return { rid: room._id, mri: roomMatrixId };
	}

	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(inviterUser._id);

	if (!userMatrixId) {
		throw new Error(`Could not find user matrix id for ${inviterUser._id}`);
	}

	const intent = matrixBridge.getInstance().getIntent(userMatrixId);

	const visibility = room.t === 'p' || room.t === 'd' ? 'invite' : 'public';
	const preset = room.t === 'p' || room.t === 'd' ? 'private_chat' : 'public_chat';

	// Create the matrix room
	const matrixRoom = await intent.createRoom({
		createAsClient: true,
		options: {
			name: room.fname || room.name,
			topic: room.topic,
			visibility,
			preset,
			...parametersForDirectMessagesIfNecessary(room, invitedUserId),
			// eslint-disable-next-line @typescript-eslint/camelcase
			creation_content: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				was_programatically_created: true,
			},
		},
	});
	// Add to the map
	MatrixBridgedRoom.insert({ rid: room._id, mri: matrixRoom.room_id });

	await Rooms.setAsBridged(room._id);

	// Add our user TODO: Doing this I think is un-needed since our user is the creator of the room.  With it in.. there were errors
	// await intent.invite(matrixRoom.room_id, userMatrixId);

	return { rid: room._id, mri: matrixRoom.room_id };
};
