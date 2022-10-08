import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';
import { UserStatus } from '@rocket.chat/core-typings';
import { RocketChatRoomAdapter } from '../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationService } from '../AbstractFederationService';

export class FederationUserServiceSender extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async afterUserAvatarChanged(internalUsername: string): Promise<void> {
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(internalUsername);
		if (!federatedUser) {
			return;
		}

		if (federatedUser.isRemote()) {
			return;
		}

		await this.updateUserAvatarExternally(federatedUser.getInternalReference(), federatedUser);
	}

	public async onUserTyping(internalUsername: string, internalRoomId: string, isTyping: boolean): Promise<void> {
		if (!this.internalSettingsAdapter.isTypingStatusEnabled()) {
			return;
		}
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(internalUsername)
		if (!federatedUser) {
			return;
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}
		
		await this.bridge.notifyUserTyping(federatedRoom.getExternalId(), federatedUser.getExternalId(), isTyping);
	}

	public async afterUserPresenceChanged(internalUserId: string, status: UserStatus, statusMessage?: string): Promise<void> {
		if (!this.internalSettingsAdapter.isUserPresenceStatusEnabled()) {
			return;
		}
		if (!internalUserId) {
			return;
		}
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}
		if (federatedUser.isRemote()) {
            return;
        }
		let externalStatus
		if (status === 'online') {
			externalStatus = 'online';
		} else if (status === 'away' || status === 'busy') {
			externalStatus = 'unavailable';
		} else {
			externalStatus = 'offline';
		}

		await this.bridge.setUserPresence(federatedUser.getExternalId(), externalStatus, statusMessage);
	}
}
