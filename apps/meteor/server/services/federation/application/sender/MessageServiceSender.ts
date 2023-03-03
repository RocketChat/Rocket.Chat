import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isMessageFromMatrixFederation } from '@rocket.chat/core-typings';

import { FederatedUser } from '../../domain/FederatedUser';
import type { IFederationBridge } from '../../domain/IFederationBridge';
import { Federation } from '../../Federation';
import type { RocketChatMessageAdapter } from '../../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatRoomAdapter } from '../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';

export class FederationMessageServiceSender {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected bridge: IFederationBridge,
	) {}

	public async sendExternalMessageReaction(internalMessage: IMessage, internalUser: IUser, reaction: string): Promise<void> {
		if (!internalMessage || !internalUser || !internalUser._id || !internalMessage.rid) {
			return;
		}
		const federatedSender = await this.internalUserAdapter.getFederatedUserByInternalId(internalUser._id);
		if (!federatedSender) {
			return;
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalMessage.rid);
		if (!federatedRoom) {
			return;
		}

		if (!isMessageFromMatrixFederation(internalMessage)) {
			return;
		}

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedSender.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		const eventId = await this.bridge.sendMessageReaction(
			federatedRoom.getExternalId(),
			federatedSender.getExternalId(),
			internalMessage.federation?.eventId as string,
			reaction,
		);
		federatedSender.getUsername() &&
			(await this.internalMessageAdapter.setExternalFederationEventOnMessageReaction(
				federatedSender.getUsername() as string,
				internalMessage,
				reaction,
				eventId,
			));
	}

	public async sendExternalMessageUnReaction(internalMessage: IMessage, internalUser: IUser, reaction: string): Promise<void> {
		if (!internalMessage || !internalUser || !internalUser._id || !internalMessage.rid) {
			return;
		}
		const federatedSender = await this.internalUserAdapter.getFederatedUserByInternalId(internalUser._id);
		if (!federatedSender) {
			return;
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalMessage.rid);
		if (!federatedRoom) {
			return;
		}

		if (!isMessageFromMatrixFederation(internalMessage)) {
			return;
		}

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedSender.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}
		// TODO: leaked business logic, move this to the domain layer
		const externalEventId = Object.keys(internalMessage.reactions?.[reaction].federationReactionEventIds || {}).find(
			(key) => internalMessage.reactions?.[reaction].federationReactionEventIds?.[key] === internalUser.username,
		);
		if (!externalEventId) {
			return;
		}
		const normalizedEventId = Federation.unescapeExternalFederationEventId(externalEventId);
		await this.bridge.redactEvent(federatedRoom.getExternalId(), federatedSender.getExternalId(), normalizedEventId);
		await this.internalMessageAdapter.unsetExternalFederationEventOnMessageReaction(externalEventId, internalMessage, reaction);
	}
}
