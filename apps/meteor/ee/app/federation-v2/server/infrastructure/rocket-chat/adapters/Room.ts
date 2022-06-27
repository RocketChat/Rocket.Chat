import { ICreatedRoom, IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { FederatedRoom } from '../../../../../../../app/federation-v2/server/domain/FederatedRoom';
import { RocketChatRoomAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Room';
import { MatrixBridgedRoom } from '../../../../../../../app/models/server';
import { createDirectMessage } from '../../../../../../../server/methods/createDirectMessage';
import { FederatedRoomEE } from '../../../domain/FederatedRoom';

export class RocketChatRoomAdapterEE extends RocketChatRoomAdapter {
	public async getFederatedRoomByExternalId(externalRoomId: string): Promise<FederatedRoomEE | undefined> {
		const internalBridgedRoomId = MatrixBridgedRoom.getId(externalRoomId);
		if (!internalBridgedRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalBridgedRoomId);
		if (room) {
			return this.createFederatedRoomEEInstance(externalRoomId, room);
		}
	}

	public async getFederatedRoomByInternalId(internalRoomId: string): Promise<FederatedRoomEE | undefined> {
		const externalRoomId = MatrixBridgedRoom.getMatrixId(internalRoomId);
		if (!externalRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalRoomId);

		if (room) {
			return this.createFederatedRoomEEInstance(externalRoomId, room);
		}
	}

	public async updateRoomType(federatedRoom: FederatedRoomEE): Promise<void> {
		await Rooms.update({ _id: federatedRoom.internalReference._id }, { $set: { t: federatedRoom.internalReference.t } });
		await Subscriptions.update(
			{ rid: federatedRoom.internalReference._id },
			{ $set: { t: federatedRoom.internalReference.t } },
			{ multi: true },
		);
	}

	public async updateRoomName(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.update(
			{ _id: federatedRoom.internalReference._id },
			{ $set: { name: federatedRoom.internalReference.name, fname: federatedRoom.internalReference.fname } },
		);
		await Subscriptions.update(
			{ rid: federatedRoom.internalReference._id },
			{ $set: { name: federatedRoom.internalReference.name, fname: federatedRoom.internalReference.fname } },
			{ multi: true },
		);
	}

	public async updateRoomTopic(federatedRoom: FederatedRoomEE): Promise<void> {
		await Rooms.update(
			{ _id: federatedRoom.internalReference._id },
			{ $set: { description: federatedRoom.internalReference.description } },
		);
	}

	public async updateFederatedRoomByInternalRoomId(internalRoomId: string, federatedRoom: FederatedRoomEE): Promise<void> {
		MatrixBridgedRoom.upsert({ rid: internalRoomId }, { rid: internalRoomId, mri: federatedRoom.externalId });
		await Rooms.setAsFederated(internalRoomId);
	}

	public async createLocalDirectMessageRoom(members: string[], creatorId: string): Promise<void> {
		createDirectMessage(members, creatorId) as ICreatedRoom;
	}

	public async isUserAlreadyJoined(internalRoomId: string, internalUserId: string): Promise<boolean> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(internalRoomId, internalUserId);

		return Boolean(subscription);
	}

	private createFederatedRoomEEInstance(externalRoomId: string, room: IRoom): FederatedRoomEE {
		const federatedRoom = FederatedRoomEE.build();
		federatedRoom.externalId = externalRoomId;
		federatedRoom.internalReference = room;

		return federatedRoom;
	}
}
