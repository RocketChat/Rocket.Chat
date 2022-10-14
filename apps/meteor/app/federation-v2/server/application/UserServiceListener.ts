import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../infrastructure/rocket-chat/adapters/File';
import type { RocketChatNotificationAdapter } from '../infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationService } from './AbstractFederationService';
import type { FederationUserTypingStatusEventDto } from './input/UserReceiverDto';

export class FederationUserServiceListener extends FederationService {
	private usersTypingByRoomIdCache: Map<string, Record<string, string>[]> = new Map();

	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	private handleUsersWhoStoppedTyping(externalRoomId: string, internalRoomId: string, externalUserIdsTyping: string[]): void {
		const isTyping = false;
		const notTypingAnymore = this.usersTypingByRoomIdCache
			.get(externalRoomId)
			?.filter((user) => !externalUserIdsTyping.includes(user.externalUserId));

		const stillTyping = this.usersTypingByRoomIdCache
			.get(externalRoomId)
			?.filter((user) => externalUserIdsTyping.includes(user.externalUserId));

		notTypingAnymore?.forEach((user) => this.internalNotificationAdapter.notifyUserTypingOnRoom(internalRoomId, user.username, isTyping));
		this.usersTypingByRoomIdCache.set(externalRoomId, stillTyping || []);
	}

	public async onUserTyping(userTypingInput: FederationUserTypingStatusEventDto): Promise<void> {
		const { externalUserIdsTyping, externalRoomId } = userTypingInput;
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}
		if (this.usersTypingByRoomIdCache.has(externalRoomId)) {
			this.handleUsersWhoStoppedTyping(externalRoomId, federatedRoom.getInternalId(), externalUserIdsTyping);
		}

		if (externalUserIdsTyping.length === 0) {
			return;
		}

		const federatedUsers = await this.internalUserAdapter.getFederatedUsersByExternalIds(externalUserIdsTyping);
		if (federatedUsers.length === 0) {
			return;
		}

		const isTyping = true;

		this.usersTypingByRoomIdCache.set(
			externalRoomId,
			federatedUsers.map((federatedUser) => {
				this.internalNotificationAdapter.notifyUserTypingOnRoom(
					federatedRoom.getInternalId(),
					federatedUser.getUsername() as string,
					isTyping,
				);

				return {
					externalUserId: federatedUser.getInternalId(),
					username: federatedUser.getUsername() as string,
				};
			}),
		);
	}
}
