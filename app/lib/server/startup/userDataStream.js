import { Users } from '../../../models/server';
import { Notifications } from '../../../notifications/server';

Users.on('change', ({ clientAction, id, data, diff }) => {
	switch (clientAction) {
		case 'updated':
			Notifications.notifyUser(id, 'userData', { diff, type: clientAction });
			break;
		case 'inserted':
			Notifications.notifyUser(id, 'userData', { data, type: clientAction });
			break;
		case 'removed':
			Notifications.notifyUser(id, 'userData', { id, type: clientAction });
			break;
	}
});
