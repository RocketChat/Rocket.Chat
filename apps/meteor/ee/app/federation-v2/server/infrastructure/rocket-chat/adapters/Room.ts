import { FederatedRoom } from '../../../../../../../app/federation-v2/server/domain/FederatedRoom';
import { RocketChatRoomAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Room';
import { MatrixBridgedRoom } from '../../../../../../../app/models/server';
import { Rooms, Subscriptions } from '../../../../../../../app/models/server/raw';

export class RocketChatRoomAdapterEE extends RocketChatRoomAdapter {
	public async updateRoomType(federatedRoom: FederatedRoom): Promise<void> {
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

	public async updateRoomTopic(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.update(
			{ _id: federatedRoom.internalReference._id },
			{ $set: { description: federatedRoom.internalReference.description } },
		);
	}

	public async updateFederatedRoomByInternalRoomId(internalRoomId: string, federatedRoom: FederatedRoom): Promise<void> {
		MatrixBridgedRoom.upsert({ rid: internalRoomId }, { rid: internalRoomId, mri: federatedRoom.externalId });
		await Rooms.setAsFederated(internalRoomId);
	}
}
