import { Users } from '../../../models/server';
import { Notifications } from '../../../notifications/server';

Users.on('change', ({ clientAction, id }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			Notifications.notifyUser(id, 'userData', { user: Users.findOneById(id), type: 'changed' });
			break;
		case 'removed':
			Notifications.notifyUser(id, 'userData', { user: { _id: id }, type: 'removed' });
			break;
	}
});
