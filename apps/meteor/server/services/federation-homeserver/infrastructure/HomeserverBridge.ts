import type { 
	HomeserverUser, 
	HomeserverRoom, 
	HomeserverMessage, 
	HomeserverEvent, 
	IHomeserverConfig,
	IFederationHomeserverBridge
} from '@rocket.chat/core-services';
import { HomeserverClient } from '@rocket.chat/homeserver';
import { RoomServiceReceiver } from '../application/room/receiver/RoomServiceReceiver';
import { RoomServiceSender } from '../application/room/sender/RoomServiceSender';
import { MessageServiceReceiver } from '../application/message/receiver/MessageServiceReceiver';
import { MessageServiceSender } from '../application/message/sender/MessageServiceSender';
import { UserServiceReceiver } from '../application/user/receiver/UserServiceReceiver';
import { UserServiceSender } from '../application/user/sender/UserServiceSender';
import { RoomAdapter, UserAdapter, MessageAdapter, NotificationAdapter } from './rocket-chat/adapters';
import { RoomConverter } from './rocket-chat/converters/RoomConverter';
import { MessageConverter } from './rocket-chat/converters/MessageConverter';
import { UserConverter } from './rocket-chat/converters/UserConverter';

export class HomeserverBridge implements IFederationHomeserverBridge {
	private client: HomeserverClient;
	private running = false;
	private eventCallback?: (event: HomeserverEvent) => Promise<void>;
	
	// Service instances
	private roomServiceReceiver?: RoomServiceReceiver;
	private roomServiceSender?: RoomServiceSender;
	private messageServiceReceiver?: MessageServiceReceiver;
	private messageServiceSender?: MessageServiceSender;
	private userServiceReceiver?: UserServiceReceiver;
	private userServiceSender?: UserServiceSender;
	
	// Adapter instances
	private roomAdapter?: RoomAdapter;
	private userAdapter?: UserAdapter;
	private messageAdapter?: MessageAdapter;
	private notificationAdapter?: NotificationAdapter;
	
	// Converter instances
	private roomConverter?: RoomConverter;
	private messageConverter?: MessageConverter;
	private userConverter?: UserConverter;

	constructor(private config: IHomeserverConfig) {
		this.client = new HomeserverClient({
			url: config.url,
			domain: config.domain,
			appServiceToken: config.appServiceToken,
			homeserverToken: config.homeserverToken,
		});
	}

	public async start(): Promise<void> {
		if (this.running) {
			console.log('[HomeserverBridge] Already running');
			return;
		}

		console.log('[HomeserverBridge] Starting bridge on port', this.config.bridgePort);
		
		try {
			// Initialize adapters
			this.roomAdapter = new RoomAdapter(this.config.domain);
			this.userAdapter = new UserAdapter(this.config.domain);
			this.messageAdapter = new MessageAdapter(this.config.domain);
			this.notificationAdapter = new NotificationAdapter(this.config.domain);
			
			// Initialize converters
			this.roomConverter = new RoomConverter(this.config.domain);
			this.messageConverter = new MessageConverter(this.config.domain);
			this.userConverter = new UserConverter(this.config.domain);
			
			// Initialize services with dependencies
			this.roomServiceReceiver = new RoomServiceReceiver(
				this.roomAdapter,
				this.userAdapter,
				this.roomConverter,
			);
			
			this.roomServiceSender = new RoomServiceSender(
				this.roomAdapter,
				this.userAdapter,
				this.roomConverter,
				this,
			);
			
			this.messageServiceReceiver = new MessageServiceReceiver(
				this.messageAdapter,
				this.roomAdapter,
				this.userAdapter,
				this.messageConverter,
			);
			
			this.messageServiceSender = new MessageServiceSender(
				this.messageAdapter,
				this.roomAdapter,
				this.userAdapter,
				this.messageConverter,
				this,
			);
			
			this.userServiceReceiver = new UserServiceReceiver(
				this.userAdapter,
				this.userConverter,
			);
			
			this.userServiceSender = new UserServiceSender(
				this.userAdapter,
				this.userConverter,
				this,
			);
			
			// Connect to homeserver
			await this.client.connect();
		
		// Set up event handlers
		this.client.onEvent({
			onMessage: async (message) => {
				if (this.eventCallback) {
					await this.eventCallback({
						type: 'message.new',
						id: message.id,
						timestamp: message.timestamp,
						data: message,
					});
				}
			},
			onRoomCreate: async (room) => {
				if (this.eventCallback) {
					await this.eventCallback({
						type: 'room.create',
						id: room.id,
						timestamp: Date.now(),
						data: room,
					});
				}
			},
			onMemberJoin: async (roomId, userId) => {
				if (this.eventCallback) {
					await this.eventCallback({
						type: 'room.member.join',
						id: `${roomId}-${userId}`,
						timestamp: Date.now(),
						data: { roomId, userId },
					});
				}
			},
			onMemberLeave: async (roomId, userId) => {
				if (this.eventCallback) {
					await this.eventCallback({
						type: 'room.member.leave',
						id: `${roomId}-${userId}`,
						timestamp: Date.now(),
						data: { roomId, userId },
					});
				}
			},
			onUserUpdate: async (user) => {
				if (this.eventCallback) {
					await this.eventCallback({
						type: 'user.profile.update',
						id: user.id,
						timestamp: Date.now(),
						data: user,
					});
				}
			},
		});

		// Routes are registered by the service, no need for separate HTTP server
		
		this.running = true;
		console.log('[HomeserverBridge] Bridge started successfully');
		} catch (error) {
			console.error('[HomeserverBridge] Failed to start bridge:', error);
			// Clean up on error
			await this.cleanupServices();
			throw error;
		}
	}

