import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import type { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE } from '../../domain/IFederationBridge';
import type { RocketChatRoomAdapterEE } from '../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import type { FederationCreateDirectMessageDto } from '../input/RoomSenderDto';

export class FederationRoomServiceSenderEE extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapterEE,
		protected internalUserAdapter: RocketChatUserAdapterEE,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async createLocalDirectMessageRoom(dmRoomCreateInput: FederationCreateDirectMessageDto): Promise<void> {
		const { internalInviterId, invitees } = dmRoomCreateInput;

		await this.internalRoomAdapter.createLocalDirectMessageRoom(invitees, internalInviterId);
	}
}
