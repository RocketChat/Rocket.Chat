import { Notifications } from '../../../app/notifications';
import { Subscriptions } from '../../../app/models';
import { msgStream } from '../../../app/lib/server/lib/msgStream';

import { fields } from '.';

Subscriptions.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'inserted':
		case 'updated':
			// Override data cuz we do not publish all fields
			data = Subscriptions.findOneById(id, { fields });
			break;

		case 'removed':
			data = Subscriptions.trashFindOneById(id, { fields: { u: 1, rid: 1 } });
			// emit a removed event on msg stream to remove the user's stream-room-messages subscription when the user is removed from room
			msgStream.__emit(data.u._id, clientAction, data);
			break;
	}

	Notifications.streamUser.__emit(data.u._id, clientAction, data);

	Notifications.notifyUserInThisInstance(
		data.u._id,
		'subscriptions-changed',
		clientAction,
		data,
	);
});
