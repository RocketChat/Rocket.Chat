import type { IRoom, IUser, Username } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../../lib/callbacks';
import { settings } from '../../../../../../../app/settings/server';

export class FederationHooksEE {
	public static onFederatedRoomCreated(callback: (room: IRoom, owner: IUser, originalMemberList: string[]) => Promise<void>): void {
		callbacks.add(
			'federation.afterCreateFederatedRoom',
			(room: IRoom, params: { owner: IUser; originalMemberList: string[] }): void => {
				if (
					!room ||
					!isRoomFederated(room) ||
					!params ||
					!params.owner ||
					!params.originalMemberList ||
					!settings.get('Federation_Matrix_enabled')
				) {
					return;
				}
				Promise.await(callback(room, params.owner, params.originalMemberList));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-create-room',
		);
	}

	public static onUsersAddedToARoom(callback: (room: IRoom, addedUsers: IUser[] | Username[], inviter?: IUser) => Promise<void>): void {
		callbacks.add(
			'federation.onAddUsersToARoom',
			(params: { invitees: IUser[] | Username[]; inviter: IUser }, room: IRoom): void => {
				if (
					!room ||
					!isRoomFederated(room) ||
					!params ||
					!params.invitees ||
					!params.inviter ||
					!settings.get('Federation_Matrix_enabled')
				) {
					return;
				}
				Promise.await(callback(room, params.invitees, params.inviter));
			},
			callbacks.priority.HIGH,
			'federation-v2-on-add-users-to-a-room',
		);
		callbacks.add(
			'afterAddedToRoom',
			(params: { user: IUser; inviter?: IUser }, room: IRoom): void => {
				if (!room || !isRoomFederated(room) || !params || !params.user || !params.inviter || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(room, [params.user], params?.inviter));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-add-user-to-a-room',
		);
	}

	public static onDirectMessageRoomCreated(callback: (room: IRoom, creatorId: string, memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'afterCreateDirectRoom',
			(room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }): void => {
				if (!room || !params || !params.creatorId || !params.creatorId || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(room, params.creatorId, params.members));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-create-direct-message-room',
		);
	}

	public static beforeDirectMessageRoomCreate(callback: (memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'beforeCreateDirectRoom',
			(members: IUser[]): void => {
				if (!members || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(members));
			},
			callbacks.priority.HIGH,
			'federation-v2-before-create-direct-message-room',
		);
	}

	public static beforeAddUserToARoom(callback: (userToBeAdded: IUser | string, room: IRoom, inviter?: IUser) => Promise<void>): void {
		callbacks.add(
			'federation.beforeAddUserToARoom',
			(params: { user: IUser | string; inviter?: IUser }, room: IRoom): void => {
				if (!room || !isRoomFederated(room) || !params || !params.user || !settings.get('Federation_Matrix_enabled')) {
					return;
				}
				Promise.await(callback(params.user, room, params.inviter));
			},
			callbacks.priority.HIGH,
			'federation-v2-before-add-user-to-the-room',
		);
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

	public static removeAll(): void {
		callbacks.remove('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room');
		callbacks.remove('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room');
		callbacks.remove('federation.onAddUsersToARoom', 'federation-v2-on-add-users-to-a-room');
		callbacks.remove('afterAddedToRoom', 'federation-v2-after-add-user-to-a-room');
		callbacks.remove('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room');
		callbacks.remove('federation.beforeAddUserToARoom', 'federation-v2-before-add-user-to-the-room');
		callbacks.remove('afterRoomNameChange', 'federation-v2-after-room-name-changed');
		callbacks.remove('afterRoomTopicChange', 'federation-v2-after-room-topic-changed');
	}
}
