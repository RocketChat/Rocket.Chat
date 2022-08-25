import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterUserLeaveRoom(callback: (user: IUser, room: IRoom) => Promise<void>): void {
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

	public static onUserRemovedFromRoom(callback: (removedUser: IUser, room: IRoom, userWhoRemoved: IUser) => Promise<void>): void {
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

	public static removeCEValidation(): void {
		callbacks.remove('federation.beforeAddUserAToRoom', 'federation-v2-can-add-federated-user-to-federated-room');
		callbacks.remove('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce');
	}
}
