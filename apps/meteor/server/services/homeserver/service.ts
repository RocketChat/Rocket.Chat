import { ServiceClassInternal } from '@rocket.chat/core-services';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import type { RocketChatSettingsAdapter } from '../federation/infrastructure/rocket-chat/adapters/Settings';
import { FederationFactory } from '../federation/infrastructure/Factory';
import { homeserverLogger } from './logger';

function extractError(e: unknown) {
	if (e instanceof Error || (typeof e === 'object' && e && 'toString' in e)) {
		if ('name' in e && e.name === 'AbortError') {
			return 'Operation timed out';
		}

		return e.toString();
	}

	homeserverLogger.error(e);

	return 'Unknown error';
}

export interface IHomeserverConfigurationStatus {
	serverVersion: {
		name: string;
		version: string;
	};
	wellKnown: {
		server: boolean;
		client: boolean;
	};
	health: {
		ok: boolean;
		error?: string;
	};
}

export abstract class AbstractHomeserverService extends ServiceClassInternal {
	private cancelSettingsObserver: () => void;

	private internalSettingsAdapter: RocketChatSettingsAdapter;

	private isRunning = false;

	protected homeserverUrl: string;

	protected abstract setupInternalActionListeners(): Promise<void>;

	protected abstract onEnableHomeserver(): Promise<void>;

	protected abstract onDisableHomeserver(): Promise<void>;

	constructor(internalSettingsAdapter: RocketChatSettingsAdapter) {
		super();
		this.internalSettingsAdapter = internalSettingsAdapter;
	}

	private async onHomeserverEnabledSettingChange(isHomeserverEnabled: boolean): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		if (isHomeserverEnabled) {
			await this.onDisableHomeserver();
			await this.onEnableHomeserver();
			await this.verifyConfiguration();
			return;
		}

		return this.onDisableHomeserver();
	}

	public async initialize() {
		this.internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		await this.internalSettingsAdapter.initialize();
		this.cancelSettingsObserver = this.internalSettingsAdapter.onFederationEnabledStatusChanged(
			this.onHomeserverEnabledSettingChange.bind(this),
		);
	}

	protected getInternalSettingsAdapter(): RocketChatSettingsAdapter {
		return this.internalSettingsAdapter;
	}

	protected isHomeserverEnabled(): boolean {
		return this.internalSettingsAdapter.isFederationEnabled();
	}

	protected async setupHomeserver(): Promise<void> {
		if (this.isHomeserverEnabled()) {
			await this.setupInternalActionListeners();
		}
		this.isRunning = true;
	}

	protected async cleanUpSettingObserver(): Promise<void> {
		this.cancelSettingsObserver();
		this.isRunning = false;
	}

	public async verifyConfiguration(): Promise<void> {
		try {
			const status = await this.configurationStatus();
			
			if (!status.health.ok) {
				throw new Error('Homeserver health check failed');
			}

			homeserverLogger.info('Homeserver configuration is valid');
		} catch (error) {
			homeserverLogger.error(error);
		}
	}

	public async configurationStatus(): Promise<IHomeserverConfigurationStatus> {
		const status: IHomeserverConfigurationStatus = {
			serverVersion: {
				name: '',
				version: '',
			},
			wellKnown: {
				server: false,
				client: false,
			},
			health: {
				ok: false,
			},
		};

		try {
			const serverVersionResponse = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/version`);
			const serverVersion = await serverVersionResponse.json();
			status.serverVersion = serverVersion.server;

			const healthResponse = await fetch(`${this.homeserverUrl}/health`);
			status.health.ok = healthResponse.ok;

			const wellKnownServerResponse = await fetch(`${this.homeserverUrl}/.well-known/matrix/server`);
			status.wellKnown.server = wellKnownServerResponse.ok;

			const wellKnownClientResponse = await fetch(`${this.homeserverUrl}/.well-known/matrix/client`);
			status.wellKnown.client = wellKnownClientResponse.ok;
		} catch (error) {
			status.health.error = extractError(error);
		}

		return status;
	}

	public async getUserProfile(userId: string): Promise<any> {
		const response = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/query/profile?user_id=${encodeURIComponent(userId)}`);
		if (!response.ok) {
			throw new Error(`Failed to get user profile: ${response.statusText}`);
		}
		return response.json();
	}

	public async sendFederationTransaction(txnId: string, pdus: any[], edus: any[]): Promise<void> {
		const response = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/send/${txnId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ pdus, edus }),
		});

		if (!response.ok) {
			throw new Error(`Failed to send federation transaction: ${response.statusText}`);
		}
	}

	public async makeJoin(roomId: string, userId: string): Promise<any> {
		const response = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/make_join/${roomId}/${userId}`);
		if (!response.ok) {
			throw new Error(`Failed to make join: ${response.statusText}`);
		}
		return response.json();
	}

	public async sendJoin(roomId: string, eventId: string, event: any): Promise<any> {
		const response = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/send_join/${roomId}/${eventId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(event),
		});

		if (!response.ok) {
			throw new Error(`Failed to send join: ${response.statusText}`);
		}
		return response.json();
	}

	public async getRoomState(roomId: string, eventId?: string): Promise<any> {
		const url = `${this.homeserverUrl}/_matrix/federation/v1/state/${roomId}${eventId ? `?event_id=${eventId}` : ''}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to get room state: ${response.statusText}`);
		}
		return response.json();
	}

	public async getRoomStateIds(roomId: string, eventId?: string): Promise<any> {
		const url = `${this.homeserverUrl}/_matrix/federation/v1/state_ids/${roomId}${eventId ? `?event_id=${eventId}` : ''}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to get room state IDs: ${response.statusText}`);
		}
		return response.json();
	}

	public async queryKeys(deviceKeys: any): Promise<any> {
		const response = await fetch(`${this.homeserverUrl}/_matrix/federation/v1/user/keys/query`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ device_keys: deviceKeys }),
		});

		if (!response.ok) {
			throw new Error(`Failed to query keys: ${response.statusText}`);
		}
		return response.json();
	}

	public async sendEvent(roomId: string, event: any): Promise<void> {
		const response = await fetch(`${this.homeserverUrl}/api/v1/federation/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ roomId, event }),
		});

		if (!response.ok) {
			throw new Error(`Failed to send event: ${response.statusText}`);
		}
	}

	public async joinRoom(roomId: string, serverName: string): Promise<void> {
		const response = await fetch(`${this.homeserverUrl}/api/v1/federation/join`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ roomId, serverName }),
		});

		if (!response.ok) {
			throw new Error(`Failed to join room: ${response.statusText}`);
		}
	}

	public async leaveRoom(roomId: string): Promise<void> {
		const response = await fetch(`${this.homeserverUrl}/api/v1/federation/leave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ roomId }),
		});

		if (!response.ok) {
			throw new Error(`Failed to leave room: ${response.statusText}`);
		}
	}

	public async inviteUser(userId: string, roomId: string): Promise<void> {
		const response = await fetch(`${this.homeserverUrl}/api/v1/federation/invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ userId, roomId }),
		});

		if (!response.ok) {
			throw new Error(`Failed to invite user: ${response.statusText}`);
		}
	}

	public async discoverServer(serverName: string): Promise<any> {
		const response = await fetch(`${this.homeserverUrl}/api/v1/federation/discover/${serverName}`);
		if (!response.ok) {
			throw new Error(`Failed to discover server: ${response.statusText}`);
		}
		return response.json();
	}
}

