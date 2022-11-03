import { isMessageFromMatrixFederation } from '@rocket.chat/core-typings';

import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationService } from './AbstractFederationService';
import type { FederationMessageReactionEventDto } from './input/MessageReceiverDto';

export class FederationMessageServiceListener extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onMessageReaction(messageReactionEventInput: FederationMessageReactionEventDto): Promise<void> {
		const {
			externalRoomId,
			emoji,
			externalSenderId,
			externalEventId: externalReactionEventId,
			externalReactedEventId: externalMessageId,
		} = messageReactionEventInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}
		const message = await this.internalMessageAdapter.getMessageByFederationId(externalMessageId);
		if (!message) {
			return;
		}
		if (!isMessageFromMatrixFederation(message)) {
			return;
		}
		// TODO: move this to a Message entity in the domain layer
		const userAlreadyReacted = Boolean(
			federatedUser.getUsername() && message.reactions?.[emoji]?.usernames?.includes(federatedUser.getUsername() as string),
		);
		if (userAlreadyReacted) {
			return;
		}

		await this.internalMessageAdapter.reactToMessage(federatedUser, message, emoji, externalReactionEventId);
	}
}
