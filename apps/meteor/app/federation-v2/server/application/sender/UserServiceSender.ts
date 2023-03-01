import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatRoomAdapter } from '../../infrastructure/rocket-chat/adapters/Room';
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
			const internalUser = await this.internalUserAdapter.getInternalUserByUsername(internalUsername);
			if (!internalUser) {
				return;
			}
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUser._id);
			return;
		}

		if (federatedUser.isRemote()) {
			return;
		}

		await this.updateUserAvatarExternally(federatedUser.getInternalReference(), federatedUser);
	}

	public async afterUserRealNameChanged(internalUserId: string, name: string): Promise<void> {
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			const internalUser = await this.internalUserAdapter.getInternalUserById(internalUserId);
			if (!internalUser) {
				return;
			}
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUser._id);
			return;
		}

		if (federatedUser.isRemote()) {
			return;
		}
		const externalUserProfileInformation = await this.bridge.getUserProfileInformation(federatedUser.getExternalId());
		if (!federatedUser.shouldUpdateDisplayName(externalUserProfileInformation?.displayName || '')) {
			return;
		}

		await this.bridge.setUserDisplayName(federatedUser.getExternalId(), name);
	}

	public async onUserTyping(internalUsername: string, internalRoomId: string, isTyping: boolean): Promise<void> {
		if (!this.internalSettingsAdapter.isTypingStatusEnabled()) {
			return;
		}
		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(internalUsername);
		if (!federatedUser) {
			return;
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		await this.bridge.notifyUserTyping(federatedRoom.getExternalId(), federatedUser.getExternalId(), isTyping);
	}
}