abstract class AbstractBaseHomeserverService extends AbstractHomeserverService {
	constructor() {
		const internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		super(internalSettingsAdapter);
		// Get homeserver URL from environment or settings
		this.homeserverUrl = process.env.HOMESERVER_URL || 
			process.env.EXTERNAL_HOMESERVER_URL || 
			'http://localhost:8448';
	}

	protected async setupInternalActionListeners(): Promise<void> {
		// Setup internal action listeners
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
		homeserverLogger.info('Starting Homeserver integration');
		homeserverLogger.info(`Homeserver URL: ${this.homeserverUrl}`);
		
		// Test connection to external homeserver
		try {
			const response = await fetch(`${this.homeserverUrl}/health`);
			if (response.ok) {
				homeserverLogger.info('Successfully connected to external homeserver');
			} else {
				homeserverLogger.warn(`External homeserver health check failed: ${response.status}`);
			}
		} catch (error) {
			homeserverLogger.error('Failed to connect to external homeserver:', error);
		}
	}

	private async stopHomeserver(): Promise<void> {
		homeserverLogger.info('Stopping Homeserver integration');
	}

	public async stopped(): Promise<void> {
		await this.stopHomeserver();
		await super.cleanUpSettingObserver();
	}

	public async started(): Promise<void> {
		await super.setupHomeserver();
		await this.startHomeserver();
	}
}

export class HomeserverService extends AbstractBaseHomeserverService {
	protected name = 'homeserver';

	static async createHomeserverService(): Promise<HomeserverService> {
		const homeserverService = new HomeserverService();
		await homeserverService.initialize();
		return homeserverService;
	}

	public async stopped(): Promise<void> {
		return super.stopped();
	}

	public async started(): Promise<void> {
		return super.started();
	}

	public async verifyConfiguration(): Promise<void> {
		return super.verifyConfiguration();
	}

	public async configurationStatus(): Promise<IHomeserverConfigurationStatus> {
		return super.configurationStatus();
	}

	public async getRoomStateIds(roomId: string, eventId?: string): Promise<any> {
		return super.getRoomStateIds(roomId, eventId);
	}
}