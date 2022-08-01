import { Rooms, MatrixBridgedRoom } from '@rocket.chat/models';

import { RocketChatRoomAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Room';
import { createDirectMessage } from '../../../../../../../server/methods/createDirectMessage';

export class RocketChatRoomAdapterEE extends RocketChatRoomAdapter {
	public async updateFederatedRoomByInternalRoomId(internalRoomId: string, externalRoomId: string): Promise<void> {
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(internalRoomId, externalRoomId);
		await Rooms.setAsFederated(internalRoomId);
	}

	public async createLocalDirectMessageRoom(members: string[], creatorId: string): Promise<void> {
		return Promise.resolve(createDirectMessage(members, creatorId));
	}
}
