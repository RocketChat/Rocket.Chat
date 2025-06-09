import { ServiceClassInternal } from '@rocket.chat/core-services';
import { container } from 'tsyringe';

import { createHomeserverContainer, getHomeserverRoutes } from './container';
import { RocketChatEventBridge } from './adapters/RocketChatEventBridge';
import { homeserverLogger } from '../homeserver/logger';

/**
 * Rocket.Chat service that integrates the homeserver module
 * Uses tsyringe internally but presents a standard Rocket.Chat service interface
 */
export class HomeserverIntegrationService extends ServiceClassInternal {
	protected name = 'homeserver-integration';
	
	private homeserverContainer: any;
	private eventBridge: RocketChatEventBridge;
	private routeHandlers: any[] = [];

	async created(): Promise<void> {
		// Initialize the homeserver container with tsyringe
		this.homeserverContainer = createHomeserverContainer();
		
		// Get the event bridge to sync between Matrix and Rocket.Chat
		this.eventBridge = this.homeserverContainer.resolve('EventBridge');

		// Get route handlers from homeserver
		this.routeHandlers = getHomeserverRoutes();

		homeserverLogger.info('Homeserver integration service created');
	}

	async started(): Promise<void> {
		// Set up event listeners for Rocket.Chat events
		this.setupRocketChatEventListeners();

		// Initialize homeserver services
		await this.initializeHomeserverServices();

		homeserverLogger.info('Homeserver integration service started');
	}

	private setupRocketChatEventListeners(): void {
		// Listen for Rocket.Chat room creation
		this.onEvent('room.created', async (room) => {
			if (room.federated) {
				// Create corresponding Matrix room
				const roomService = this.homeserverContainer.resolve('RoomService');
				const matrixRoomId = await roomService.createRoom(room.u._id, {
					name: room.name,
					topic: room.description,
				});

				// Link the rooms
				await this.eventBridge.linkRoom(room._id, matrixRoomId);
			}
		});

		// Listen for messages
		this.onEvent('message.sent', async (message) => {
			const room = await this.getRoomById(message.rid);
			if (room?.federated && room.federationId) {
				// Send to Matrix
				const messageService = this.homeserverContainer.resolve('MessageService');
				await messageService.sendMessage({
					room_id: room.federationId,
					sender: message.u._id,
					type: 'm.room.message',
					content: {
						msgtype: 'm.text',
						body: message.msg,
					},
				});
			}
		});

		// Listen for user joins
		this.onEvent('user.joined', async ({ user, room }) => {
			if (room.federated && room.federationId) {
				const inviteService = this.homeserverContainer.resolve('InviteService');
				await inviteService.inviteUserToRoom(room.federationId, user._id, 'system');
			}
		});
	}

	private async initializeHomeserverServices(): Promise<void> {
		// Initialize database collections
		const dbAdapter = this.homeserverContainer.resolve('DatabaseAdapter');
		
		// Ensure indexes are created
		await dbAdapter.events.createIndex({ event_id: 1 }, { unique: true });
		await dbAdapter.rooms.createIndex({ room_id: 1 }, { unique: true });
		await dbAdapter.transactions.createIndex({ transaction_id: 1, origin: 1 }, { unique: true });
	}

	/**
	 * Get route handlers for registration with Rocket.Chat API
	 */
	getRouteHandlers() {
		return this.routeHandlers;
	}

	/**
	 * Handle incoming federation request
	 */
	async handleFederationRequest(path: string, method: string, params: any, body: any, headers: any) {
		// Find matching route handler
		const handler = this.routeHandlers.find(h => 
			h.path === path && h.method === method
		);

		if (!handler) {
			throw new Error('Route not found');
		}

		// Create context object matching homeserver's interface
		const context = {
			params,
			query: params,
			body,
			headers,
			set: {
				status: (code: number) => {
					// Handle status setting
				},
				headers: (headers: Record<string, string>) => {
					// Handle headers
				},
			},
		};

		// Call the handler
		return handler.handler(context);
	}

	private async getRoomById(roomId: string): Promise<any> {
		// This would use Rocket.Chat's room service
		// Placeholder for now
		return null;
	}

	async stopped(): Promise<void> {
		homeserverLogger.info('Homeserver integration service stopped');
	}
}