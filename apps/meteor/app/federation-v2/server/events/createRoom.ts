import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { ICreatedRoom } from '@rocket.chat/core-typings';

import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models/server';
import { Rooms } from '../../../models/server/raw';
import { createRoom } from '../../../lib/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { checkBridgedRoomExists } from '../methods/checkBridgedRoomExists';
import { matrixClient } from '../matrix-client';
import { matrixBridge } from '../bridge';
import { SetRoomJoinRules } from '../definitions/IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';

const removeUselessCharacterFromMatrixRoomId = (matrixRoomId: string): string => {
	const prefixedRoomIdOnly = matrixRoomId.split(':')[0];
	const prefix = '!';

	return prefixedRoomIdOnly?.replace(prefix, '');
};

const generateRoomNameForLocalServer = (matrixRoomId: string, matrixRoomName?: string): string => {
	return matrixRoomName || `Federation-${removeUselessCharacterFromMatrixRoomId(matrixRoomId)}`;
};

const createLocalRoomAsync = async (roomType: RoomType, roomName: string, creator: string): Promise<ICreatedRoom> => {
	return new Promise((resolve) => resolve(createRoom(roomType, roomName, creator) as unknown as ICreatedRoom));
};

const setRoomAsBridged = async (roomId: string): Promise<void> => {
	await Rooms.setAsBridged(roomId);
};

const createBridgedRecordRoom = async (roomId: IRoom['id'], matrixRoomId: string): Promise<void> =>
	new Promise((resolve) => resolve(MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId })));

const createLocalUserIfNecessary = async (matrixUserId: string): Promise<string> => {
	const { uid } = await matrixClient.user.createLocal(matrixUserId);

	return uid;
};

export const getLocalRoomType = (matrixJoinRule: string, matrixRoomIsDirect = false): RoomType => {
	const mapping: Record<string, RoomType> = {
		[SetRoomJoinRules.JOIN]: RoomType.CHANNEL,
		[SetRoomJoinRules.INVITE]: RoomType.PRIVATE_GROUP,
	};
	const roomType = mapping[matrixJoinRule] || RoomType.CHANNEL;

	return roomType === RoomType.PRIVATE_GROUP && matrixRoomIsDirect ? RoomType.DIRECT_MESSAGE : roomType;
};

export const createLocalRoom = async (sender: string, matrixRoomId: string, creator: string): Promise<IRoom['id']> => {
	const roomState = await matrixBridge.getRoomStateByRoomId(sender, matrixRoomId);
	const matrixRoomName = roomState.find((stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.SET_ROOM_NAME)?.content
		?.name;
	const matrixJoinRule = roomState.find((stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.SET_ROOM_JOIN_RULES)
		?.content?.join_rule;
	const matrixRoomIsDirect = roomState.find((stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.SET_ROOM_JOIN_RULES)
		?.content?.is_direct;

	const { rid: roomId } = await createLocalRoomAsync(
		getLocalRoomType(matrixJoinRule, matrixRoomIsDirect),
		generateRoomNameForLocalServer(matrixRoomId, matrixRoomName),
		creator,
	);
	await setRoomAsBridged(roomId);
	await createBridgedRecordRoom(roomId, matrixRoomId);

	return roomId;
};

export const handleCreateRoom = async (event: IMatrixEvent<MatrixEventType.CREATE_ROOM>): Promise<void> => {
	const { room_id: matrixRoomId, sender } = event;

	// Check if the room already exists and if so, ignore
	const roomExists = await checkBridgedRoomExists(matrixRoomId);

	if (roomExists) {
		return;
	}

	const bridgedUserId = await MatrixBridgedUser.getId(sender);
	const user = await Users.findOneById(bridgedUserId || (await createLocalUserIfNecessary(sender)));

	await createLocalRoom(sender, matrixRoomId, user.username);
};
