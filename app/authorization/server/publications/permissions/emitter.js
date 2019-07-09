import { Notifications } from '../../../../notifications';
import Permissions from '../../../../models/server/models/Permissions';

Permissions.on('change', ({ clientAction, id, data, diff }) => {
	if (diff && Object.keys(diff).length === 1 && diff._updatedAt) { // avoid useless changes
		return;
	}
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			data = data || Permissions.findOneById(id);
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	Notifications.notifyLoggedInThisInstance(
		'permissions-changed',
		clientAction,
		data
	);
});
