import { Notifications } from '../../../app/notifications';
import { Subscriptions } from '../../../app/models';

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
			break;
	}

	Notifications.streamUser.__emit(data.u._id, clientAction, data);

	Notifications.notifyUserInThisInstance(
		data.u._id,
		'subscriptions-changed',
		clientAction,
		data
	);
});
