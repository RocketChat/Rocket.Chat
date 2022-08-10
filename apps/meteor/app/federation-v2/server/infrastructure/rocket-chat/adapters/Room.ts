import type { ICreatedRoom, IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions as SubscriptionsRaw } from '@rocket.chat/models';

import { MatrixBridgedRoom, Subscriptions } from '../../../../../models/server';
import { FederatedRoom } from '../../../domain/FederatedRoom';
import { createRoom, addUserToRoom, removeUserFromRoom } from '../../../../../lib/server';
import type { FederatedUser } from '../../../domain/FederatedUser';
import { saveRoomName } from '../../../../../channel-settings/server/functions/saveRoomName';
import { saveRoomTopic } from '../../../../../channel-settings/server/functions/saveRoomTopic';

export class RocketChatRoomAdapter {
	public async getFederatedRoomByExternalId(externalRoomId: string): Promise<FederatedRoom | undefined> {
		const internalBridgedRoomId = MatrixBridgedRoom.getId(externalRoomId);
		if (!internalBridgedRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalBridgedRoomId);
		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async getFederatedRoomByInternalId(internalRoomId: string): Promise<FederatedRoom | undefined> {
		const externalRoomId = MatrixBridgedRoom.getMatrixId(internalRoomId);
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
		const members = federatedRoom.getMembers();
		const { rid, _id } = createRoom(
			federatedRoom.internalReference.t,
			federatedRoom.internalReference.name,
			federatedRoom.internalReference.u.username as string,
			members,
			false,
			undefined,
			{ creator: members[0]?._id as string },
		) as ICreatedRoom;
		const roomId = rid || _id;
		MatrixBridgedRoom.upsert({ rid: roomId }, { rid: roomId, mri: federatedRoom.externalId });
		await Rooms.setAsFederated(roomId);
	}

	public async removeDirectMessageRoom(federatedRoom: FederatedRoom): Promise<void> {
		const roomId = federatedRoom.internalReference._id;
		await Rooms.removeById(roomId);
		await Subscriptions.removeByRoomId(roomId);
		await MatrixBridgedRoom.remove({ rid: roomId });
	}

	public async createFederatedRoomForDirectMessage(federatedRoom: FederatedRoom, membersUsernames: string[]): Promise<void> {
		const { rid, _id } = createRoom(
			federatedRoom.internalReference.t,
			federatedRoom.internalReference.name,
			federatedRoom.internalReference.u.username as string,
			membersUsernames,
			false,
			undefined,
			{ creator: federatedRoom.internalReference.u._id },
		) as ICreatedRoom;
		const roomId = rid || _id;
		MatrixBridgedRoom.upsert({ rid: roomId }, { rid: roomId, mri: federatedRoom.externalId });
		await Rooms.setAsFederated(roomId);
	}

	public async addUserToRoom(federatedRoom: FederatedRoom, inviteeUser: FederatedUser, inviterUser?: FederatedUser): Promise<void> {
		return new Promise((resolve) =>
			resolve(addUserToRoom(federatedRoom.internalReference._id, inviteeUser.internalReference, inviterUser?.internalReference) as any),
		);
	}

	public async removeUserFromRoom(federatedRoom: FederatedRoom, affectedUser: FederatedUser, byUser: FederatedUser): Promise<void> {
		return new Promise((resolve) =>
			resolve(
				removeUserFromRoom(federatedRoom.internalReference._id, affectedUser.internalReference, {
					byUser: byUser.internalReference,
				}) as any,
			),
		);
	}

	private createFederatedRoomInstance(externalRoomId: string, room: IRoom): FederatedRoom {
		const federatedRoom = FederatedRoom.build();
		federatedRoom.externalId = externalRoomId;
		federatedRoom.internalReference = room;

		return federatedRoom;
	}

	public async isUserAlreadyJoined(internalRoomId: string, internalUserId: string): Promise<boolean> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(internalRoomId, internalUserId, { projection: { _id: 1 } });

		return Boolean(subscription);
	}

	public async updateRoomType(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.setRoomTypeById(federatedRoom.internalReference._id, federatedRoom.internalReference.t);
		await SubscriptionsRaw.updateAllRoomTypesByRoomId(federatedRoom.internalReference._id, federatedRoom.internalReference.t);
	}

	public async updateRoomName(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await saveRoomName(federatedRoom.internalReference._id, federatedRoom.internalReference.name, federatedUser.internalReference);
	}

	public async updateRoomTopic(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await saveRoomTopic(federatedRoom.internalReference._id, federatedRoom.internalReference.topic, federatedUser.internalReference);
	}
}
