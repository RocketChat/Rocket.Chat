import type { IRoom } from '@rocket.chat/core-typings';
import type { HomeserverRoom } from '@rocket.chat/core-services';
import { FederatedHomeserverRoom } from '../../../domain/FederatedHomeserverRoom';

export class RoomConverter {
	constructor(private homeserverDomain: string) {}

	/**
	 * Convert Rocket.Chat room to Homeserver room format
	 */
	public toHomeserverRoom(room: IRoom, members: string[] = []): HomeserverRoom {
		return {
			id: this.toExternalRoomId(room),
			name: room.name || room._id,
			topic: room.topic,
			members,
		};
	}

	/**
	 * Convert Homeserver room to Rocket.Chat room format
	 */
	public toRocketChatRoom(homeserverRoom: HomeserverRoom): Partial<IRoom> {
		return {
			name: homeserverRoom.name,
			topic: homeserverRoom.topic,
			t: 'c', // Default to channel, can be overridden
			federated: true,
			// Additional federation metadata will be stored separately
		};
	}

	/**
	 * Generate external room ID from internal room
	 */
	public toExternalRoomId(room: IRoom): string {
		// Use existing external ID if available (stored in federation metadata)
		// This would come from a separate mapping table in real implementation
		
		// Generate new external ID
		const roomId = room._id.replace(/[^a-zA-Z0-9]/g, '');
		return `!${roomId}:${this.homeserverDomain}`;
	}

	/**
	 * Extract room ID from external room ID
	 * Format: !roomid:domain
	 */
	public extractRoomIdFromExternalId(externalId: string): string {
		if (!externalId.startsWith('!')) {
			throw new Error(`Invalid external room ID format: ${externalId}`);
		}
		
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external room ID format: ${externalId}`);
		}
		
		return externalId.substring(1, colonIndex);
	}

	/**
	 * Extract domain from external room ID
	 */
	public extractDomainFromExternalId(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			throw new Error(`Invalid external room ID format: ${externalId}`);
		}
		
		return externalId.substring(colonIndex + 1);
	}

	/**
	 * Check if room is from local homeserver
	 */
	public isLocalRoom(externalId: string): boolean {
		try {
			const domain = this.extractDomainFromExternalId(externalId);
			return domain === this.homeserverDomain || domain === 'local';
		} catch {
			return false;
		}
	}

	/**
	 * Determine room type based on Rocket.Chat room type
	 */
	public getRoomType(rcRoomType: string): 'public' | 'private' {
		switch (rcRoomType) {
			case 'c': // Channel
			case 'l': // Livechat
				return 'public';
			case 'p': // Private group
			case 'd': // Direct message
			case 't': // Private team
				return 'private';
			default:
				return 'private'; // Default to private for safety
		}
	}

	/**
	 * Create federated room domain object
	 */
	public toFederatedRoom(
		internalId: string,
		externalId: string,
		homeserverRoom: HomeserverRoom,
	): FederatedHomeserverRoom {
		return new FederatedHomeserverRoom(
			internalId,
			externalId,
			homeserverRoom.name,
			homeserverRoom.topic,
			true, // Default to public, should be determined by room type
			homeserverRoom.members,
			this.extractDomainFromExternalId(externalId),
		);
	}

	/**
	 * Generate a room alias from room name
	 * Format: #roomname:domain
	 */
	public generateRoomAlias(roomName: string): string {
		// Sanitize room name for alias
		const alias = roomName
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_|_$/g, '');
		
		return `#${alias}:${this.homeserverDomain}`;
	}
}