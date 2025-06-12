import { callbacks } from '../../../../../../../lib/callbacks';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { FederationHomeserverServiceClass } from '../../../service';
import { ServiceClassInternal } from '@rocket.chat/core-services';

export class FederationHomeserverHooks {
	private static instance: FederationHomeserverHooks;
	private service: FederationHomeserverServiceClass | null = null;

	static getInstance(): FederationHomeserverHooks {
		if (!FederationHomeserverHooks.instance) {
			FederationHomeserverHooks.instance = new FederationHomeserverHooks();
		}
		return FederationHomeserverHooks.instance;
	}

	private constructor() {}

	private getService(): FederationHomeserverServiceClass | null {
		if (!this.service) {
			this.service = ServiceClassInternal.getService('federation-homeserver') as FederationHomeserverServiceClass | null;
		}
		return this.service;
	}

	private isHomeserverFederatedRoom(room: IRoom): boolean {
		return room?.federated === true && room?.federation?.type === 'homeserver';
	}

	private isHomeserverFederatedMessage(message: IMessage): boolean {
		// Check if message has homeserver federation metadata
		return message?.federation?.type === 'homeserver';
	}

	private isHomeserverFederatedUser(user: IUser): boolean {
		return user?.federated === true && user?.federation?.type === 'homeserver';
	}

	register(): void {
		console.log('[FederationHomeserver] Registering hooks');

		// Message hooks
		callbacks.add(
			'afterSaveMessage',
			async (message: IMessage, room: IRoom) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return message;
				}

				// Skip if this is an incoming federated message (prevent loops)
				if (this.isHomeserverFederatedMessage(message)) {
					console.log('[FederationHomeserver] Skipping federated message', message._id);
					return message;
				}

				// Only process messages from homeserver federated rooms
				if (!this.isHomeserverFederatedRoom(room)) {
					return message;
				}

				// Skip system messages
				if (message.t) {
					return message;
				}

				console.log('[FederationHomeserver] Processing outgoing message', message._id);

				try {
					const bridge = service.createBridge();
					const messageSender = bridge.getMessageServiceSender();
					await messageSender.sendMessage(message, room);
				} catch (error) {
					console.error('[FederationHomeserver] Error sending message:', error);
				}

				return message;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-save-message',
		);

		callbacks.add(
			'afterDeleteMessage',
			async (message: IMessage, room: IRoom) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return message;
				}

				// Skip if this is a federated deletion
				if (this.isHomeserverFederatedMessage(message)) {
					return message;
				}

				// Only process messages from homeserver federated rooms
				if (!this.isHomeserverFederatedRoom(room)) {
					return message;
				}

				console.log('[FederationHomeserver] Processing message deletion', message._id);

				try {
					const bridge = service.createBridge();
					const messageSender = bridge.getMessageServiceSender();
					await messageSender.deleteMessage(message, room);
				} catch (error) {
					console.error('[FederationHomeserver] Error deleting message:', error);
				}

				return message;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-delete-message',
		);

		// Room hooks
		callbacks.add(
			'afterCreateRoom',
			async (room: IRoom, user: IUser) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return room;
				}

				// Skip if this is already a federated room
				if (room.federated) {
					return room;
				}

				// Only federate public channels for now
				if (room.t !== 'c') {
					return room;
				}

				console.log('[FederationHomeserver] Processing room creation', room._id);

				try {
					const bridge = service.createBridge();
					const roomSender = bridge.getRoomServiceSender();
					await roomSender.createRoom(room, user);
				} catch (error) {
					console.error('[FederationHomeserver] Error creating room:', error);
				}

				return room;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-create-room',
		);

		callbacks.add(
			'afterAddedToRoom',
			async (user: IUser, room: IRoom) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return user;
				}

				// Only process homeserver federated rooms
				if (!this.isHomeserverFederatedRoom(room)) {
					return user;
				}

				// Skip if this is a federated user join
				if (this.isHomeserverFederatedUser(user)) {
					return user;
				}

				console.log('[FederationHomeserver] Processing user join', user._id, room._id);

				try {
					const bridge = service.createBridge();
					const roomSender = bridge.getRoomServiceSender();
					await roomSender.userJoinedRoom(room, user);
				} catch (error) {
					console.error('[FederationHomeserver] Error processing user join:', error);
				}

				return user;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-user-join',
		);

		callbacks.add(
			'afterRemovedFromRoom',
			async (user: IUser, room: IRoom) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return user;
				}

				// Only process homeserver federated rooms
				if (!this.isHomeserverFederatedRoom(room)) {
					return user;
				}

				// Skip if this is a federated user leave
				if (this.isHomeserverFederatedUser(user)) {
					return user;
				}

				console.log('[FederationHomeserver] Processing user leave', user._id, room._id);

				try {
					const bridge = service.createBridge();
					const roomSender = bridge.getRoomServiceSender();
					await roomSender.userLeftRoom(room, user);
				} catch (error) {
					console.error('[FederationHomeserver] Error processing user leave:', error);
				}

				return user;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-user-leave',
		);

		// User hooks
		callbacks.add(
			'afterSaveUser',
			async (user: IUser) => {
				const service = this.getService();
				if (!service?.isEnabled()) {
					return user;
				}

				// Skip federated users
				if (this.isHomeserverFederatedUser(user)) {
					return user;
				}

				// Only process profile updates for users that have external IDs
				const bridge = service.createBridge();
				const userAdapter = bridge.getUserAdapter();
				const externalUserId = await userAdapter.getExternalUserId(user._id);
				if (!externalUserId) {
					return user;
				}

				console.log('[FederationHomeserver] Processing user profile update', user._id);

				try {
					const userSender = bridge.getUserServiceSender();
					await userSender.updateUserProfile(user);
				} catch (error) {
					console.error('[FederationHomeserver] Error updating user profile:', error);
				}

				return user;
			},
			callbacks.priority.LOW,
			'federation-homeserver-after-save-user',
		);

		console.log('[FederationHomeserver] Hooks registered');
	}

	unregister(): void {
		console.log('[FederationHomeserver] Unregistering hooks');

		callbacks.remove('afterSaveMessage', 'federation-homeserver-after-save-message');
		callbacks.remove('afterDeleteMessage', 'federation-homeserver-after-delete-message');
		callbacks.remove('afterCreateRoom', 'federation-homeserver-after-create-room');
		callbacks.remove('afterAddedToRoom', 'federation-homeserver-after-user-join');
		callbacks.remove('afterRemovedFromRoom', 'federation-homeserver-after-user-leave');
		callbacks.remove('afterSaveUser', 'federation-homeserver-after-save-user');

		console.log('[FederationHomeserver] Hooks unregistered');
	}
}