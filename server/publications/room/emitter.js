import { emitRoomDataEvent } from '../../stream/rooms';
import { Rooms, Subscriptions } from '../../../app/models';
import { Notifications } from '../../../app/notifications';

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

	emitRoomDataEvent(id, data);
});
