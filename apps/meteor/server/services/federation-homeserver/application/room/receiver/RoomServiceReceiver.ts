import type { HomeserverRoom, IHomeserverConfig } from '@rocket.chat/core-services';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IRoomServiceReceiver } from '../../../infrastructure/homeserver/handlers/RoomHandler';

export interface IHomeserverRoomAdapterForReceiver {
	createFederatedRoom(externalId: string, name: string, creator: { _id: string }, members: string[]): Promise<{ _id: string }>;
	getRoomByExternalId(externalId: string): Promise<{ _id: string } | null>;
	addUserToRoom(roomId: string, userId: string): Promise<void>;
	removeUserFromRoom(roomId: string, userId: string): Promise<void>;
}

export interface IHomeserverUserAdapterForReceiver {
	getUserByExternalId(externalId: string): Promise<{ _id: string; username: string } | null>;
	createFederatedUser(externalId: string, username: string, displayName?: string): Promise<{ _id: string; username: string }>;
}

export class RoomServiceReceiver extends AbstractHomeserverApplicationService implements IRoomServiceReceiver {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private roomAdapter: IHomeserverRoomAdapterForReceiver,
		private userAdapter: IHomeserverUserAdapterForReceiver,
	) {
		super(homeserverConfig);
	}

	public async onExternalRoomCreated(room: HomeserverRoom): Promise<void> {
		console.log('[RoomServiceReceiver] Processing external room creation:', room.id, room.name);

		try {
			// 1. Check if room already exists
			const existingRoom = await this.roomAdapter.getRoomByExternalId(room.id);
			if (existingRoom) {
				console.log('[RoomServiceReceiver] Room already exists:', room.id);
				return;
			}

			// 2. Process room members
			const memberIds: string[] = [];
			let creator = null;

			for (const externalUserId of room.members) {
				let user = await this.userAdapter.getUserByExternalId(externalUserId);
				
				if (!user) {
					// Extract username from external ID
					const username = externalUserId.split(':')[0].substring(1);
					user = await this.userAdapter.createFederatedUser(
						externalUserId,
						username,
						username,
					);
				}

				memberIds.push(user._id);
				
				// Use first member as creator if we don't have one
				if (!creator) {
					creator = user;
				}
			}

			// 3. Create the room
			if (!creator) {
				throw new Error('No creator found for room');
			}

			await this.roomAdapter.createFederatedRoom(
				room.id,
				room.name,
				creator,
				memberIds,
			);

			console.log('[RoomServiceReceiver] Room created successfully');
		} catch (error) {
			console.error('[RoomServiceReceiver] Failed to create room:', error);
			throw error;
		}
	}

	public async onExternalUserJoinedRoom(roomId: string, userId: string): Promise<void> {
		console.log('[RoomServiceReceiver] Processing user join:', userId, 'joining', roomId);

		try {
			// 1. Get room
			const room = await this.roomAdapter.getRoomByExternalId(roomId);
			if (!room) {
				console.warn('[RoomServiceReceiver] Room not found:', roomId);
				return;
			}

			// 2. Get or create user
			let user = await this.userAdapter.getUserByExternalId(userId);
			if (!user) {
				const username = userId.split(':')[0].substring(1);
				user = await this.userAdapter.createFederatedUser(
					userId,
					username,
					username,
				);
			}

			// 3. Add user to room
			await this.roomAdapter.addUserToRoom(room._id, user._id);
			console.log('[RoomServiceReceiver] User joined room successfully');
		} catch (error) {
			console.error('[RoomServiceReceiver] Failed to process user join:', error);
			throw error;
		}
	}

	public async onExternalUserLeftRoom(roomId: string, userId: string): Promise<void> {
		console.log('[RoomServiceReceiver] Processing user leave:', userId, 'leaving', roomId);

		try {
			// 1. Get room
			const room = await this.roomAdapter.getRoomByExternalId(roomId);
			if (!room) {
				console.warn('[RoomServiceReceiver] Room not found:', roomId);
				return;
			}

			// 2. Get user
			const user = await this.userAdapter.getUserByExternalId(userId);
			if (!user) {
				console.warn('[RoomServiceReceiver] User not found:', userId);
				return;
			}

			// 3. Remove user from room
			await this.roomAdapter.removeUserFromRoom(room._id, user._id);
			console.log('[RoomServiceReceiver] User left room successfully');
		} catch (error) {
			console.error('[RoomServiceReceiver] Failed to process user leave:', error);
			throw error;
		}
	}
}