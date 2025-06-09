import type { IHomeserverServiceEE } from '@rocket.chat/core-services';

import { AbstractHomeserverService } from '../../../../server/services/homeserver/service';
import type { RocketChatSettingsAdapter } from '../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import { FederationFactory } from '../../../../server/services/federation/infrastructure/Factory';

abstract class AbstractBaseHomeserverServiceEE extends AbstractHomeserverService {
	constructor() {
		const internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		super(internalSettingsAdapter);
		// Default to port 8800 for debs-homeserver RC1 container
		this.homeserverUrl = process.env.HOMESERVER_URL || 
			process.env.EXTERNAL_HOMESERVER_URL || 
			'http://localhost:8800';
	}

	protected async setupInternalActionListeners(): Promise<void> {
		// Setup internal action listeners for EE
	}

	protected async onEnableHomeserver(): Promise<void> {
		await super.setupHomeserver();
		await this.startHomeserver();
	}

	protected async onDisableHomeserver(): Promise<void> {
		await this.stopHomeserver();
	}

	private async startHomeserver(): Promise<void> {
		if (!this.isHomeserverEnabled()) {
			return;
		}
		// Start homeserver EE features
	}

	private async stopHomeserver(): Promise<void> {
		// Stop homeserver EE features
	}

	public async started(): Promise<void> {
		await super.setupHomeserver();
		await this.startHomeserver();
	}

	public async stopped(): Promise<void> {
		await this.stopHomeserver();
		await super.stopped();
	}
}

export class HomeserverServiceEE extends AbstractBaseHomeserverServiceEE implements IHomeserverServiceEE {
	protected name = 'homeserver-enterprise';

	static async createHomeserverService(): Promise<HomeserverServiceEE> {
		const homeserverService = new HomeserverServiceEE();
		await homeserverService.initialize();
		return homeserverService;
	}

	async started(): Promise<void> {
		return super.started();
	}

	async stopped(): Promise<void> {
		return super.stopped();
	}

	public async verifyConfiguration(): Promise<void> {
		return super.verifyConfiguration();
	}

	public async configurationStatus(): Promise<any> {
		return super.configurationStatus();
	}

	public async getUserProfile(userId: string): Promise<any> {
		return super.getUserProfile(userId);
	}

	public async sendFederationTransaction(txnId: string, pdus: any[], edus: any[]): Promise<void> {
		return super.sendFederationTransaction(txnId, pdus, edus);
	}

	public async makeJoin(roomId: string, userId: string): Promise<any> {
		return super.makeJoin(roomId, userId);
	}

	public async sendJoin(roomId: string, eventId: string, event: any): Promise<any> {
		return super.sendJoin(roomId, eventId, event);
	}

	public async getRoomState(roomId: string, eventId?: string): Promise<any> {
		return super.getRoomState(roomId, eventId);
	}

	public async queryKeys(deviceKeys: any): Promise<any> {
		return super.queryKeys(deviceKeys);
	}

	public async sendEvent(roomId: string, event: any): Promise<void> {
		return super.sendEvent(roomId, event);
	}

	public async joinRoom(roomId: string, serverName: string): Promise<void> {
		return super.joinRoom(roomId, serverName);
	}

	public async leaveRoom(roomId: string): Promise<void> {
		return super.leaveRoom(roomId);
	}

	public async inviteUser(userId: string, roomId: string): Promise<void> {
		return super.inviteUser(userId, roomId);
	}

	public async discoverServer(serverName: string): Promise<any> {
		return super.discoverServer(serverName);
	}
}