	public async handleIncomingEvent(event: HomeserverEvent): Promise<void> {
		console.log('[HomeserverBridge] Handling incoming event:', event.type, event.id);
		
		// Emit to registered event callback
		if (this.eventCallback) {
			await this.eventCallback(event);
		} else {
			console.warn('[HomeserverBridge] No event callback registered');
		}
	}

	public async stop(): Promise<void> {
		if (!this.running) {
			console.log('[HomeserverBridge] Not running');
			return;
		}

		console.log('[HomeserverBridge] Stopping bridge');
		
		try {
			await this.client.disconnect();
			
			// Clean up services
			await this.cleanupServices();
			
			// Routes remain registered but will return disabled status
			
			this.running = false;
			console.log('[HomeserverBridge] Bridge stopped successfully');
		} catch (error) {
			console.error('[HomeserverBridge] Failed to stop bridge:', error);
			throw error;
		}
	}
	
	private async cleanupServices(): Promise<void> {
		// Clean up services
		this.roomServiceReceiver = undefined;
		this.roomServiceSender = undefined;
		this.messageServiceReceiver = undefined;
		this.messageServiceSender = undefined;
		this.userServiceReceiver = undefined;
		this.userServiceSender = undefined;
		
		// Clean up adapters
		this.roomAdapter = undefined;
		this.userAdapter = undefined;
		this.messageAdapter = undefined;
		this.notificationAdapter = undefined;
		
		// Clean up converters
		this.roomConverter = undefined;
		this.messageConverter = undefined;
		this.userConverter = undefined;
	}

	public isRunning(): boolean {
		return this.running;
	}

	// User operations
	public async createUser(username: string, displayName: string): Promise<string> {
		const user = await this.client.createUser(username, displayName);
		return user.id;
	}

	public async getUserProfile(userId: string): Promise<HomeserverUser | null> {
		return this.client.getUserProfile(userId);
	}

	public async updateUserProfile(userId: string, displayName?: string, avatarUrl?: string): Promise<void> {
		// Not implemented in dummy client yet
		console.log('[HomeserverBridge] Update user profile:', userId, displayName, avatarUrl);
	}

	// Room operations
	public async createRoom(name: string, topic?: string, isPublic?: boolean): Promise<string> {
		const room = await this.client.createRoom(name, topic);
		return room.id;
	}

	public async joinRoom(roomId: string, userId: string): Promise<void> {
		await this.client.joinRoom(roomId, userId);
	}

	public async leaveRoom(roomId: string, userId: string): Promise<void> {
		await this.client.leaveRoom(roomId, userId);
	}

