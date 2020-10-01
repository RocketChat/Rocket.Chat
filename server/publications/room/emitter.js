import { Rooms, Subscriptions } from '../../../app/models/server';
import { Notifications } from '../../../app/notifications/server';
import notifications from '../../../app/notifications/server/lib/Notifications';

import { fields } from '.';

const getSubscriptions = (id) => {
	const fields = { 'u._id': 1 };
	return Subscriptions.trashFind({ rid: id }, { fields });
};

Rooms.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			// Override data cuz we do not publish all fields
			data = Rooms.findOneById(id, { fields });
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	if (!data) {
		return;
	}
	if (clientAction === 'removed') {
		getSubscriptions(id).forEach(({ u }) => {
			Notifications.notifyUserInThisInstance(
				u._id,
				'rooms-changed',
				clientAction,
				data,
			);
		});
	}

	Notifications.streamUser.__emit(id, clientAction, data);

	// TODO validate emitWithoutBroadcast
	notifications.streamRoomData.emitWithoutBroadcast(id, clientAction, data);
});
