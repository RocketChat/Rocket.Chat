import { IUser } from '../../../../definition/IUser';
import { callbacks } from '../../../../lib/callbacks';
import { IRoom } from '../../../../definition/IRoom';
import { Notifications } from '../../../../app/notifications/server';

callbacks.add(
	'afterJoinRoom',
	(user: IUser, room: IRoom) => {
		Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);

		return user;
	},
	callbacks.priority.MEDIUM,
	'e2e',
);
