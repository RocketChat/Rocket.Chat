import { IRoom, IUser } from '@rocket.chat/core-typings';

import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';
import { matrixBridge } from '../bridge';

interface ICreateRoomResult {
	rid: string;
	mri: string;
}

export const create = async (user: IUser, room: IRoom): Promise<ICreateRoomResult> => {
	// Check if this room already exists (created by another method)
	// and if so, ignore the callback
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(room._id);
	if (roomMatrixId) {
		return { rid: room._id, mri: roomMatrixId };
	}

	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(user._id);

	if (!userMatrixId) {
		throw new Error(`Could not find user matrix id for ${user._id}`);
	}

	const intent = matrixBridge.getInstance().getIntent(userMatrixId);

	const roomName = `@${room.name}`;

	// Create the matrix room
	const matrixRoom = await intent.createRoom({
		createAsClient: true,
		options: {
			name: roomName,
			topic: room.topic,
			visibility: room.t === 'p' ? 'invite' : 'public',
			preset: room.t === 'p' ? 'private_chat' : 'public_chat',
		},
	});

	// Add to the map
	MatrixBridgedRoom.insert({ rid: room._id, mri: matrixRoom.room_id });

	// Add our user TODO: Doing this I think is un-needed since our user is the creator of the room.  With it in.. there were errors
	// await intent.invite(matrixRoom.room_id, userMatrixId);

	return { rid: room._id, mri: matrixRoom.room_id };
};
