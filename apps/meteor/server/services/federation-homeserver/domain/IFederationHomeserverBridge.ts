import type { HomeserverUser, HomeserverRoom, HomeserverMessage, HomeserverEvent } from '@rocket.chat/core-services';

export interface IFederationHomeserverBridge {
	start(): Promise<void>;
	stop(): Promise<void>;
	isRunning(): boolean;
	
	// User operations
	createUser(username: string, displayName: string): Promise<string>;
	getUserProfile(userId: string): Promise<HomeserverUser | null>;
	updateUserProfile(userId: string, displayName?: string, avatarUrl?: string): Promise<void>;
	
	// Room operations
	createRoom(name: string, topic?: string, isPublic?: boolean): Promise<string>;
	joinRoom(roomId: string, userId: string): Promise<void>;
	leaveRoom(roomId: string, userId: string): Promise<void>;
	getRoomInfo(roomId: string): Promise<HomeserverRoom | null>;
	updateRoomName(roomId: string, name: string): Promise<void>;
	updateRoomTopic(roomId: string, topic: string): Promise<void>;
	
	// Message operations
	sendMessage(roomId: string, userId: string, message: string): Promise<string>;
	editMessage(messageId: string, newContent: string): Promise<void>;
	deleteMessage(messageId: string): Promise<void>;
	sendFileMessage(roomId: string, userId: string, file: Buffer, fileName: string, mimeType: string): Promise<string>;
	
	// Event handling
	onEvent(callback: (event: HomeserverEvent) => Promise<void>): void;
	
	// Utilities
	extractHomeserverDomain(identifier: string): string;
	isUserFromHomeserver(userId: string): boolean;
	isRoomFromHomeserver(roomId: string): boolean;
}