import type { IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { HomeserverFederationMapping } from './HomeserverFederationMapping';
import type { IHomeserverRoomAdapter } from '../../../application/message/receiver/MessageServiceReceiver';
import type { IHomeserverRoomAdapterForReceiver } from '../../../application/room/receiver/RoomServiceReceiver';
import type { IHomeserverRoomAdapterForSender } from '../../../application/message/sender/MessageServiceSender';
import type { IHomeserverRoomAdapterForRoomSender } from '../../../application/room/sender/RoomServiceSender';
import { getConnection } from '@rocket.chat/models/dist/lib/BaseRaw';

export class RoomAdapter implements 
	IHomeserverRoomAdapter, 
	IHomeserverRoomAdapterForReceiver,
	IHomeserverRoomAdapterForSender,
	IHomeserverRoomAdapterForRoomSender {
	
	constructor(private homeserverDomain: string) {}

	// Get database connection
	private async getDb() {
		return getConnection().db;
	}

	// Create a federated room in Rocket.Chat
	async createFederatedRoom(
		externalId: string, 
		name: string, 
		creator: { _id: string }, 
		members: string[]
	): Promise<{ _id: string }> {
		// Create the room with federation metadata
		const room = await Rooms.createWithIdOrName(
			null, // Let RC generate the ID
			name,
			creator._id,
			members,
			false, // Not read only
			{
				fname: name,
				federated: true,
				federation: {
					type: 'homeserver',
					externalId: externalId,
					domain: this.extractDomain(externalId),
				},
			},
		);

		// Store the ID mapping
		const db = await this.getDb();
		await HomeserverFederationMapping.createOrUpdate({
			type: 'room',
			internalId: room._id,
			externalId: externalId,
			homeserverDomain: this.extractDomain(externalId),
		}, db);

		return { _id: room._id };
	}

	// Get room by external ID
	async getRoomByExternalId(externalId: string): Promise<{ _id: string } | null> {
		// First try to find by federation metadata
		const room = await Rooms.findOne({ 'federation.externalId': externalId });
		if (room) {
			return { _id: room._id };
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByExternalId('room', externalId, db);
		
		if (!mapping) {
			return null;
		}

		const mappedRoom = await Rooms.findOneById(mapping.internalId);
		return mappedRoom ? { _id: mappedRoom._id } : null;
	}

	// Get external room ID from internal ID
	async getExternalRoomId(internalRoomId: string): Promise<string | null> {
		// First try to get from room metadata
		const room = await Rooms.findOneById(internalRoomId);
		if (room?.federation?.externalId) {
			return room.federation.externalId;
		}

		// Fallback to mapping collection
		const db = await this.getDb();
		const mapping = await HomeserverFederationMapping.findByInternalId('room', internalRoomId, db);
		return mapping?.externalId || null;
	}

	// Store external room ID mapping
	async storeExternalRoomId(internalRoomId: string, externalRoomId: string): Promise<void> {
		// Update room with federation metadata
		await Rooms.updateOne(
			{ _id: internalRoomId },
			{
				$set: {
					federated: true,
					federation: {
						type: 'homeserver',
						externalId: externalRoomId,
						domain: this.extractDomain(externalRoomId),
					},
				},
			},
		);

		// Also store in mapping collection
		const db = await this.getDb();
		await HomeserverFederationMapping.createOrUpdate({
			type: 'room',
			internalId: internalRoomId,
			externalId: externalRoomId,
			homeserverDomain: this.extractDomain(externalRoomId),
		}, db);
	}

	// Check if user is member of room
	async isUserMemberOfRoom(userId: string, roomId: string): Promise<boolean> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, userId);
		return !!subscription;
	}

	// Check if room is a homeserver federated room
	async isHomeserverRoom(roomId: string): Promise<boolean> {
		const room = await Rooms.findOneById(roomId);
		return room?.federated === true && room?.federation?.type === 'homeserver';
	}

	// Add user to room
	async addUserToRoom(roomId: string, userId: string): Promise<void> {
		const room = await Rooms.findOneById(roomId);
		if (!room) {
			throw new Error(`Room ${roomId} not found`);
		}

		// Use Rocket.Chat's internal method to add user to room
		await Subscriptions.createWithRoomAndUser(room, { _id: userId } as IUser, {
			ts: new Date(),
			open: true,
			alert: true,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
		});
	}

	// Remove user from room
	async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
		await Subscriptions.removeByRoomIdAndUserId(roomId, userId);
	}

	// Extract domain from external room ID
	private extractDomain(externalId: string): string {
		const colonIndex = externalId.indexOf(':');
		if (colonIndex === -1) {
			return this.homeserverDomain;
		}
		return externalId.substring(colonIndex + 1);
	}
}