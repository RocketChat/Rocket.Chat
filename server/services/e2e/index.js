import { callbacks } from '../../../app/callbacks';
import { Notifications } from '../notifications';

import './beforeCreateRoom';

callbacks.add('afterJoinRoom', (user, room) => {
	Notifications.notifyRoom('e2e.keyRequest', room._id, room.e2eKeyId);
}, callbacks.priority.MEDIUM, 'e2e');
