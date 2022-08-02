import { IRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, MatrixBridgedRoom } from '@rocket.chat/models';

import { DirectMessageFederatedRoom, FederatedRoom } from '../../../domain/FederatedRoom';
import { createRoom, addUserToRoom, removeUserFromRoom } from '../../../../../lib/server';
import { FederatedUser } from '../../../domain/FederatedUser';
import { saveRoomName } from '../../../../../channel-settings/server/functions/saveRoomName';
import { saveRoomTopic } from '../../../../../channel-settings/server/functions/saveRoomTopic';
import { getFederatedUserByInternalUsername } from './User';

export class RocketChatRoomAdapter {
	public async getFederatedRoomByExternalId(externalRoomId: string): Promise<FederatedRoom | undefined> {
		const internalBridgedRoomId = await MatrixBridgedRoom.getLocalRoomId(externalRoomId);
		if (!internalBridgedRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalBridgedRoomId);
		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async getFederatedRoomByInternalId(internalRoomId: string): Promise<FederatedRoom | undefined> {
		const externalRoomId = await MatrixBridgedRoom.getExternalRoomId(internalRoomId);
		if (!externalRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalRoomId);

		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async getInternalRoomById(internalRoomId: string): Promise<IRoom | null> {
		return Rooms.findOneById(internalRoomId);
	}

	public async createFederatedRoom(federatedRoom: FederatedRoom): Promise<void> {
		const { rid, _id } = createRoom(
			federatedRoom.getRoomType(),
			federatedRoom.getInternalName(),
			federatedRoom.getInternalCreator()?.username || '',
		);
		const roomId = rid || _id;
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(roomId, federatedRoom.getExternalId());
		await Rooms.setAsFederated(roomId);
	}

	public async removeDirectMessageRoom(federatedRoom: FederatedRoom): Promise<void> {
		const roomId = federatedRoom.getInternalId();
		await Rooms.removeById(roomId);
		await Subscriptions.removeByRoomId(roomId);
		await MatrixBridgedRoom.removeByLocalRoomId(roomId);
	}

	public async createFederatedRoomForDirectMessage(federatedRoom: DirectMessageFederatedRoom): Promise<void> {
		const readonly = false;
		const extraData = undefined;
		const { rid, _id } = createRoom(
			federatedRoom.getRoomType(),
			federatedRoom.getInternalName(),
			federatedRoom.getInternalCreator()?.username || '',
			federatedRoom.getInternalMembersUsernames(),
			readonly,
			extraData,
			{ creator: federatedRoom.getInternalCreator()?._id },
		);
		const roomId = rid || _id;
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(roomId, federatedRoom.getExternalId());
		await Rooms.setAsFederated(roomId);
	}

	public async getDirectMessageFederatedRoomByUserIds(userIds: string[]): Promise<FederatedRoom | undefined> {
		const room = await Rooms.findOneDirectRoomContainingAllUserIDs(userIds);
		if (!room) {
			return;
		}
		const externalRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
		if (!externalRoomId) {
			return;
		}

		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async addUserToRoom(federatedRoom: FederatedRoom, inviteeUser: FederatedUser, inviterUser: FederatedUser): Promise<void> {
		Promise.resolve(addUserToRoom(federatedRoom.getInternalId(), inviteeUser.getInternalReference(), inviterUser.getInternalReference()));
	}

	public async removeUserFromRoom(federatedRoom: FederatedRoom, affectedUser: FederatedUser, byUser: FederatedUser): Promise<void> {
		Promise.resolve(
			removeUserFromRoom(federatedRoom.getInternalId(), affectedUser.getInternalReference(), {
				byUser: byUser.getInternalReference(),
			}),
		);
	}

	public async isUserAlreadyJoined(internalRoomId: string, internalUserId: string): Promise<boolean> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(internalRoomId, internalUserId, { projection: { _id: 1 } });

		return Boolean(subscription);
	}

	public async updateRoomType(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.setRoomTypeById(federatedRoom.getInternalId(), federatedRoom.getRoomType());
		await Subscriptions.updateAllRoomTypesByRoomId(federatedRoom.getRoomType(), federatedRoom.getRoomType());
	}

	public async updateRoomName(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await saveRoomName(federatedRoom.getRoomType(), federatedRoom.getInternalName(), federatedUser.getInternalReference());
	}

	public async updateRoomTopic(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await saveRoomTopic(federatedRoom.getRoomType(), federatedRoom.getInternalTopic(), federatedUser.getInternalReference());
	}

	private async createFederatedRoomInstance(externalRoomId: string, room: IRoom): Promise<FederatedRoom> {
		if (isDirectMessageRoom(room)) {
			const members = (await Promise.all(
				(room.usernames || []).map((username) => getFederatedUserByInternalUsername(username)),
			)) as FederatedUser[];
			return DirectMessageFederatedRoom.createWithInternalReference(externalRoomId, room, members);
		}

		return FederatedRoom.createWithInternalReference(externalRoomId, room);
	}
}
