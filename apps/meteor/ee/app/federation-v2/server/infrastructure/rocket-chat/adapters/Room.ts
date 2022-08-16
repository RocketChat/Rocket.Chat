import type { ICreatedRoom, IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

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
