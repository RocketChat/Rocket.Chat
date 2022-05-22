import { MatrixBridgedUser, MatrixBridgedRoom, Users, Rooms } from '../../../models/server';
import { addUserToRoom, createRoom, removeUserFromRoom } from '../../../lib/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { AddMemberToRoomMembership } from '../definitions/IMatrixEventContent/IMatrixEventContentAddMemberToRoom';
import { setRoomJoinRules } from './setRoomJoinRules';
import { setRoomName } from './setRoomName';
import { addToQueue } from '../queue';
import { matrixClient } from '../matrix-client';

const ensureRoom = async (
	matrixRoomId: string,
	roomId: string,
	username: string,
	roomState?: IMatrixEvent<MatrixEventType>[],
): Promise<string> => {
	const room = await Rooms.findOneById(roomId);
	// If the room does not exist, create it
	if (!room) {
		// Create temp room name
		const roomName = `Federation-${matrixRoomId.split(':')[0].replace('!', '')}`;

		// @ts-ignore TODO: typing of legacy functions
		const { rid: createdRoomId } = createRoom('c', roomName, username);

		roomId = createdRoomId;

		MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId });

		// TODO: this should be better
		/* eslint-disable no-await-in-loop */
		for (const state of roomState || []) {
			switch (state.type) {
				case 'm.room.create':
					continue;
				case 'm.room.join_rules': {
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/camelcase
					await setRoomJoinRules({ room_id: roomId, ...state });

					break;
				}
				case 'm.room.name': {
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/camelcase
					await setRoomName({ room_id: roomId, ...state });

					break;
				}
				case 'm.room.member': {
					// @ts-ignore
					if (state.content.membership === 'join') {
						// @ts-ignore
						// eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/no-use-before-define
						await handleRoomMembership({ room_id: roomId, ...state });
					}

					break;
				}
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	return roomId;
};

export const handleRoomMembership = async (event: IMatrixEvent<MatrixEventType.ROOM_MEMBERSHIP>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		sender: senderMatrixUserId,
		state_key: affectedMatrixUserId,
		content: { membership },
		invite_room_state: roomState,
	} = event;

	// Find the bridged room id
	let roomId = await MatrixBridgedRoom.getId(matrixRoomId);

	// If there is no room id, throw error
	if (!roomId) {
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

	switch (membership) {
		case AddMemberToRoomMembership.JOIN:
			roomId = await ensureRoom(matrixRoomId, roomId, senderUser.username, roomState);

			addUserToRoom(roomId, affectedUser);
			break;
		case AddMemberToRoomMembership.INVITE:
			// Re-run the state first
			if (!roomId) {
				for (const state of roomState || []) {
					// eslint-disable-next-line @typescript-eslint/camelcase,no-await-in-loop
					addToQueue({ ...state, room_id: matrixRoomId });
				}

				addToQueue(event);

				return;
			}

			// If the room exists, then just add the user
			// TODO: this should be a local invite
			addUserToRoom(roomId, affectedUser, senderUser);
			break;
		case AddMemberToRoomMembership.LEAVE:
			removeUserFromRoom(roomId, affectedUser, {
				byUser: senderUser,
			});
			break;
	}
};
