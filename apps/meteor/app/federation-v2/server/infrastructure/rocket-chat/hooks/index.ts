import { IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterLeaveRoom(callback: Function): void {
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

	public static canAddTheUserToTheRoom(callback: Function): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string }, room: IRoom): void => {
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-user-to-the-room',
		);
	}

	public static canAddUsersToTheRoom(callback: Function): void {
		callbacks.add(
			'federation.beforeAddUserAToRoom',
			(params: { user: IUser | string }, room: IRoom): void => {
				Promise.await(callback(params.user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-can-add-users-to-the-room',
		);
	}

	public static removeCEValidation(): void {
		callbacks.remove('federation.beforeAddUserAToRoom', 'federation-v2-can-add-users-to-the-room');
	}
}
