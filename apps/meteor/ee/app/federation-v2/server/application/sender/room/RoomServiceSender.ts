import { FederationRoomServiceSender } from '../../../../../../../app/federation-v2/server/application/sender/RoomServiceSender';
import type { RocketChatFileAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import type { RocketChatSettingsAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE } from '../../../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../../infrastructure/rocket-chat/adapters/User';
import type { FederationCreateDirectMessageDto } from '../../input/RoomSenderDto';

export class FederationRoomServiceSenderEE extends FederationRoomServiceSender {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(internalRoomAdapter, internalUserAdapter, internalSettingsAdapter, internalFileAdapter, bridge);
	}

	public async createLocalDirectMessageRoom(dmRoomCreateInput: FederationCreateDirectMessageDto): Promise<void> {
		const { internalInviterId, invitees } = dmRoomCreateInput;

		await this.internalRoomAdapter.createLocalDirectMessageRoom(invitees, internalInviterId);
	}
}
