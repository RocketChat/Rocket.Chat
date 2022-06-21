import { IRoom, IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../../lib/callbacks';

export class FederationHooks {
	public static afterLeaveRoom(callback: Function): void {
		callbacks.add(
			'afterLeaveRoom',
			(user: IUser, room: IRoom): void => {
				if (!room.federated) {
					return;
				}
				Promise.await(callback(user, room));
			},
			callbacks.priority.HIGH,
			'federation-v2-after-leave-room',
		);
	}
}