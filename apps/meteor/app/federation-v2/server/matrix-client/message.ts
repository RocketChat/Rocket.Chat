import { IMessage } from '@rocket.chat/core-typings';

import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';
import { matrixBridge } from '../bridge';

export const send = async (message: IMessage): Promise<IMessage> => {
	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(message.u._id);

	// Retrieve the matrix room
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(message.rid);

	if (!userMatrixId) {
		throw new Error(`Could not find user matrix id for ${message.u._id}`);
	}

	if (!roomMatrixId) {
		throw new Error(`Could not find room matrix id for ${message.rid}`);
	}

	const intent = matrixBridge.getInstance().getIntent(userMatrixId);
	await intent.sendText(roomMatrixId, message.msg || '...not-supported...');

	return message;
};
