import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { sendMessage } from '../../../lib/server';
import { Rooms } from '../../../models/server/raw';

export const sendMessageAsync = async (user: any, msg: any, room: any): Promise<void> =>
	new Promise((resolve) => resolve(sendMessage(user, msg, room)));

export const handleSendMessage = async (event: IMatrixEvent<MatrixEventType.SEND_MESSAGE>): Promise<void> => {
	const { room_id: matrixRoomId, sender } = event;

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);
	if (!roomId) {
		return;
	}

	// Find the bridged user id
	const userId = await MatrixBridgedUser.getId(sender);

	// Find the user
	const user = await Users.findOneById(userId);

	const room = await Rooms.findOneById(roomId);

	await sendMessageAsync(user, { msg: event.content.body }, room);
};
