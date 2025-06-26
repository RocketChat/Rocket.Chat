import { type IFederationMatrixService, ServiceClass } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures, HomeserverServices } from '@rocket.chat/homeserver';
import { setupHomeserver, getAllRoutes, getAllServices } from '@rocket.chat/homeserver';
import { MatrixBridgedUser, MatrixBridgedRoom } from '@rocket.chat/models';

import { registerEvents } from './events';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';

	private eventHandler: Emitter<HomeserverEventSignatures>;

	private homeserverServices: HomeserverServices | null = null;

	private matrixDomain = process.env.MATRIX_DOMAIN || 'rc1.local';

	constructor(emitter?: Emitter<HomeserverEventSignatures>) {
		super();
		this.eventHandler = emitter || new Emitter<HomeserverEventSignatures>();
	}

	async created(): Promise<void> {
		try {
			setupHomeserver({ emitter: this.eventHandler });
			registerEvents(this.eventHandler);
		} catch (error) {
			console.warn('[FederationMatrix] Homeserver module not available, running in limited mode');
		}
	}

	async started(): Promise<void> {
		console.log('FederationMatrix started');
		this.homeserverServices = getAllServices();
	}

	getAllRoutes() {
		return getAllRoutes();
	}

	ping(): void {
		console.log('Federation service ping');
		console.log('matrixDomain', MatrixBridgedRoom);
	}

	async createRoom(room: IRoom, owner: IUser, members: string[]): Promise<void> {
		console.log('[FederationMatrix] Creating room:', room._id);
		console.log('[FederationMatrix] Owner:', owner.username);
		console.log('[FederationMatrix] Members:', members);

		if (!this.homeserverServices) {
			console.warn('[FederationMatrix] Homeserver services not available, skipping room creation');
			return;
		}

		try {
			const matrixUserId = `@${owner.username}:${this.matrixDomain}`;
			const roomName = room.name || room.fname || 'Untitled Room';
			const canonicalAlias = room.fname ? `#${room.fname}:${this.matrixDomain}` : undefined;

			console.log('[FederationMatrix] Creating Matrix room with params:', {
				username: owner.username,
				sender: matrixUserId,
				name: roomName,
				canonical_alias: canonicalAlias,
			});

			const matrixRoomResult = await this.homeserverServices.room.createRoom(
				matrixUserId,
				matrixUserId,
				roomName,
				canonicalAlias,
				canonicalAlias,
			);

			console.log('[FederationMatrix] Matrix room created:', matrixRoomResult);

			// 2. Create bridged room in Rocket.Chat
			// TODO: Implement bridged room creation
			const bridgedRoom = await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, matrixRoomResult.room_id, this.matrixDomain);
			console.log('xxxxxxx', room._id, matrixRoomResult.room_id, this.matrixDomain);
			console.log('bridgedRoom', bridgedRoom);
			console.log('[FederationMatrix] Bridged room mapping created');

			// 3. Create bridged user for owner
			// TODO: Implement bridged user creation
			const bridgedUser = await MatrixBridgedUser.createOrUpdateByLocalId(owner._id, matrixUserId, true, this.matrixDomain);
			console.log('bridgedUser', bridgedUser);
			console.log('[FederationMatrix] Bridged user for owner created');

			// 4. Invite members to the room on Matrix
			// TODO: Process members and invite them
			// This would use services.invite.inviteUser() for each member
			for (const member of members) {
				if (member === owner.username) {
					console.log('[FederationMatrix] Owner is already in the room:', member);
					continue;
				}

				// const localUserId = await Users.findOneByUsername(member);
				// if (!localUserId) {
				// 	console.error('[FederationMatrix] No internal user found for:', member);
				// 	await MatrixBridgedUser.createOrUpdateByLocalId(member, member, true, this.matrixDomain);
				// }

				console.log(this.homeserverServices?.invite);
				await this.homeserverServices?.invite.inviteUserToRoom(member, matrixRoomResult.room_id, matrixUserId, roomName);
				console.log('[FederationMatrix] Member invited to room:', member);
			}

			console.log('[FederationMatrix] Room creation completed successfully');
		} catch (error) {
			console.error('[FederationMatrix] Failed to create room:', error);
			throw error;
		}
	}

	async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		console.log('[FederationMatrix] Sending message:', message._id);
		console.log('[FederationMatrix] Room:', room._id, room.fname);
		console.log('[FederationMatrix] User:', user.username);

		try {
			// 1. Get the Matrix room ID from the bridged mapping
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
			if (!matrixRoomId) {
				console.error('[FederationMatrix] No bridged room found for:', room._id);
				throw new Error(`No Matrix room mapping found for room ${room._id}`);
			}

			// 2. Get the Matrix user ID from the bridged mapping
			const matrixUserId = `@${user.username}:${this.matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(user._id);
			if (!existingMatrixUserId) {
				// Create bridged user if it doesn't exist
				await MatrixBridgedUser.createOrUpdateByLocalId(user._id, matrixUserId, true, this.matrixDomain);
				console.log('[FederationMatrix] Created bridged user mapping for:', user.username);
			}

			// 3. Determine the target server
			// Extract domain from Matrix room ID (format: !roomid:domain)
			const targetServer = 'hs1.tunnel.dev.rocket.chat'; // matrixRoomId.split(':')[1] || this.matrixDomain;

			// 4. Send the message to Matrix
			console.log('[FederationMatrix] Sending message to Matrix2:', {
				roomId: matrixRoomId,
				message: message.msg,
				sender: matrixUserId,
				targetServer,
			});

			if (!this.homeserverServices) {
				console.warn('[FederationMatrix] Homeserver services not available, skipping message send');
				return;
			}

			const result = await this.homeserverServices.message.sendMessage(matrixRoomId, message.msg, matrixUserId, targetServer);

			console.log('[FederationMatrix] Message sent to Matrix successfully:', result.event_id);

			// TODO: Store the event ID mapping for future reference (edits, deletions, etc.)
			// This would allow us to map between Rocket.Chat message IDs and Matrix event IDs
		} catch (error) {
			console.error('[FederationMatrix] Failed to send message to Matrix:', error);
			throw error;
		}
	}

	async inviteUserToRoom(userId: string, roomId: string, targetServer: string): Promise<void> {
		console.log('[FederationMatrix] Inviting user to room:', userId, roomId, targetServer);

		try {
			// 1. Get the Matrix room ID from the bridged mapping
			const matrixRoomId = await MatrixBridgedRoom.getExternalRoomId(roomId);
			if (!matrixRoomId) {
				console.error('[FederationMatrix] No bridged room found for:', roomId);
				throw new Error(`No Matrix room mapping found for room ${roomId}`);
			}

			// 2. Get the Matrix user ID from the bridged mapping
			const matrixUserId = `@${userId}:${this.matrixDomain}`;
			const existingMatrixUserId = await MatrixBridgedUser.getExternalUserIdByLocalUserId(userId);
			if (!existingMatrixUserId) {
				// Create bridged user if it doesn't exist
				await MatrixBridgedUser.createOrUpdateByLocalId(userId, matrixUserId, true, this.matrixDomain);
				console.log('[FederationMatrix] Created bridged user mapping for:', userId);
			}

			// 3. Send the invite to Matrix
			const result = await this.homeserverServices?.invite.inviteUserToRoom(matrixRoomId, matrixUserId, targetServer);
			console.log('[FederationMatrix] Invite sent to Matrix successfully:', result?.event_id);
			console.log('[FederationMatrix] Invite result:', result);

			// 4. Store the invite mapping for future reference (edits, deletions, etc.)
			// This would allow us to map between Rocket.Chat message IDs and Matrix event IDs
			if (result?.event_id) {
				// TODO: Implement invite mapping storage
				// await MatrixBridgedInvite.createOrUpdateByLocalRoomId(roomId, matrixRoomId, this.matrixDomain);
			}

			console.log('[FederationMatrix] Invite sent to Matrix successfully:', result?.event_id);
		} catch (error) {
			console.error('[FederationMatrix] Failed to invite user to room:', error);
			throw error;
		}
	}
}
