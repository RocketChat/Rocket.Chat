import type { HomeserverUser, HomeserverRoom, HomeserverMessage, HomeserverEvent, IHomeserverConfig } from '@rocket.chat/core-services';
import { HomeserverClient } from '@rocket.chat/homeserver';
import type { IFederationHomeserverBridge } from '../domain/IFederationHomeserverBridge';

export class HomeserverBridge implements IFederationHomeserverBridge {
	private client: HomeserverClient;
	private running = false;
	private eventCallback?: (event: HomeserverEvent) => Promise<void>;

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
		
		await this.client.disconnect();
		
		// Routes remain registered but will return disabled status
		
		this.running = false;
		console.log('[HomeserverBridge] Bridge stopped successfully');
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
}