import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '../../../models/server';
import { addUserToRoom, removeUserFromRoom } from '../../../lib/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { AddMemberToRoomMembership } from '../definitions/IMatrixEventContent/IMatrixEventContentAddMemberToRoom';
import { matrixClient } from '../matrix-client';
import { processFirstAccessFromExternalServer } from './createRoom';

const extractServerNameFromMatrixUserId = (matrixRoomId = ''): string => matrixRoomId.split(':')[1];

const addUserToRoomAsync = async (roomId: string, affectedUser: IUser, senderUser?: IUser): Promise<void> => {
	new Promise((resolve) => resolve(addUserToRoom(roomId, affectedUser as any, senderUser as any)));
};

export const handleRoomMembership = async (event: IMatrixEvent<MatrixEventType.ROOM_MEMBERSHIP>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		sender: senderMatrixUserId,
		state_key: affectedMatrixUserId,
		content: { membership, is_direct: isDirect = false },
		invite_room_state: roomState,
	} = event;

	// Find the bridged room id
	let roomId = await MatrixBridgedRoom.getId(matrixRoomId);
	const fromADifferentServer =
		extractServerNameFromMatrixUserId(senderMatrixUserId) !== extractServerNameFromMatrixUserId(affectedMatrixUserId);

	// If there is no room id, throw error
	if (!roomId && !fromADifferentServer) {
		throw new Error(`Could not find room with matrixRoomId: ${matrixRoomId}`);
	}

	// Find the sender user
	const senderUserId = await MatrixBridgedUser.getId(senderMatrixUserId);
	let senderUser = await Users.findOneById(senderUserId);
	// If the sender user does not exist, it means we need to create it
	if (!senderUser) {
		const { uid } = await matrixClient.user.createLocal(senderMatrixUserId);

		senderUser = Users.findOneById(uid);
	}

	// Find the affected user
	const affectedUserId = await MatrixBridgedUser.getId(affectedMatrixUserId);
	let affectedUser = await Users.findOneById(affectedUserId);
	// If the affected user does not exist, it means we need to create it
	if (!affectedUser) {
		const { uid } = await matrixClient.user.createLocal(affectedMatrixUserId);

		affectedUser = Users.findOneById(uid);
	}

	if (!roomId && fromADifferentServer) {
		roomId = await processFirstAccessFromExternalServer(
			matrixRoomId,
			senderMatrixUserId,
			affectedMatrixUserId,
			senderUser,
			affectedUser,
			isDirect,
			roomState as IMatrixEvent<MatrixEventType>[],
		);
	}

	if (!roomId) {
		return;
	}

	switch (membership) {
		case AddMemberToRoomMembership.JOIN:
			await addUserToRoomAsync(roomId, affectedUser);
			break;
		case AddMemberToRoomMembership.INVITE:
			// TODO: this should be a local invite
			await addUserToRoomAsync(roomId, affectedUser, senderUser);
			break;
		case AddMemberToRoomMembership.LEAVE:
			await removeUserFromRoom(roomId, affectedUser, {
				byUser: senderUser,
			});
			break;
	}
};
