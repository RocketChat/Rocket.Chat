import { FederationRoomServiceReceiver } from '../../../../../app/federation-v2/server/application/RoomServiceReceiver';
import { IFederationBridge } from '../../../../../app/federation-v2/server/domain/IFederationBridge';
import { RocketChatMessageAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Message';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import { RocketChatRoomAdapterEE } from '../infrastructure/rocket-chat/adapters/Room';
import { FederationRoomChangeJoinRulesDto, FederationRoomChangeNameDto, FederationRoomChangeTopicDto } from './input/RoomReceiverDto';

export class FederationRoomServiceReceiverEE extends FederationRoomServiceReceiver {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapterEE,
		protected rocketUserAdapter: RocketChatUserAdapter,
		protected rocketMessageAdapter: RocketChatMessageAdapter,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(rocketRoomAdapter, rocketUserAdapter, rocketMessageAdapter, rocketSettingsAdapter, bridge);
	} // eslint-disable-line no-empty-function

	public async changeJoinRules(roomJoinRulesChangeInput: FederationRoomChangeJoinRulesDto): Promise<void> {
		const { externalRoomId, roomType } = roomJoinRulesChangeInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		federatedRoom.setRoomType(roomType);
		await this.rocketRoomAdapter.updateRoomType(federatedRoom);
	}

	public async changeRoomName(roomChangeNameInput: FederationRoomChangeNameDto): Promise<void> {
		const { externalRoomId, normalizedRoomName } = roomChangeNameInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		federatedRoom.changeRoomName(normalizedRoomName);

		await this.rocketRoomAdapter.updateRoomName(federatedRoom);
	}

	public async changeRoomTopic(roomChangeTopicInput: FederationRoomChangeTopicDto): Promise<void> {
		const { externalRoomId, roomTopic } = roomChangeTopicInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		federatedRoom.changeRoomTopic(roomTopic);

		await this.rocketRoomAdapter.updateRoomTopic(federatedRoom);
	}
}
