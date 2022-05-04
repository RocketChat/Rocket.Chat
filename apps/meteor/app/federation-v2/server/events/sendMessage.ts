// @ts-ignore
import { MatrixBridgedRoom, MatrixBridgedUser, Messages, Users } from '../../../models';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';

export const handleSendMessage = async (event: IMatrixEvent<MatrixEventType.SEND_MESSAGE>): Promise<void> => {
	const { room_id: matrixRoomId, sender } = event;

	// Find the bridged user id
	const userId = await MatrixBridgedUser.getId(sender);

	// Find the user
	const user = await Users.findOneById(userId);

	// Find the bridged room id
	const roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	Messages.createWithTypeRoomIdMessageAndUser('m', roomId, event.content.body, {
		_id: user._id,
		username: user.username,
	});
};
