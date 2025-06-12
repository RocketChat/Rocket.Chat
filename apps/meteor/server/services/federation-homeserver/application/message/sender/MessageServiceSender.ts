import type { IHomeserverConfig } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { AbstractHomeserverApplicationService } from '../../AbstractHomeserverApplicationService';
import type { IFederationHomeserverBridge } from '../../../domain/IFederationHomeserverBridge';

export interface IHomeserverRoomAdapterForSender {
	getExternalRoomId(internalRoomId: string): Promise<string | null>;
	isHomeserverRoom(roomId: string): Promise<boolean>;
}

export interface IHomeserverUserAdapterForSender {
	getExternalUserId(internalUserId: string): Promise<string | null>;
	getOrCreateExternalUserId(user: IUser): Promise<string>;
}

export class MessageServiceSender extends AbstractHomeserverApplicationService {
	constructor(
		homeserverConfig: IHomeserverConfig,
		private bridge: IFederationHomeserverBridge,
		private roomAdapter: IHomeserverRoomAdapterForSender,
		private userAdapter: IHomeserverUserAdapterForSender,
	) {
		super(homeserverConfig);
	}

	public async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		console.log('[MessageServiceSender] Sending message to homeserver:', message._id);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[MessageServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external room ID
			const externalRoomId = await this.roomAdapter.getExternalRoomId(room._id);
			if (!externalRoomId) {
				console.error('[MessageServiceSender] No external room ID found for:', room._id);
				return;
			}

			// 3. Get external user ID
			const externalUserId = await this.userAdapter.getOrCreateExternalUserId(user);

			// 4. Send message via bridge
			const externalMessageId = await this.bridge.sendMessage(
				externalRoomId,
				externalUserId,
				message.msg,
			);

			console.log('[MessageServiceSender] Message sent successfully:', externalMessageId);
		} catch (error) {
			console.error('[MessageServiceSender] Failed to send message:', error);
			throw error;
		}
	}

	public async editMessage(message: IMessage, room: IRoom, _user: IUser, newContent: string): Promise<void> {
		console.log('[MessageServiceSender] Editing message on homeserver:', message._id);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[MessageServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external message ID from federation data
			const externalMessageId = message.federation?.eventId;
			if (!externalMessageId) {
				console.error('[MessageServiceSender] No external message ID found');
				return;
			}

			// 3. Edit message via bridge
			await this.bridge.editMessage(externalMessageId, newContent);
			console.log('[MessageServiceSender] Message edited successfully');
		} catch (error) {
			console.error('[MessageServiceSender] Failed to edit message:', error);
			throw error;
		}
	}

	public async deleteMessage(message: IMessage, room: IRoom, _user: IUser): Promise<void> {
		console.log('[MessageServiceSender] Deleting message on homeserver:', message._id);

		try {
			// 1. Check if this is a homeserver room
			const isHomeserverRoom = await this.roomAdapter.isHomeserverRoom(room._id);
			if (!isHomeserverRoom) {
				console.log('[MessageServiceSender] Not a homeserver room, skipping');
				return;
			}

			// 2. Get external message ID from federation data
			const externalMessageId = message.federation?.eventId;
			if (!externalMessageId) {
				console.error('[MessageServiceSender] No external message ID found');
				return;
			}

			// 3. Delete message via bridge
			await this.bridge.deleteMessage(externalMessageId);
			console.log('[MessageServiceSender] Message deleted successfully');
		} catch (error) {
			console.error('[MessageServiceSender] Failed to delete message:', error);
			throw error;
		}
	}
}