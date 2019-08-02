import { Notifications } from '../../../../notifications';
import Permissions from '../../../../models/server/models/Permissions';
import { NOTIFY_ALL } from '../../../../emitter/server';

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
	NOTIFY_ALL.permission(data);
	Notifications.notifyLoggedInThisInstance(
		'permissions-changed',
		clientAction,
		data
	);
});
