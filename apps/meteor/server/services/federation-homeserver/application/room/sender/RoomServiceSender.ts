import type { IHomeserverConfig } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IFederationHomeserverBridge } from '../../../domain/IFederationHomeserverBridge';

export interface IHomeserverRoomAdapterForRoomSender {
	storeExternalRoomId(internalRoomId: string, externalRoomId: string): Promise<void>;
	getExternalRoomId(internalRoomId: string): Promise<string | null>;
	isHomeserverRoom(roomId: string): Promise<boolean>;
}

export interface IHomeserverUserAdapterForRoomSender {
	getOrCreateExternalUserId(user: IUser): Promise<string>;
	getExternalUserId(internalUserId: string): Promise<string | null>;
}

export class RoomServiceSender extends AbstractHomeserverApplicationService {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private bridge: IFederationHomeserverBridge,
		private roomAdapter: IHomeserverRoomAdapterForRoomSender,
		private userAdapter: IHomeserverUserAdapterForRoomSender,
	) {
		super(homeserverConfig);
	}

	public async createRoom(room: IRoom, creator: IUser): Promise<void> {
		console.log('[RoomServiceSender] Creating room on homeserver:', room._id, room.name);

		try {
			// 1. Get external user ID for creator
			const externalCreatorId = await this.userAdapter.getOrCreateExternalUserId(creator);

			// 2. Create room via bridge
			const externalRoomId = await this.bridge.createRoom(
				room.name || room._id,
				room.topic,
				room.t !== 'p', // isPublic
			);

			// 3. Store the mapping
			await this.roomAdapter.storeExternalRoomId(room._id, externalRoomId);

			// 4. Join creator to the room
			await this.bridge.joinRoom(externalRoomId, externalCreatorId);

			console.log('[RoomServiceSender] Room created successfully:', externalRoomId);
		} catch (error) {
			console.error('[RoomServiceSender] Failed to create room:', error);
			throw error;
		}
	}

	public async userJoinRoom(room: IRoom, user: IUser): Promise<void> {
		console.log('[RoomServiceSender] User joining room on homeserver:', user._id, room._id);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[RoomServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external IDs
			const externalRoomId = await this.roomAdapter.getExternalRoomId(room._id);
			if (!externalRoomId) {
				console.error('[RoomServiceSender] No external room ID found');
				return;
			}

			const externalUserId = await this.userAdapter.getOrCreateExternalUserId(user);

			// 3. Join user to room via bridge
			await this.bridge.joinRoom(externalRoomId, externalUserId);
			console.log('[RoomServiceSender] User joined room successfully');
		} catch (error) {
			console.error('[RoomServiceSender] Failed to join user to room:', error);
			throw error;
		}
	}

	public async userLeaveRoom(room: IRoom, user: IUser): Promise<void> {
		console.log('[RoomServiceSender] User leaving room on homeserver:', user._id, room._id);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[RoomServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external IDs
			const externalRoomId = await this.roomAdapter.getExternalRoomId(room._id);
			if (!externalRoomId) {
				console.error('[RoomServiceSender] No external room ID found');
				return;
			}

			const externalUserId = await this.userAdapter.getExternalUserId(user._id);
			if (!externalUserId) {
				console.error('[RoomServiceSender] No external user ID found');
				return;
			}

			// 3. Leave room via bridge
			await this.bridge.leaveRoom(externalRoomId, externalUserId);
			console.log('[RoomServiceSender] User left room successfully');
		} catch (error) {
			console.error('[RoomServiceSender] Failed to remove user from room:', error);
			throw error;
		}
	}

	public async updateRoomName(room: IRoom, newName: string): Promise<void> {
		console.log('[RoomServiceSender] Updating room name on homeserver:', room._id, newName);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[RoomServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external room ID
			const externalRoomId = await this.roomAdapter.getExternalRoomId(room._id);
			if (!externalRoomId) {
				console.error('[RoomServiceSender] No external room ID found');
				return;
			}

			// 3. Update room name via bridge
			await this.bridge.updateRoomName(externalRoomId, newName);
			console.log('[RoomServiceSender] Room name updated successfully');
		} catch (error) {
			console.error('[RoomServiceSender] Failed to update room name:', error);
			throw error;
		}
	}

	public async updateRoomTopic(room: IRoom, newTopic: string): Promise<void> {
		console.log('[RoomServiceSender] Updating room topic on homeserver:', room._id, newTopic);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[RoomServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external room ID
			const externalRoomId = await this.roomAdapter.getExternalRoomId(room._id);
			if (!externalRoomId) {
				console.error('[RoomServiceSender] No external room ID found');
				return;
			}

			// 3. Update room topic via bridge
			await this.bridge.updateRoomTopic(externalRoomId, newTopic);
			console.log('[RoomServiceSender] Room topic updated successfully');
		} catch (error) {
			console.error('[RoomServiceSender] Failed to update room topic:', error);
			throw error;
		}
	}
}