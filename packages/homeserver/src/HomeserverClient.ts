import type { HomeserverConfig, HomeserverEventCallbacks, HomeserverMessage, HomeserverRoom, HomeserverUser } from './types';

/**
 * Dummy Homeserver Client for development
 * This simulates a homeserver protocol client
 */
export class HomeserverClient {
	private config: HomeserverConfig;
	private connected = false;
	private eventCallbacks: HomeserverEventCallbacks = {};
	
	constructor(config: HomeserverConfig) {
		this.config = config;
	}

	async connect(): Promise<void> {
		console.log(`[HomeserverClient] Connecting to ${this.config.url}`);
		// Simulate connection delay
		await new Promise(resolve => setTimeout(resolve, 100));
		this.connected = true;
		console.log('[HomeserverClient] Connected successfully');
	}

	async disconnect(): Promise<void> {
		console.log('[HomeserverClient] Disconnecting');
		this.connected = false;
	}

	isConnected(): boolean {
		return this.connected;
	}

	// User operations
	async createUser(username: string, displayName?: string): Promise<HomeserverUser> {
		const user: HomeserverUser = {
			id: `@${username}:${this.config.domain}`,
			username,
			displayName: displayName || username,
		};
		console.log('[HomeserverClient] Created user:', user);
		return user;
	}

	async getUserProfile(userId: string): Promise<HomeserverUser | null> {
		// Simulate fetching user
		if (!userId.startsWith('@')) {
			return null;
		}
		const [username] = userId.substring(1).split(':');
		return {
			id: userId,
			username,
			displayName: username,
		};
	}

	// Room operations
	async createRoom(name: string, topic?: string): Promise<HomeserverRoom> {
		const room: HomeserverRoom = {
			id: `!${Math.random().toString(36).substring(7)}:${this.config.domain}`,
			name,
			topic,
			members: [],
		};
		console.log('[HomeserverClient] Created room:', room);
		return room;
	}

	async joinRoom(roomId: string, userId: string): Promise<void> {
		console.log(`[HomeserverClient] User ${userId} joined room ${roomId}`);
		if (this.eventCallbacks.onMemberJoin) {
			await this.eventCallbacks.onMemberJoin(roomId, userId);
		}
	}

	async leaveRoom(roomId: string, userId: string): Promise<void> {
		console.log(`[HomeserverClient] User ${userId} left room ${roomId}`);
		if (this.eventCallbacks.onMemberLeave) {
			await this.eventCallbacks.onMemberLeave(roomId, userId);
		}
	}

	// Message operations
	async sendMessage(roomId: string, userId: string, content: string): Promise<HomeserverMessage> {
		const message: HomeserverMessage = {
			id: `$${Math.random().toString(36).substring(7)}:${this.config.domain}`,
			roomId,
			userId,
			content,
			timestamp: Date.now(),
		};
		console.log('[HomeserverClient] Sent message:', message);
		return message;
	}

	async editMessage(messageId: string, newContent: string): Promise<void> {
		console.log(`[HomeserverClient] Edited message ${messageId}: ${newContent}`);
	}

	async deleteMessage(messageId: string): Promise<void> {
		console.log(`[HomeserverClient] Deleted message ${messageId}`);
	}

	// Event handling
	onEvent(callbacks: HomeserverEventCallbacks): void {
		this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
		console.log('[HomeserverClient] Registered event callbacks');
	}

	// Simulate incoming events (for testing)
	async simulateIncomingMessage(roomId: string, userId: string, content: string): Promise<void> {
		if (!this.eventCallbacks.onMessage) return;
		
		const message: HomeserverMessage = {
			id: `$${Math.random().toString(36).substring(7)}:external.domain`,
			roomId,
			userId,
			content,
			timestamp: Date.now(),
		};
		
		await this.eventCallbacks.onMessage(message);
	}
}