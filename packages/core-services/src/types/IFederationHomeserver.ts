import type { IServiceClass } from './ServiceClass';

// Define the types we need locally to avoid circular dependency
export interface HomeserverUser {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface HomeserverRoom {
	id: string;
	name: string;
	topic?: string;
	members: string[];
}

export interface HomeserverMessage {
	id: string;
	roomId: string;
	userId: string;
	content: string;
	timestamp: number;
	edited?: boolean;
}

export interface HomeserverEvent {
	type: 'message.new' | 'message.edit' | 'message.delete' | 'room.create' | 'room.member.join' | 'room.member.leave' | 'user.profile.update';
	id: string;
	timestamp: number;
	data: unknown;
}

export interface IFederationHomeserverService extends IServiceClass {
	createBridge(): IFederationHomeserverBridge;
	onEnable(): Promise<void>;
	onDisable(): Promise<void>;
	isEnabled(): boolean;
	getConfig(): IHomeserverConfig;
	processIncomingEvent(event: HomeserverEvent): Promise<void>;
}

export interface IFederationHomeserverBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	
	// User operations
	createUser(username: string, displayName: string): Promise<string>;
	getUserProfile(userId: string): Promise<HomeserverUser | null>;
	
	// Room operations
	createRoom(name: string, topic?: string): Promise<string>;
	joinRoom(roomId: string, userId: string): Promise<void>;
	leaveRoom(roomId: string, userId: string): Promise<void>;
	
	// Message operations
	sendMessage(roomId: string, userId: string, message: string): Promise<string>;
	editMessage(messageId: string, newContent: string): Promise<void>;
	deleteMessage(messageId: string): Promise<void>;
	
	// Event handling
	onEvent(callback: (event: HomeserverEvent) => Promise<void>): void;
}

export interface IHomeserverConfig {
	enabled: boolean;
	url: string;
	domain: string;
	bridgePort: number;
	appServiceToken: string;
	homeserverToken: string;
}