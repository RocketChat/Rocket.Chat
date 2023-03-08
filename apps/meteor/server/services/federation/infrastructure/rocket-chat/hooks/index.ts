import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isMessageFromMatrixFederation, isRoomFederated, isEditedMessage } from '@rocket.chat/core-typings';

import type { FederationRoomServiceSender } from '../../../application/room/sender/RoomServiceSender';
import { settings } from '../../../../../../app/settings/server';
import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterUserLeaveRoom(callback: (user: IUser, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'afterLeaveRoom',
			(user: IUser, room: IRoom | undefined): void => {
				if (!room || !isRoomFederated(room) || !user || !settings.get('Federation_Matrix_enabled')) {
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
				if (
					!room ||
					!isRoomFederated(room) ||
					!params ||
					!params.removedUser ||
					!params.userWhoRemoved ||
					!settings.get('Federation_Matrix_enabled')
				) {
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
			'federation.beforeAddUserToARoom',
			(params: { user: IUser | string; inviter?: IUser }, room: IRoom): void => {
				if (!params?.user || !room) {
					return;
				}
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-federated-user-to-non-federated-room',
		);
	}

	public static canAddFederatedUserToFederatedRoom(callback: (user: IUser | string, inviter: IUser, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'federation.beforeAddUserToARoom',
			(params: { user: IUser | string; inviter: IUser }, room: IRoom): void => {
				if (!params?.user || !params.inviter || !room || !settings.get('Federation_Matrix_enabled')) {
					return;
				}

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
				if (!members || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(members));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-create-direct-message-from-ui-ce',
		);
	}

	public static afterMessageReacted(callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		callbacks.add(
			'afterSetReaction',
			(message: IMessage, params: { user: IUser; reaction: string }): void => {
				if (
					!message ||
					!isMessageFromMatrixFederation(message) ||
					!params ||
					!params.user ||
					!params.reaction ||
					!settings.get('Federation_Matrix_enabled')
				) {
					return;
				}
				Promise.await(callback(message, params.user, params.reaction));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-message-reacted',
		);
	}

	public static afterMessageunReacted(callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		callbacks.add(
			'afterUnsetReaction',
			(message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): void => {
				if (
					!message ||
					!isMessageFromMatrixFederation(message) ||
					!params ||
					!params.user ||
					!params.reaction ||
					!params.oldMessage ||
					!settings.get('Federation_Matrix_enabled')
				) {
					return;
				}
				Promise.await(callback(params.oldMessage, params.user, params.reaction));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-message-unreacted',
		);
	}

	public static afterMessageDeleted(callback: (message: IMessage, roomId: IRoom['_id']) => Promise<void>): void {
		callbacks.add(
			'afterDeleteMessage',
			(message: IMessage, room: IRoom): void => {
				if (
					!room ||
					!message ||
					!isRoomFederated(room) ||
					!isMessageFromMatrixFederation(message) ||
					!settings.get('Federation_Matrix_enabled')
				) {
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
				if (
					!room ||
					!isRoomFederated(room) ||
					!message ||
					!isMessageFromMatrixFederation(message) ||
					!settings.get('Federation_Matrix_enabled')
				) {
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
				if (!room || !isRoomFederated(room) || !message || !settings.get('Federation_Matrix_enabled')) {
					return message;
				}
				if (isEditedMessage(message)) {
					return message;
				}
				Promise.await(callback(message, room._id, message.u?._id));
				return message;
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-message-sent',
		);
	}

	public static afterRoomRoleChanged(federationRoomService: FederationRoomServiceSender, data?: Record<string, any>): void {
		if (!data || !settings.get('Federation_Matrix_enabled')) {
			return;
		}
		const {
			_id: role,
			type: action,
			scope: internalRoomId,
			u: { _id: internalTargetUserId = undefined } = {},
			givenByUserId: internalUserId,
		} = data;
		const roleEventsInterestedIn = ['moderator', 'owner'];
		if (!roleEventsInterestedIn.includes(role)) {
			return;
		}
		const handlers: Record<string, (internalUserId: string, internalTargetUserId: string, internalRoomId: string) => Promise<void>> = {
			'owner-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomOwnerAdded(internalUserId, internalTargetUserId, internalRoomId),
			'owner-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomOwnerRemoved(internalUserId, internalTargetUserId, internalRoomId),
			'moderator-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomModeratorAdded(internalUserId, internalTargetUserId, internalRoomId),
			'moderator-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
				federationRoomService.onRoomModeratorRemoved(internalUserId, internalTargetUserId, internalRoomId),
		};

		if (!handlers[`${role}-${action}`]) {
			return;
		}
		Promise.await(handlers[`${role}-${action}`](internalUserId, internalTargetUserId, internalRoomId));
	}

	public static afterRoomNameChanged(callback: (roomId: string, changedRoomName: string) => Promise<void>): void {
		callbacks.add(
			'afterRoomNameChange',
			(params: Record<string, any>): void => {
				if (!params || !params.rid || !params.name || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(params.rid, params.name));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-name-changed',
		);
	}

	public static afterRoomTopicChanged(callback: (roomId: string, changedRoomTopic: string) => Promise<void>): void {
		callbacks.add(
			'afterRoomTopicChange',
			(params: Record<string, any>): void => {
				if (!params || !params.rid || !params.topic || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(params.rid, params.topic));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-topic-changed',
		);
	}

	public static removeCEValidation(): void {
		callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-federated-room');
		callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
	}

	public static removeAllListeners(): void {
		callbacks.remove('afterLeaveRoom', 'federation-v2-after-leave-room');
		callbacks.remove('afterRemoveFromRoom', 'federation-v2-after-remove-from-room');
		callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-non-federated-room');
		callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-federated-room');
		callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
		callbacks.remove('afterSetReaction', 'federation-v2-after-message-reacted');
		callbacks.remove('afterUnsetReaction', 'federation-v2-after-message-unreacted');
		callbacks.remove('afterDeleteMessage', 'federation-v2-after-room-message-deleted');
		callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-updated');
		callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-sent');
		callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-sent');
	}
}
