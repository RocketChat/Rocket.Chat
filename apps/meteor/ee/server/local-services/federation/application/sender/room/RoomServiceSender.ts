import { FederationRoomServiceSender } from '../../../../../../../server/services/federation/application/sender/RoomServiceSender';
import type { RocketChatFileAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatSettingsAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE } from '../../../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../../infrastructure/rocket-chat/adapters/User';
import type { FederationCreateDirectMessageDto } from '../input/RoomSenderDto';

export class FederationRoomServiceSenderEE extends FederationRoomServiceSender {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalMessageAdapter,
			internalSettingsAdapter,
			internalNotificationAdapter,
			bridge,
		);
	}

	public async createLocalDirectMessageRoom(dmRoomCreateInput: FederationCreateDirectMessageDto): Promise<void> {
		const { internalInviterId, invitees } = dmRoomCreateInput;

		await this.internalRoomAdapter.createLocalDirectMessageRoom(invitees, internalInviterId);
	}
}
