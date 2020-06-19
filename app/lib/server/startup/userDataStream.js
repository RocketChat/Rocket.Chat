import { Users } from '../../../models/server';
import { Notifications } from '../../../notifications/server';

Users.on('change', ({ clientAction, id, data, diff }) => {
	switch (clientAction) {
		case 'updated':
			Notifications.notifyUserInThisInstance(id, 'userData', { diff, type: clientAction });
			break;
		case 'inserted':
			Notifications.notifyUserInThisInstance(id, 'userData', { data, type: clientAction });
			break;
		case 'removed':
			Notifications.notifyUserInThisInstance(id, 'userData', { id, type: clientAction });
			break;
	}
});
