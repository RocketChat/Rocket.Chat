import type { IMessage, IRoom, IUser, Username } from '@rocket.chat/core-typings';
// import { isMessageFromMatrixFederation, isRoomFederated, isEditedMessage } from '@rocket.chat/core-typings';

import type { FederationRoomServiceSender } from '../../../application/room/sender/RoomServiceSender';
// import { settings } from '../../../../../../app/settings/server';
// import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterUserLeaveRoom(_callback: (user: IUser, room: IRoom) => Promise<void>): void {
		// callbacks.add(
		// 	'afterLeaveRoom',
		// 	async (user: IUser, room: IRoom | undefined): Promise<void> => {
		// 		if (!room || !isRoomFederated(room) || !user || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(user, room);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-leave-room',
		// );
	}

	public static onUserRemovedFromRoom(_callback: (removedUser: IUser, room: IRoom, userWhoRemoved: IUser) => Promise<void>): void {
		// callbacks.add(
		// 	'afterRemoveFromRoom',
		// 	async (params: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom | undefined): Promise<void> => {
		// 		if (
		// 			!room ||
		// 			!isRoomFederated(room) ||
		// 			!params ||
		// 			!params.removedUser ||
		// 			!params.userWhoRemoved ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(params.removedUser, room, params.userWhoRemoved);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-remove-from-room',
		// );
	}

	public static canAddFederatedUserToNonFederatedRoom(_callback: (user: IUser | string, room: IRoom) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.beforeAddUserToARoom',
		// 	async (params: { user: IUser | string; inviter?: IUser }, room: IRoom): Promise<void> => {
		// 		if (!params?.user || !room) {
		// 			return;
		// 		}
		// 		await callback(params.user, room);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-can-add-federated-user-to-non-federated-room',
		// );
	}

	public static canAddFederatedUserToFederatedRoom(_callback: (user: IUser | string, inviter: IUser, room: IRoom) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.beforeAddUserToARoom',
		// 	async (params: { user: IUser | string; inviter: IUser }, room: IRoom): Promise<void> => {
		// 		if (!params?.user || !params.inviter || !room || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(params.user, params.inviter, room);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-can-add-federated-user-to-federated-room',
		// );
	}

	public static canCreateDirectMessageFromUI(_callback: (members: IUser[]) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.beforeCreateDirectMessage',
		// 	async (members: IUser[]): Promise<void> => {
		// 		if (!members || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(members);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-can-create-direct-message-from-ui-ce',
		// );
	}

	public static afterMessageReacted(_callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterSetReaction',
		// 	async (message: IMessage, params: { user: IUser; reaction: string }): Promise<void> => {
		// 		if (
		// 			!message ||
		// 			!isMessageFromMatrixFederation(message) ||
		// 			!params ||
		// 			!params.user ||
		// 			!params.reaction ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(message, params.user, params.reaction);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-message-reacted',
		// );
	}

	public static afterMessageunReacted(_callback: (message: IMessage, user: IUser, reaction: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterUnsetReaction',
		// 	async (message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
		// 		if (
		// 			!message ||
		// 			!isMessageFromMatrixFederation(message) ||
		// 			!params ||
		// 			!params.user ||
		// 			!params.reaction ||
		// 			!params.oldMessage ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(params.oldMessage, params.user, params.reaction);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-message-unreacted',
		// );
	}

	public static afterMessageDeleted(_callback: (message: IMessage, roomId: IRoom['_id']) => Promise<void>): void {
		// callbacks.add(
		// 	'afterDeleteMessage',
		// 	async (message: IMessage, room: IRoom): Promise<void> => {
		// 		if (
		// 			!room ||
		// 			!message ||
		// 			!isRoomFederated(room) ||
		// 			!isMessageFromMatrixFederation(message) ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(message, room._id);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-room-message-deleted',
		// );
	}

	public static afterMessageUpdated(_callback: (message: IMessage, roomId: IRoom['_id'], userId: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterSaveMessage',
		// 	async (message: IMessage, room: IRoom): Promise<IMessage> => {
		// 		if (
		// 			!room ||
		// 			!isRoomFederated(room) ||
		// 			!message ||
		// 			!isMessageFromMatrixFederation(message) ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return message;
		// 		}
		// 		if (!isEditedMessage(message)) {
		// 			return message;
		// 		}
		// 		await callback(message, room._id, message.editedBy._id);
		// 		return message;
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-room-message-updated',
		// );
	}

	public static afterMessageSent(_callback: (message: IMessage, roomId: IRoom['_id'], userId: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterSaveMessage',
		// 	async (message: IMessage, room: IRoom): Promise<IMessage> => {
		// 		if (!room || !isRoomFederated(room) || !message || !settings.get('Federation_Matrix_enabled')) {
		// 			return message;
		// 		}
		// 		if (isEditedMessage(message)) {
		// 			return message;
		// 		}
		// 		await callback(message, room._id, message.u?._id);
		// 		return message;
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-room-message-sent',
		// );
	}

	public static async afterRoomRoleChanged(_federationRoomService: FederationRoomServiceSender, _data?: Record<string, any>) {
		// if (!data || !settings.get('Federation_Matrix_enabled')) {
		// 	return;
		// }
		// const {
		// 	_id: role,
		// 	type: action,
		// 	scope: internalRoomId,
		// 	u: { _id: internalTargetUserId = undefined } = {},
		// 	givenByUserId: internalUserId,
		// } = data;
		// const roleEventsInterestedIn = ['moderator', 'owner'];
		// if (!roleEventsInterestedIn.includes(role)) {
		// 	return;
		// }
		// const handlers: Record<string, (internalUserId: string, internalTargetUserId: string, internalRoomId: string) => Promise<void>> = {
		// 	'owner-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
		// 		federationRoomService.onRoomOwnerAdded(internalUserId, internalTargetUserId, internalRoomId),
		// 	'owner-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
		// 		federationRoomService.onRoomOwnerRemoved(internalUserId, internalTargetUserId, internalRoomId),
		// 	'moderator-added': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
		// 		federationRoomService.onRoomModeratorAdded(internalUserId, internalTargetUserId, internalRoomId),
		// 	'moderator-removed': (internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> =>
		// 		federationRoomService.onRoomModeratorRemoved(internalUserId, internalTargetUserId, internalRoomId),
		// };
		// if (!handlers[`${role}-${action}`]) {
		// 	return;
		// }
		// await handlers[`${role}-${action}`](internalUserId, internalTargetUserId, internalRoomId);
	}

	public static afterRoomNameChanged(_callback: (roomId: string, changedRoomName: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterRoomNameChange',
		// 	async (params: Record<string, any>): Promise<void> => {
		// 		if (!params || !params.rid || !params.name || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(params.rid, params.name);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-room-name-changed',
		// );
	}

	public static afterRoomTopicChanged(_callback: (roomId: string, changedRoomTopic: string) => Promise<void>): void {
		// callbacks.add(
		// 	'afterRoomTopicChange',
		// 	async (params: Record<string, any>): Promise<void> => {
		// 		if (!params || !params.rid || !params.topic || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(params.rid, params.topic);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-room-topic-changed',
		// );
	}

	public static onFederatedRoomCreated(_callback: (room: IRoom, owner: IUser, originalMemberList: string[]) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.afterCreateFederatedRoom',
		// 	async (room: IRoom, params: { owner: IUser; originalMemberList: string[] }) => {
		// 		if (
		// 			!room ||
		// 			!isRoomFederated(room) ||
		// 			!params ||
		// 			!params.owner ||
		// 			!params.originalMemberList ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(room, params.owner, params.originalMemberList);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-create-room',
		// );
	}

	public static onUsersAddedToARoom(_callback: (room: IRoom, addedUsers: IUser[] | Username[], inviter?: IUser) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.onAddUsersToARoom',
		// 	async (params: { invitees: IUser[] | Username[]; inviter: IUser }, room: IRoom) => {
		// 		if (
		// 			!room ||
		// 			!isRoomFederated(room) ||
		// 			!params ||
		// 			!params.invitees ||
		// 			!params.inviter ||
		// 			!settings.get('Federation_Matrix_enabled')
		// 		) {
		// 			return;
		// 		}
		// 		await callback(room, params.invitees, params.inviter);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-on-add-users-to-a-room',
		// );
		// callbacks.add(
		// 	'afterAddedToRoom',
		// 	async (params: { user: IUser; inviter?: IUser }, room: IRoom) => {
		// 		if (!room || !isRoomFederated(room) || !params || !params.user || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(room, [params.user], params?.inviter);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-add-user-to-a-room',
		// );
	}

	public static onDirectMessageRoomCreated(_callback: (room: IRoom, creatorId: string, memberList: IUser[]) => Promise<void>): void {
		// callbacks.add(
		// 	'afterCreateDirectRoom',
		// 	async (room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }) => {
		// 		if (!room || !params || !params.creatorId || !params.creatorId || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(room, params.creatorId, params.members);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-after-create-direct-message-room',
		// );
	}

	public static beforeDirectMessageRoomCreate(_callback: (memberList: IUser[]) => Promise<void>): void {
		// callbacks.add(
		// 	'beforeCreateDirectRoom',
		// 	async (members: IUser[]) => {
		// 		if (!members || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(members);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-before-create-direct-message-room',
		// );
	}

	public static beforeAddUserToARoom(_callback: (userToBeAdded: IUser | string, room: IRoom, inviter?: IUser) => Promise<void>): void {
		// callbacks.add(
		// 	'federation.beforeAddUserToARoom',
		// 	async (params: { user: IUser | string; inviter?: IUser }, room: IRoom) => {
		// 		if (!room || !isRoomFederated(room) || !params || !params.user || !settings.get('Federation_Matrix_enabled')) {
		// 			return;
		// 		}
		// 		await callback(params.user, room, params.inviter);
		// 	},
		// 	callbacks.priority.HIGH,
		// 	'federation-v2-before-add-user-to-the-room',
		// );
	}

	public static removeFreeValidation(): void {
		// callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-federated-room');
		// callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
	}

	public static removeAllListeners(): void {
		// callbacks.remove('afterLeaveRoom', 'federation-v2-after-leave-room');
		// callbacks.remove('afterRemoveFromRoom', 'federation-v2-after-remove-from-room');
		// callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-non-federated-room');
		// callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-can-add-federated-user-to-federated-room');
		// callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
		// callbacks.remove('afterSetReaction', 'federation-v2-after-message-reacted');
		// callbacks.remove('afterUnsetReaction', 'federation-v2-after-message-unreacted');
		// callbacks.remove('afterDeleteMessage', 'federation-v2-after-room-message-deleted');
		// callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-updated');
		// callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-sent');
		// callbacks.remove('afterSaveMessage', 'federation-v2-after-room-message-sent');
		// callbacks.remove('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room');
		// callbacks.remove('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room');
		// callbacks.remove('federation.onAddUsersToARoom', 'federation-v2-on-add-users-to-a-room');
		// callbacks.remove('afterAddedToRoom', 'federation-v2-after-add-user-to-a-room');
		// callbacks.remove('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room');
		// callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-before-add-user-to-the-room');
	}
}
