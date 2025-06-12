import type { IRoom } from '@rocket.chat/core-typings';
import type { FederatedHomeserverRoom } from '../../../domain/FederatedHomeserverRoom';

export class RoomConverter {
	constructor(private homeserverDomain: string) {}

	// Convert Rocket.Chat room to Homeserver room format
	public toHomeserverRoom(room: IRoom, externalId?: string): FederatedHomeserverRoom {
		const federatedRoom: FederatedHomeserverRoom = {
			externalId: externalId || this.generateExternalRoomId(room),
			name: room.fname || room.name || room._id,
			topic: room.topic,
			isPublic: room.t === 'c',
			members: [], // Will be populated by the service
			createdAt: room.ts || new Date(),
			updatedAt: room._updatedAt || new Date(),
		};
		
		return federatedRoom;
	}

	// Convert Homeserver room event to Rocket.Chat room data
	public toRocketChatRoomData(homeserverRoom: any): Partial<IRoom> {
		return {
			fname: homeserverRoom.name,
			topic: homeserverRoom.topic,
			t: homeserverRoom.is_public ? 'c' : 'p',
			federated: true,
			federation: {
				type: 'homeserver',
				externalId: homeserverRoom.id,
				domain: this.extractDomain(homeserverRoom.id),
			},
		};
	}

	// Generate external room ID for a Rocket.Chat room
	public generateExternalRoomId(room: IRoom): string {
		const roomAlias = room.fname || room.name || room._id;
		// Remove special characters and spaces
		const cleanAlias = roomAlias.toLowerCase().replace(/[^a-z0-9]/g, '');
		return `!${cleanAlias}:${this.homeserverDomain}`;
	}

	// Extract domain from external room ID
	private extractDomain(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			return this.homeserverDomain;
		}
		return externalId.substring(colonIndex + 1);
	}

	// Convert room member event data
	public convertMembershipEvent(event: any): {
		userId: string;
		roomId: string;
		membership: 'join' | 'leave' | 'invite' | 'ban';
	} {
		return {
			userId: event.state_key || event.sender,
			roomId: event.room_id,
			membership: event.content?.membership || 'join',
		};
	}

	// Convert room state event data
	public convertRoomStateEvent(event: any): {
		roomId: string;
		type: string;
		content: any;
	} {
		return {
			roomId: event.room_id,
			type: event.type,
			content: event.content,
		};
	}
}