import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { IFederationBridgeEE } from '../../domain/IFederationBridge';
import { RocketChatRoomAdapterEE } from '../../infrastructure/rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationCreateDirectMessageDto } from '../input/RoomSenderDto';

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