	public async getRoomInfo(roomId: string): Promise<HomeserverRoom | null> {
		// Not implemented in dummy client yet
		console.log('[HomeserverBridge] Get room info:', roomId);
		return null;
	}

	public async updateRoomName(roomId: string, name: string): Promise<void> {
		// Not implemented in dummy client yet
		console.log('[HomeserverBridge] Update room name:', roomId, name);
	}

	public async updateRoomTopic(roomId: string, topic: string): Promise<void> {
		// Not implemented in dummy client yet
		console.log('[HomeserverBridge] Update room topic:', roomId, topic);
	}

	// Message operations
	public async sendMessage(roomId: string, userId: string, message: string): Promise<string> {
		const msg = await this.client.sendMessage(roomId, userId, message);
		return msg.id;
	}

	public async editMessage(messageId: string, newContent: string): Promise<void> {
		await this.client.editMessage(messageId, newContent);
	}

	public async deleteMessage(messageId: string): Promise<void> {
		await this.client.deleteMessage(messageId);
	}

	public async sendFileMessage(roomId: string, userId: string, file: Buffer, fileName: string, mimeType: string): Promise<string> {
		// Not implemented in dummy client yet
		console.log('[HomeserverBridge] Send file message:', roomId, userId, fileName, mimeType);
		return `$file-${Math.random().toString(36).substring(7)}:${this.config.domain}`;
	}

	// Event handling
	public onEvent(callback: (event: HomeserverEvent) => Promise<void>): void {
		this.eventCallback = callback;
	}

	// Utilities
	public extractHomeserverDomain(identifier: string): string {
		const colonIndex = identifier.indexOf(':');
		if (colonIndex === -1) {
			return 'local';
		}
		return identifier.substring(colonIndex + 1);
	}

	public isUserFromHomeserver(userId: string): boolean {
		const domain = this.extractHomeserverDomain(userId);
		return domain === this.config.domain || domain === 'local';
	}

	public isRoomFromHomeserver(roomId: string): boolean {
		const domain = this.extractHomeserverDomain(roomId);
		return domain === this.config.domain || domain === 'local';
	}
	
	// Get service instances
	public getRoomServiceReceiver(): RoomServiceReceiver {
		if (!this.roomServiceReceiver) {
			throw new Error('Room service receiver not initialized');
		}
		return this.roomServiceReceiver;
	}

	public getRoomServiceSender(): RoomServiceSender {
		if (!this.roomServiceSender) {
			throw new Error('Room service sender not initialized');
		}
		return this.roomServiceSender;
	}

	public getMessageServiceReceiver(): MessageServiceReceiver {
		if (!this.messageServiceReceiver) {
			throw new Error('Message service receiver not initialized');
		}
		return this.messageServiceReceiver;
	}

	public getMessageServiceSender(): MessageServiceSender {
		if (!this.messageServiceSender) {
			throw new Error('Message service sender not initialized');
		}
		return this.messageServiceSender;
	}

	public getUserServiceReceiver(): UserServiceReceiver {
		if (!this.userServiceReceiver) {
			throw new Error('User service receiver not initialized');
		}
		return this.userServiceReceiver;
	}

	public getUserServiceSender(): UserServiceSender {
		if (!this.userServiceSender) {
			throw new Error('User service sender not initialized');
		}
		return this.userServiceSender;
	}

	// Get adapter instances (for direct access if needed)
	public getRoomAdapter(): RoomAdapter {
		if (!this.roomAdapter) {
			throw new Error('Room adapter not initialized');
		}
		return this.roomAdapter;
	}

	public getUserAdapter(): UserAdapter {
		if (!this.userAdapter) {
			throw new Error('User adapter not initialized');
		}
		return this.userAdapter;
	}

	public getMessageAdapter(): MessageAdapter {
		if (!this.messageAdapter) {
			throw new Error('Message adapter not initialized');
		}
		return this.messageAdapter;
	}

	public getNotificationAdapter(): NotificationAdapter {
		if (!this.notificationAdapter) {
			throw new Error('Notification adapter not initialized');
		}
		return this.notificationAdapter;
	}
}