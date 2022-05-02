import { MatrixBridgedRoom, Rooms, Subscriptions } from '../../../models/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';

export const setRoomName = async (event: IMatrixEvent<MatrixEventType.SET_ROOM_NAME>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		content: { name },
	} = event;

	// Normalize room name
	const normalizedName = name.replace('@', '');

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	Rooms.update(
		{ _id: roomId },
		{
			$set: {
				name: normalizedName,
				fname: normalizedName,
				bridged: true, // TODO: this should not be here
			},
		},
	);

	Subscriptions.update(
		{ rid: roomId },
		{
			$set: {
				name: normalizedName,
				fname: normalizedName,
			},
		},
	);
};
