import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { EVENT_ORIGIN, IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import {
	FederationRoomCreateInputDto,
	FederationRoomChangeMembershipDto,
	FederationRoomSendInternalMessageDto,
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from './input/RoomReceiverDto';

export class FederationRoomServiceReceiver {
	constructor(
		private rocketRoomAdapter: RocketChatRoomAdapter,
		private rocketUserAdapter: RocketChatUserAdapter,
		private rocketMessageAdapter: RocketChatMessageAdapter,
		private rocketSettingsAdapter: RocketChatSettingsAdapter,
		private bridge: IFederationBridge,
	) {} // eslint-disable-line no-empty-function

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
