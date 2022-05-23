import { MatrixBridgedRoom, Rooms } from '../../../models/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';

export const setRoomTopic = async (event: IMatrixEvent<MatrixEventType.SET_ROOM_TOPIC>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		content: { topic },
	} = event;

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	Rooms.update(
		{ _id: roomId },
		{
			$set: {
				description: topic,
			},
		},
	);
};
