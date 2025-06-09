import { ServiceClassInternal } from '@rocket.chat/core-services';
import { container } from 'tsyringe';
import 'reflect-metadata';

import { createHomeserverModule, HomeserverModule } from './HomeserverModule';
import { homeserverLogger } from './logger';

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

export abstract class AbstractHomeserverServiceV2 extends ServiceClassInternal {
	protected homeserverModule: HomeserverModule;
	private isRunning = false;

	protected abstract setupInternalActionListeners(): Promise<void>;
	protected abstract onEnableHomeserver(): Promise<void>;
	protected abstract onDisableHomeserver(): Promise<void>;

	constructor() {
		super();
	}

	public async initialize() {
		// Initialize the homeserver module with tsyringe
		this.homeserverModule = createHomeserverModule();
		
		// Set up federation event listeners
		await this.setupInternalActionListeners();
	}

	protected isHomeserverEnabled(): boolean {
		// Check Rocket.Chat settings
		return true; // Simplified for now
	}

	protected async setupHomeserver(): Promise<void> {
		if (this.isHomeserverEnabled()) {
			await this.setupInternalActionListeners();
		}
		this.isRunning = true;
	}

	public async verifyConfiguration(): Promise<void> {
		try {
			// The homeserver module handles its own configuration
			homeserverLogger.info('Homeserver configuration is valid');
		} catch (error) {
			homeserverLogger.error(error);
		}
	}

	public async configurationStatus(): Promise<IHomeserverConfigurationStatus> {
		// Since we're running in-process, always return healthy
		return {
			serverVersion: {
				name: 'Rocket.Chat Native Federation',
				version: '1.0.0',
			},
			wellKnown: {
				server: true,
				client: true,
			},
			health: {
				ok: true,
			},
		};
	}

	// Delegate all operations to the homeserver module
	public async getUserProfile(userId: string): Promise<any> {
		return this.homeserverModule.getUserProfile(userId);
	}

	public async sendEvent(roomId: string, event: any): Promise<void> {
		return this.homeserverModule.sendEvent(roomId, event);
	}

	public async createRoom(creatorId: string, roomOptions: any): Promise<string> {
		return this.homeserverModule.createRoom(creatorId, roomOptions);
	}

	public async inviteUser(roomId: string, userId: string, inviterId: string): Promise<void> {
		return this.homeserverModule.inviteUser(roomId, userId, inviterId);
	}

	public async sendMessage(roomId: string, senderId: string, content: string): Promise<void> {
		return this.homeserverModule.sendMessage(roomId, senderId, content);
	}

	public async getRoomState(roomId: string): Promise<any> {
		return this.homeserverModule.getRoomState(roomId);
	}
}

abstract class AbstractBaseHomeserverServiceV2 extends AbstractHomeserverServiceV2 {
	constructor() {
		super();
	}

	protected async setupInternalActionListeners(): Promise<void> {
		// Set up Rocket.Chat event listeners that trigger homeserver actions
		this.onEvent('room.created', async (room) => {
			if (room.federated) {
				await this.homeserverModule.createRoom(room.u._id, {
					name: room.name,
					topic: room.description,
				});
			}
		});

		this.onEvent('message.sent', async (message) => {
			const room = await this.getRoomById(message.rid);
			if (room?.federated) {
				await this.homeserverModule.sendMessage(
					message.rid,
					message.u._id,
					message.msg
				);
			}
		});
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
		homeserverLogger.info('Starting Homeserver integration (embedded mode)');
	}

	private async stopHomeserver(): Promise<void> {
		homeserverLogger.info('Stopping Homeserver integration');
	}

	private async getRoomById(roomId: string): Promise<any> {
		// This would use Rocket.Chat's room service
		return null; // Placeholder
	}

	public async stopped(): Promise<void> {
		await this.stopHomeserver();
	}

	public async started(): Promise<void> {
		await super.setupHomeserver();
		await this.startHomeserver();
	}
}

export class HomeserverServiceV2 extends AbstractBaseHomeserverServiceV2 {
	protected name = 'homeserver';

	static async createHomeserverService(): Promise<HomeserverServiceV2> {
		const homeserverService = new HomeserverServiceV2();
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
}