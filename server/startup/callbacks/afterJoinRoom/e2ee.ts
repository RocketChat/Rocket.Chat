import { IUser } from '../../../../definition/IUser';
import { callbacks } from '../../../../app/callbacks/client';
import { IRoom } from '../../../../definition/IRoom';
import { Notifications } from '../../../../app/notifications/server';

callbacks.add('afterJoinRoom', (_user: IUser, room: IRoom) => {
	Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
}, callbacks.priority.MEDIUM, 'e2e');
