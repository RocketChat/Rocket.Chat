import { callbacks } from '../../callbacks/server';
import { Notifications } from '../../notifications/server';
import { IUser } from '../../../definition/IUser';
import { IRoom } from '../../../definition/IRoom';

import './settings';
import './beforeCreateRoom';
import './methods/updateGroupKey';
import './methods/resetOwnE2EKey';
import './methods/requestSubscriptionKeys';

callbacks.add('afterJoinRoom', (_user: IUser, room: IRoom) => {
	Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
}, callbacks.priority.MEDIUM, 'e2e');
