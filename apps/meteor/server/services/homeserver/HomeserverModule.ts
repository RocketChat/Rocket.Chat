import 'reflect-metadata';
import { container, injectable, singleton } from 'tsyringe';
import { ServiceClassInternal } from '@rocket.chat/core-services';

// Import homeserver services directly
import { EventService } from '@homeserver/services/EventService';
import { RoomService } from '@homeserver/services/RoomService';
import { UserService } from '@homeserver/services/UserService';
import { FederationService } from '@homeserver/services/FederationService';
import { MessageService } from '@homeserver/services/MessageService';
import { InviteService } from '@homeserver/services/InviteService';

// Import homeserver repositories
import { EventRepository } from '@homeserver/repositories/EventRepository';
import { RoomRepository } from '@homeserver/repositories/RoomRepository';
import { UserRepository } from '@homeserver/repositories/UserRepository';

// Create interfaces for Rocket.Chat integration
export interface IHomeserverModule {
	sendEvent(roomId: string, event: any): Promise<void>;
	createRoom(creatorId: string, roomOptions: any): Promise<string>;
	inviteUser(roomId: string, userId: string, inviterId: string): Promise<void>;
	sendMessage(roomId: string, senderId: string, content: string): Promise<void>;
	getUserProfile(userId: string): Promise<any>;
	getRoomState(roomId: string): Promise<any>;
}

// Adapter to bridge Rocket.Chat settings to homeserver config
@injectable()
@singleton()
export class HomeserverConfigAdapter {
	getServerName(): string {
		// Get from Rocket.Chat settings
		return process.env.HOMESERVER_DOMAIN || 'localhost';
	}

	getSigningKey(): string {
		// In production, this would come from Rocket.Chat's database
		return process.env.HOMESERVER_SIGNING_KEY || '';
	}
}

// The main homeserver module that integrates with Rocket.Chat
@injectable()
@singleton()
export class HomeserverModule implements IHomeserverModule {
	constructor(
		private eventService: EventService,
		private roomService: RoomService,
		private userService: UserService,
		private federationService: FederationService,
		private messageService: MessageService,
		private inviteService: InviteService,
		private config: HomeserverConfigAdapter,
	) {}

	async sendEvent(roomId: string, event: any): Promise<void> {
		return this.eventService.processIncomingEvent({
			room_id: roomId,
			...event,
		});
	}

	async createRoom(creatorId: string, roomOptions: any): Promise<string> {
		return this.roomService.createRoom(creatorId, roomOptions);
	}

	async inviteUser(roomId: string, userId: string, inviterId: string): Promise<void> {
		return this.inviteService.inviteUserToRoom(roomId, userId, inviterId);
	}

	async sendMessage(roomId: string, senderId: string, content: string): Promise<void> {
		return this.messageService.sendMessage({
			room_id: roomId,
			sender: senderId,
			type: 'm.room.message',
			content: {
				msgtype: 'm.text',
				body: content,
			},
		});
	}

	async getUserProfile(userId: string): Promise<any> {
		return this.userService.getProfile(userId);
	}

	async getRoomState(roomId: string): Promise<any> {
		return this.roomService.getRoomState(roomId);
	}
}

// Import adapters
import { RocketChatDatabaseAdapter, DatabaseConnectionAdapter } from './adapters/RocketChatDatabaseAdapter';
import { SigningKeyAdapter } from './adapters/SigningKeyAdapter';

// Register all homeserver services in the DI container
export function registerHomeserverServices(): void {
	// Register Rocket.Chat adapters
	container.register('RocketChatDatabaseAdapter', { useClass: RocketChatDatabaseAdapter });
	container.register('DatabaseConnectionAdapter', { useClass: DatabaseConnectionAdapter });
	container.register('SigningKeyAdapter', { useClass: SigningKeyAdapter });
	container.register('HomeserverConfigAdapter', { useClass: HomeserverConfigAdapter });
	
	// Override homeserver's database connection with our adapter
	container.register('DatabaseConnection', { useToken: 'DatabaseConnectionAdapter' });
	
	// Register repositories (they'll use our database adapter)
	container.register('EventRepository', { useClass: EventRepository });
	container.register('RoomRepository', { useClass: RoomRepository });
	container.register('UserRepository', { useClass: UserRepository });
	
	// Register services
	container.register('EventService', { useClass: EventService });
	container.register('RoomService', { useClass: RoomService });
	container.register('UserService', { useClass: UserService });
	container.register('FederationService', { useClass: FederationService });
	container.register('MessageService', { useClass: MessageService });
	container.register('InviteService', { useClass: InviteService });
	
	// Register the main module
	container.register('HomeserverModule', { useClass: HomeserverModule });
}

// Export a factory function to create the module
export function createHomeserverModule(): HomeserverModule {
	registerHomeserverServices();
	return container.resolve(HomeserverModule);
}