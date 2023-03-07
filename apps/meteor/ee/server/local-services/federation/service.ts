import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';
import type { IFederationServiceEE } from '@rocket.chat/core-services';

import { AbstractFederationService } from '../../../../server/services/federation/service';
import type { FederationRoomServiceSenderEE } from './application/sender/room/RoomServiceSender';
import type { FederationRoomApplicationServiceEE } from './application/RoomService';
import { FederationSearchPublicRoomsInputDto } from './application/input/RoomInputDto';
import type { RocketChatRoomAdapterEE } from './infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapterEE } from './infrastructure/rocket-chat/adapters/User';
import { FederationFactoryEE } from './infrastructure/Factory';
import type { IFederationBridgeEE } from './domain/IFederationBridge';
import { FederationRoomSenderConverterEE } from './infrastructure/rocket-chat/converters/RoomSender';

abstract class AbstractBaseFederationServiceEE extends AbstractFederationService {
	protected internalRoomServiceSenderEE: FederationRoomServiceSenderEE;

	protected internalRoomApplicationServiceEE: FederationRoomApplicationServiceEE;

	protected internalRoomAdapterEE: RocketChatRoomAdapterEE;

	protected internalUserAdapterEE: RocketChatUserAdapterEE;

	constructor() {
		const internalQueueInstance = FederationFactoryEE.buildFederationQueue();
		const internalSettingsAdapter = FederationFactoryEE.buildRocketSettingsAdapter();
		const bridgeEE = FederationFactoryEE.buildFederationBridge(internalSettingsAdapter, internalQueueInstance);
		super(bridgeEE, internalQueueInstance, internalSettingsAdapter);

		this.internalRoomAdapterEE = FederationFactoryEE.buildRocketRoomAdapter();
		this.internalUserAdapterEE = FederationFactoryEE.buildRocketUserAdapter();
		this.internalRoomServiceSenderEE = FederationFactoryEE.buildRoomServiceSender(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.getInternalMessageAdapter(),
			this.getInternalSettingsAdapter(),
			this.getInternalNotificationAdapter(),
			this.getBridge(),
		);
		this.internalRoomApplicationServiceEE = FederationFactoryEE.buildRoomApplicationService(
			this.getInternalSettingsAdapter(),
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.internalRoomAdapterEE,
			this.getInternalNotificationAdapter(),
			this.getBridge(),
		);
	}

	protected async setupInternalEphemeralListeners(): Promise<void> {
		await this.getInternalNotificationAdapter().subscribeToUserTypingEventsOnFederatedRooms(
			this.getInternalNotificationAdapter().broadcastUserTypingOnRoom.bind(this.getInternalNotificationAdapter()),
		);
	}

	protected async setupInternalValidators(): Promise<void> {
		const internalRoomHooksValidator = FederationFactoryEE.buildRoomInternalHooksValidator(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.getInternalSettingsAdapter(),
			this.getBridge(),
		);
		FederationFactoryEE.setupValidators(internalRoomHooksValidator);
	}

	protected async setupInternalActionListeners(): Promise<void> {
		const internalRoomServiceSender = FederationFactoryEE.buildRoomServiceSender(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.getInternalMessageAdapter(),
			this.getInternalSettingsAdapter(),
			this.getInternalNotificationAdapter(),
			this.getBridge(),
		);
		const internalMessageServiceSender = FederationFactoryEE.buildMessageServiceSender(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalSettingsAdapter(),
			this.getInternalMessageAdapter(),
			this.getBridge(),
		);
		const internalRoomHooksServiceSenderEE = FederationFactoryEE.buildRoomInternalHooksServiceSender(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.getInternalSettingsAdapter(),
			this.getInternalMessageAdapter(),
			this.getBridge(),
		);
		const internalDMRoomHooksServiceSender = FederationFactoryEE.buildDMRoomInternalHooksServiceSender(
			this.internalRoomAdapterEE,
			this.internalUserAdapterEE,
			this.getInternalFileAdapter(),
			this.getInternalSettingsAdapter(),
			this.getBridge(),
		);
		FederationFactoryEE.setupListenersForLocalActions(internalRoomServiceSender, internalMessageServiceSender);
		FederationFactoryEE.setupListenersForLocalActionsEE(
			internalRoomHooksServiceSenderEE,
			internalDMRoomHooksServiceSender,
			this.getInternalSettingsAdapter(),
		);
	}

	protected async onEnableFederation(): Promise<void> {
		await super.setupFederation();
		await this.startFederation();
	}

	protected async onDisableFederation(): Promise<void> {
		await this.stopFederation();
	}

	private getBridge(): IFederationBridgeEE {
		return this.bridge as IFederationBridgeEE;
	}

	private async startFederation(): Promise<void> {
		if (!this.isFederationEnabled()) {
			return;
		}
		await this.bridge.start();
		this.bridge.logFederationStartupInfo('Running Federation Enterprise V2');
		FederationFactoryEE.removeCEValidators();
		await import('./infrastructure/rocket-chat/slash-commands');
		await import('../../api/federation');
	}

	private async stopFederation(): Promise<void> {
		await this.bridge.stop();
		FederationFactoryEE.removeAllListeners();
		await super.cleanUpHandlers();
	}

	public async created(): Promise<void> {
		await super.setupFederation();
		await this.startFederation();
	}

	public async stopped(): Promise<void> {
		await this.stopFederation();
		super.stopped();
	}
}

export class FederationServiceEE extends AbstractBaseFederationServiceEE implements IFederationServiceEE {
	protected name = 'federation-enterprise';

	public async createDirectMessageRoom(internalUserId: string, invitees: string[]): Promise<void> {
		await this.internalRoomServiceSenderEE.createLocalDirectMessageRoom(
			FederationRoomSenderConverterEE.toCreateDirectMessageDto(internalUserId, invitees),
		);
	}

	public async searchPublicRooms(
		serverName?: string,
		roomName?: string,
		pageToken?: string,
		count?: number,
	): Promise<
		FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>
	> {
		return this.internalRoomApplicationServiceEE.searchPublicRooms(
			new FederationSearchPublicRoomsInputDto({
				serverName,
				roomName,
				pageToken,
				count,
			}),
		);
	}

	public async getSearchedServerNamesByInternalUserId(
		internalUserId: string,
	): Promise<{ name: string; default: boolean; local: boolean }[]> {
		return this.internalRoomApplicationServiceEE.getSearchedServerNamesByInternalUserId(internalUserId);
	}

	public async addSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		return this.internalRoomApplicationServiceEE.addSearchedServerNameByInternalUserId(internalUserId, serverName);
	}

	public async removeSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		return this.internalRoomApplicationServiceEE.removeSearchedServerNameByInternalUserId(internalUserId, serverName);
	}

	public async joinExternalPublicRoom(internalUserId: string, externalRoomId: string): Promise<void> {
		await this.internalRoomApplicationServiceEE.joinExternalPublicRoom(
			FederationRoomSenderConverterEE.toJoinExternalPublicRoomDto(internalUserId, externalRoomId),
		);
	}
}
