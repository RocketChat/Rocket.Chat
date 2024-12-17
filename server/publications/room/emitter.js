import { Rooms, Subscriptions } from '../../../app/models';
import { Notifications } from '../../../app/notifications';
import { emitRoomDataEvent } from '../../stream/rooms';

import { fields } from '.';

import { redisMessageHandlers } from '/app/redis/handleRedisMessage';
import { publishToRedis } from '/app/redis/redisPublisher';
import { settings } from '/app/settings/server';

const getSubscriptions = (id) => {
	const fields = { 'u._id': 1 };
	return Subscriptions.trashFind({ rid: id }, { fields });
};

const handleRoom = (clientAction, id, data) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			// Override data cuz we do not publish all fields
			data = data || Rooms.findOneById(id, { fields });
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
};

const redisRoomHandle = (data) => handleRoom(data.clientAction, data._id, data);
if (settings.get('Use_Oplog_As_Real_Time')) {
	Rooms.on('change', ({ clientAction, id, data }) => {
		handleRoom(clientAction, id, data);
	});
} else {
	Rooms.on('change', ({ clientAction, id, data }) => {
		data = data || Rooms.findOneById(id, { fields });
		const newdata = {
			...data,
			ns: 'rocketchat_room',
			clientAction,
		};
		publishToRedis(`room-${ id }`, newdata);
	});
}

redisMessageHandlers.rocketchat_room = redisRoomHandle;
