import notifications from '../../../notifications/server/lib/Notifications';
import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../infrastructure/rocket-chat/adapters/File';
import type { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationService } from './AbstractFederationService';
import type { FederationUserTypingStatusEventDto } from './input/UserReceiverDto';

export class FederationUserServiceListener extends FederationService {
	private usersTypingByRoomId: Map<string, Record<string, string>[]> = new Map();

	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onUserTyping(userTypingInput: FederationUserTypingStatusEventDto): Promise<void> {
		const { externalUserIdsTyping, externalRoomId } = userTypingInput;
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}
		if (this.usersTypingByRoomId.has(externalRoomId)) {
			const notTypingAnymore = this.usersTypingByRoomId
				.get(externalRoomId)
				?.filter((user) => !externalUserIdsTyping.includes(user.externalUserId));
			const stillTyping = this.usersTypingByRoomId
				.get(externalRoomId)
				?.filter((user) => externalUserIdsTyping.includes(user.externalUserId));

			notTypingAnymore?.forEach((user) => notifications.notifyRoom(federatedRoom.getInternalId(), 'user-activity', user.username, []));
			this.usersTypingByRoomId.set(externalRoomId, stillTyping || []);
		}
		if (externalUserIdsTyping.length === 0) {
			return;
		}

		const federatedUsers = await this.internalUserAdapter.getFederatedUsersByExternalIds(externalUserIdsTyping);
		if (federatedUsers.length === 0) {
			return;
		}

		federatedUsers.forEach((federatedUser) =>
			notifications.notifyRoom(federatedRoom.getInternalId(), 'user-activity', federatedUser.getUsername(), ['user-typing']),
		);

		this.usersTypingByRoomId.set(
			externalRoomId,
			federatedUsers.map((federatedUser) => ({
				externalUserId: federatedUser.getInternalId(),
				username: federatedUser.getUsername() as string,
			})),
		);
	}
}
