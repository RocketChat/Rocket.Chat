import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { ICreatedRoom } from '@rocket.chat/core-typings';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { MatrixBridgedRoom, MatrixBridgedUser, Users } from '../../../models/server';
import { Rooms } from '../../../models/server/raw';
import { createRoom } from '../../../lib/server';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { checkBridgedRoomExists } from '../methods/checkBridgedRoomExists';
import { matrixClient } from '../matrix-client';
import { SetRoomJoinRules } from '../definitions/IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';
import { matrixBridge } from '../bridge';
import { setRoomJoinRules } from './setRoomJoinRules';
import { setRoomName } from './setRoomName';
import { handleRoomMembership } from './roomMembership';

const removeUselessCharacterFromMatrixRoomId = (matrixRoomId: string): string => {
	const prefixedRoomIdOnly = matrixRoomId.split(':')[0];
	const prefix = '!';

	return prefixedRoomIdOnly?.replace(prefix, '');
};

const generateRoomNameForLocalServer = (matrixRoomId: string, matrixRoomName?: string): string => {
	return matrixRoomName || `Federation-${removeUselessCharacterFromMatrixRoomId(matrixRoomId)}`;
};

const createLocalRoomAsync = async (roomType: RoomType, roomName: string, creator: IUser, members: IUser[] = []): Promise<ICreatedRoom> => {
	return new Promise((resolve) => resolve(createRoom(roomType, roomName, creator.username, members as any[]) as ICreatedRoom));
};

const createBridgedRecordRoom = async (roomId: IRoom['id'], matrixRoomId: string): Promise<void> =>
	new Promise((resolve) => resolve(MatrixBridgedRoom.insert({ rid: roomId, mri: matrixRoomId })));

const createLocalUserIfNecessary = async (matrixUserId: string): Promise<string> => {
	const { uid } = await matrixClient.user.createLocal(matrixUserId);

	return uid;
};

const applyRoomStateIfNecessary = async (matrixRoomId: string, roomState?: IMatrixEvent<MatrixEventType>[]): Promise<void> => {
	// TODO: this should be better
	/* eslint-disable no-await-in-loop */
	for (const state of roomState || []) {
		switch (state.type) {
			case 'm.room.create':
				continue;
			case 'm.room.join_rules': {
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				await setRoomJoinRules({ room_id: matrixRoomId, ...state });

				break;
			}
			case 'm.room.name': {
				// @ts-ignore
				// eslint-disable-next-line @typescript-eslint/camelcase
				await setRoomName({ room_id: matrixRoomId, ...state });

				break;
			}
			case 'm.room.member': {
				// @ts-ignore
				if (state.content.membership === 'join') {
					// @ts-ignore
					// eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/no-use-before-define
					await handleRoomMembership({ room_id: matrixRoomId, ...state });
				}

				break;
			}
		}
	}
	/* eslint-enable no-await-in-loop */
};

const mapLocalAndExternal = async (roomId: string, matrixRoomId: string): Promise<void> => {
	await createBridgedRecordRoom(roomId, matrixRoomId);
	await Rooms.setAsBridged(roomId);
};

const tryToGetDataFromExternalRoom = async (
	senderMatrixUserId: string,
	matrixRoomId: string,
	roomState: IMatrixEvent<MatrixEventType>[] = [],
): Promise<Record<string, any>> => {
	const finalRoomState =
		roomState && roomState?.length > 0 ? roomState : await matrixBridge.getRoomStateByRoomId(senderMatrixUserId, matrixRoomId);
	const externalRoomName = finalRoomState.find((stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.SET_ROOM_NAME)
		?.content?.name;
	const externalRoomJoinRule = finalRoomState.find(
		(stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.SET_ROOM_JOIN_RULES,
	)?.content?.join_rule;

	return {
		externalRoomName,
		externalRoomJoinRule,
	};
};

export const createLocalDirectMessageRoom = async (matrixRoomId: string, creator: IUser, affectedUser: IUser): Promise<IRoom['id']> => {
	const { _id: roomId } = await createLocalRoomAsync(RoomType.DIRECT_MESSAGE, generateRoomNameForLocalServer(matrixRoomId), creator, [
		creator,
		affectedUser,
	]);
	await mapLocalAndExternal(roomId, matrixRoomId);

	return roomId;
};

export const getLocalRoomType = (matrixJoinRule = '', matrixRoomIsDirect = false): RoomType => {
	const mapping: Record<string, RoomType> = {
		[SetRoomJoinRules.JOIN]: RoomType.CHANNEL,
		[SetRoomJoinRules.INVITE]: RoomType.PRIVATE_GROUP,
	};
	const roomType = mapping[matrixJoinRule] || RoomType.CHANNEL;

	return roomType === RoomType.PRIVATE_GROUP && matrixRoomIsDirect ? RoomType.DIRECT_MESSAGE : roomType;
};

export const createLocalChannelsRoom = async (
	matrixRoomId: string,
	senderMatrixUserId: string,
	creator: IUser,
	roomState?: IMatrixEvent<MatrixEventType>[],
): Promise<IRoom['id']> => {
	let roomName = '';
	let joinRule;

	try {
		const { externalRoomName, externalRoomJoinRule } = await tryToGetDataFromExternalRoom(senderMatrixUserId, matrixRoomId, roomState);
		roomName = externalRoomName;
		joinRule = externalRoomJoinRule;
	} catch (err) {
		// no-op
	}
	const { rid: roomId } = await createLocalRoomAsync(
		getLocalRoomType(joinRule),
		generateRoomNameForLocalServer(matrixRoomId, roomName),
		creator,
	);
	await mapLocalAndExternal(roomId, matrixRoomId);

	return roomId;
};

export const processFirstAccessFromExternalServer = async (
	matrixRoomId: string,
	senderMatrixUserId: string,
	affectedMatrixUserId: string,
	senderUser: IUser,
	affectedUser: IUser,
	isDirect = false,
	roomState: IMatrixEvent<MatrixEventType>[],
): Promise<string> => {
	let roomId;
	if (isDirect) {
		roomId = await createLocalDirectMessageRoom(matrixRoomId, senderUser, affectedUser);
	} else {
		roomId = await createLocalChannelsRoom(matrixRoomId, senderMatrixUserId, senderUser, roomState);
	}

	await applyRoomStateIfNecessary(matrixRoomId, roomState);
	await matrixBridge.getInstance().getIntent(affectedMatrixUserId).join(matrixRoomId);

	return roomId;
};

export const handleCreateRoom = async (event: IMatrixEvent<MatrixEventType.CREATE_ROOM>): Promise<void> => {
	const {
		room_id: matrixRoomId,
		sender,
		content: { was_programatically_created: wasProgramaticallyCreated = false },
	} = event;

	// Check if the room already exists and if so, ignore
	const roomExists = await checkBridgedRoomExists(matrixRoomId);
	if (roomExists || wasProgramaticallyCreated) {
		return;
	}

	const bridgedUserId = await MatrixBridgedUser.getId(sender);
	const creator = await Users.findOneById(bridgedUserId || (await createLocalUserIfNecessary(sender)));

	await createLocalChannelsRoom(matrixRoomId, sender, creator);
};
