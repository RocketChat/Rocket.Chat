import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isMessageFromMatrixFederation, isRoomFederated, isEditedMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterUserLeaveRoom(callback: (user: IUser, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'afterLeaveRoom',
			(user: IUser, room: IRoom | undefined): void => {
				if (!room || !isRoomFederated(room)) {
					return;
				}
				Promise.await(callback(user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-leave-room',
		);
	}

	public static onUserRemovedFromRoom(callback: (removedUser: IUser, room: IRoom, userWhoRemoved: IUser) => Promise<void>): void {
		callbacks.add(
			'afterRemoveFromRoom',
			(params: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom | undefined): void => {
				if (!room || !isRoomFederated(room)) {
					return;
				}
				Promise.await(callback(params.removedUser, room, params.userWhoRemoved));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-remove-from-room',
		);
	}

	public static canAddFederatedUserToNonFederatedRoom(callback: (user: IUser | string, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string }, room: IRoom): void => {
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-federated-user-to-non-federated-room',
		);
	}

	public static canAddFederatedUserToFederatedRoom(callback: (user: IUser | string, inviter: IUser, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string; inviter: IUser }, room: IRoom): void => {
				Promise.await(callback(params.user, params.inviter, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-federated-user-to-federated-room',
		);
	}

	public static canCreateDirectMessageFromUI(callback: (members: IUser[]) => Promise<void>): void {
		callbacks.add(
			'federation.beforeCreateDirectMessage',
			(members: IUser[]): void => {
				Promise.await(callback(members));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-create-direct-message-from-ui-ce',
		);
	}

	public static afterMessageReacted(callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		callbacks.add(
			'afterSetReaction',
			(message: IMessage, { user, reaction }: { user: IUser; reaction: string }): void => {
				if (!message || !isMessageFromMatrixFederation(message)) {
					return;
				}
				Promise.await(callback(message, user, reaction));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-message-reacted',
		);
	}

	public static afterMessageunReacted(callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		callbacks.add(
			'afterUnsetReaction',
			(message: IMessage, { user, reaction, oldMessage }: any): void => {
				if (!message || !isMessageFromMatrixFederation(message)) {
					return;
				}
				Promise.await(callback(oldMessage, user, reaction));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-message-unreacted',
		);
	}

	public static afterMessageDeleted(callback: (message: IMessage, roomId: IRoom['_id']) => Promise<void>): void {
		callbacks.add(
			'afterDeleteMessage',
			(message: IMessage, room: IRoom): void => {
				if (!room || !isRoomFederated(room) || !isMessageFromMatrixFederation(message)) {
					return;
				}
				Promise.await(callback(message, room._id));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-message-deleted',
		);
	}

	public static afterMessageUpdated(callback: (message: IMessage, roomId: IRoom['_id'], userId: string) => Promise<void>): void {
		callbacks.add(
			'afterSaveMessage',
			(message: IMessage, room: IRoom): IMessage => {
				if (!room || !isRoomFederated(room) || !isMessageFromMatrixFederation(message)) {
					return message;
				}
				if (!isEditedMessage(message)) {
					return message;
				}
				Promise.await(callback(message, room._id, message.editedBy._id));
				return message;
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-message-updated',
		);
	}

	public static afterMessageSent(callback: (message: IMessage, roomId: IRoom['_id'], userId: string) => Promise<void>): void {
		callbacks.add(
			'afterSaveMessage',
			(message: IMessage, room: IRoom): IMessage => {
				if (!room || !isRoomFederated(room)) {
					return message;
				}
				if (isEditedMessage(message)) {
					return message;
				}
				Promise.await(callback(message, room._id, message.u._id));
				return message;
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-message-sent',
		);
	}

	public static removeCEValidation(): void {
		callbacks.remove('federation.beforeAddUserAToRoom', 'federation-v2-can-add-federated-user-to-federated-room');
		callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
	}
}
