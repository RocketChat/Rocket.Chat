import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterLeaveRoom(callback: (user: IUser, room: IRoom) => void): void {
		callbacks.add(
			'afterLeaveRoom',
			(user: IUser, room: IRoom | undefined): void => {
				if (!room?.federated) {
					return;
				}
				Promise.await(callback(user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-leave-room',
		);
	}

	public static afterRemoveFromRoom(callback: (removedUser: IUser, room: IRoom, userWhoRemoved: IUser) => void): void {
		callbacks.add(
			'afterRemoveFromRoom',
			(params: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom | undefined): void => {
				if (!room?.federated) {
					return;
				}
				Promise.await(callback(params.removedUser, room, params.userWhoRemoved));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-remove-from-room',
		);
	}

	public static canAddTheUserToTheRoom(callback: (user: string | IUser, room: IRoom) => void): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string }, room: IRoom): void => {
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-user-to-the-room',
		);
	}

	public static canAddUsersToTheRoom(callback: (user: IUser | string, inviter: IUser, room: IRoom) => void): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string; inviter: IUser }, room: IRoom): void => {
				Promise.await(callback(params.user, params.inviter, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-users-to-the-room',
		);
	}

	public static beforeCreateDirectMessage(callback: (members: IUser[]) => void): void {
		callbacks.add(
			'federation.beforeCreateDirectMessage',
			(members: IUser[]): void => {
				Promise.await(callback(members));
			},
			callbacks.priority.HIGH,
			'federation-v2-before-create-direct-message-ce',
		);
	}

	public static removeCEValidation(): void {
		callbacks.remove('federation.beforeAddUserAToRoom', 'federation-v2-can-add-users-to-the-room');
		callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-before-create-direct-message-ce');
	}
}
