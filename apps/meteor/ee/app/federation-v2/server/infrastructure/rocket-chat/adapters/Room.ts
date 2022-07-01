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
		await Rooms.setRoomTypeById(federatedRoom.internalReference._id, federatedRoom.internalReference.t);
		await Subscriptions.updateAllRoomTypesByRoomId(federatedRoom.internalReference._id, federatedRoom.internalReference.t);
	}

	public async updateRoomName(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.setRoomNameById(
			federatedRoom.internalReference._id,
			federatedRoom.internalReference.name,
			federatedRoom.internalReference.fname,
		);
		await Subscriptions.updateAllRoomNamesByRoomId(
			federatedRoom.internalReference._id,
			federatedRoom.internalReference.name as string,
			federatedRoom.internalReference.fname as string,
		);
	}

	public async updateRoomTopic(federatedRoom: FederatedRoomEE): Promise<void> {
		await Rooms.setRoomTopicById(federatedRoom.internalReference._id, federatedRoom.internalReference.description);
	}

	public async updateFederatedRoomByInternalRoomId(internalRoomId: string, federatedRoom: FederatedRoomEE): Promise<void> {
		MatrixBridgedRoom.upsert({ rid: internalRoomId }, { rid: internalRoomId, mri: federatedRoom.externalId });
		await Rooms.setAsFederated(internalRoomId);
	}

	public async createLocalDirectMessageRoom(members: string[], creatorId: string): Promise<void> {
		createDirectMessage(members, creatorId) as ICreatedRoom;
	}

	private createFederatedRoomEEInstance(externalRoomId: string, room: IRoom): FederatedRoomEE {
		const federatedRoom = FederatedRoomEE.build();
		federatedRoom.externalId = externalRoomId;
		federatedRoom.internalReference = room;

		return federatedRoom;
	}
}
