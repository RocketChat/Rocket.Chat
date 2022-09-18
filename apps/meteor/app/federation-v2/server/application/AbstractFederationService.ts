import type { IUser } from '@rocket.chat/core-typings';

import { FederatedUser } from '../domain/FederatedUser';
import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';

export abstract class FederationService {
	protected internalHomeServerDomain: string;

	constructor(
		protected bridge: IFederationBridge,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
	) {
		this.internalHomeServerDomain = this.internalSettingsAdapter.getHomeServerDomain();
	}

	protected async createFederatedUser(
		externalUserId: string,
		username: string,
		existsOnlyOnProxyServer = false,
		providedName?: string,
	): Promise<void> {
		const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalUserId);
		const name = externalUserProfileInformation?.displayName || providedName || username;
		const federatedUser = FederatedUser.createInstance(externalUserId, {
			name,
			username,
			existsOnlyOnProxyServer,
		});

		await this.internalUserAdapter.createFederatedUser(federatedUser);
		const insertedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalUserId);
		if (!insertedUser) {
			return;
		}
		await this.updateUserAvatarInternally(insertedUser);
	}

	protected async updateUserAvatarInternally(federatedUser: FederatedUser): Promise<void> {
		const externalUserProfileInformation = await this.bridge.getUserProfileInformation(federatedUser.getExternalId());
		if (!externalUserProfileInformation?.avatarUrl) {
			return;
		}
		if (!federatedUser.isRemote() || !federatedUser.shouldUpdateFederationAvatar(externalUserProfileInformation.avatarUrl)) {
			return;
		}
		await this.internalUserAdapter.setAvatar(
			federatedUser,
			this.bridge.convertMatrixUrlToHttp(federatedUser.getExternalId(), externalUserProfileInformation.avatarUrl),
		);
		await this.internalUserAdapter.updateFederationAvatar(federatedUser.getInternalId(), externalUserProfileInformation.avatarUrl);
	}

	protected async createFederatedUserForInviterUsingLocalInformation(internalInviterId: string): Promise<string> {
		const internalUser = await this.internalUserAdapter.getInternalUserById(internalInviterId);
		if (!internalUser || !internalUser?.username) {
			throw new Error(`Could not find user id for ${internalInviterId}`);
		}
		const name = internalUser.name || internalUser.username;
		const externalInviterId = await this.bridge.createUser(internalUser.username, name, this.internalHomeServerDomain);
		const existsOnlyOnProxyServer = true;
		await this.createFederatedUser(externalInviterId, internalUser.username, existsOnlyOnProxyServer, name);
		await this.updateUserAvatarExternally(
			internalUser,
			(await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId)) as FederatedUser,
		);

		return externalInviterId;
	}

	protected async updateUserAvatarExternally(internalUser: IUser, externalInviter: FederatedUser): Promise<void> {
		if (!internalUser.username) {
			return;
		}
		const buffer = await this.internalFileAdapter.getBufferForAvatarFile(internalUser.username);
		if (!buffer) {
			return;
		}
		const avatarFileRecord = await this.internalFileAdapter.getFileMetadataForAvatarFile(internalUser.username);
		if (!avatarFileRecord?.type || !avatarFileRecord?.name) {
			return;
		}
		const externalFileUri = await this.bridge.uploadContent(externalInviter.getExternalId(), buffer, {
			type: avatarFileRecord.type,
			name: avatarFileRecord.name,
		});
		if (!externalFileUri) {
			return;
		}
		await this.internalUserAdapter.updateFederationAvatar(internalUser._id, externalFileUri);
		await this.bridge.setUserAvatar(externalInviter.getExternalId(), externalFileUri);
	}
}
