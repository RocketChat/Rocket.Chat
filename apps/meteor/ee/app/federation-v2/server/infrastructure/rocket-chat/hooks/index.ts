import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../../lib/callbacks';

export class FederationHooksEE {
	public static onFederatedRoomCreated(callback: (room: IRoom, owner: IUser, originalMemberList: string[]) => Promise<void>): void {
		callbacks.add(
			'federation.afterCreateFederatedRoom',
			(room: IRoom, { owner, originalMemberList }): void => {
				if (!room.federated) {
					return;
				}
				Promise.await(callback(room, owner, originalMemberList));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-create-room',
		);
	}

	public static onUsersAddedToARoom(callback: (room: IRoom, inviter: IUser, addedUsers: IUser[]) => Promise<void>): void {
		callbacks.add(
			'afterAddedToRoom',
			(params: { user: IUser; inviter: IUser }, room: IRoom): void => {
				if (!room.federated) {
					return;
				}
				Promise.await(callback(room, params.inviter, [params.user]));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-add-users-to-a-room',
		);
	}

	public static onDirectMessageRoomCreated(callback: (room: IRoom, creatorId: string, memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'afterCreateDirectRoom',
			(room: IRoom, second: { members: IUser[]; creatorId: IUser['_id'] }): void =>
				Promise.await(callback(room, second.creatorId, second.members)),
			callbacks.priority.HIGH,
			'federation-v2-after-create-direct-message-room',
		);
	}

	public static beforeDirectMessageRoomCreate(callback: (memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'beforeCreateDirectRoom',
			(members: IUser[]): void => Promise.await(callback(members)),
			callbacks.priority.HIGH,
			'federation-v2-before-create-direct-message-room',
		);
	}

	public static beforeAddUserToARoom(callback: (userToBeAdded: IUser | string, room: IRoom) => Promise<void>): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string }, room: IRoom): void => {
				if (!room.federated) {
					return;
				}
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-before-add-user-to-the-room',
		);
	}

	public static afterRoomNameChanged(callback: (roomId: string, changedRoomName: string) => Promise<void>): void {
		callbacks.add(
			'afterRoomNameChange',
			({ rid: roomId, name }: Record<string, any>): void => {
				Promise.await(callback(roomId, name));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-name-changed',
		);
	}

	public static afterRoomTopicChanged(callback: (roomId: string, changedRoomTopic: string) => Promise<void>): void {
		callbacks.add(
			'afterRoomTopicChange',
			({ rid: roomId, topic }: Record<string, any>): void => {
				Promise.await(callback(roomId, topic));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-room-topic-changed',
		);
	}

	public static removeAll(): void {
		callbacks.remove('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room');
		callbacks.remove('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room');
		callbacks.remove('afterAddedToRoom', 'federation-v2-after-add-users-to-a-room');
		callbacks.remove('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room');
		callbacks.remove('federation.beforeAddUserAToRoom', 'federation-v2-before-add-user-to-the-room');
		callbacks.remove('afterRoomNameChange', 'federation-v2-after-room-name-changed');
		callbacks.remove('afterRoomTopicChange', 'federation-v2-after-room-topic-changed');
	}
}
