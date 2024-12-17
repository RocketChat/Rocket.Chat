import { Meteor } from 'meteor/meteor';

import { fields } from '.';

import { msgStream } from '../../../app/lib/server/lib/msgStream';
import { Subscriptions } from '../../../app/models';
import { Notifications } from '../../../app/notifications';

import { redisMessageHandlers } from '/app/redis/handleRedisMessage';
import { publishToRedis } from '/app/redis/redisPublisher';
import { settings } from '/app/settings/server';

const handleSubscriptionChange = Meteor.bindEnvironment((clientAction, id, data) => {
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

const handleRedis = (data) => {
	handleSubscriptionChange(data.clientAction, data._id, data);
};

if (settings.get('Use_Oplog_As_Real_Time')) {
	Subscriptions.on('change', ({ clientAction, id, data }) => {
		handleSubscriptionChange(data.clientAction, data._id, data); // TODO-Hi: Check what happens if only new subscription has sent to the client, or when only a room insertion has sent to the client
	});
} else {
	Subscriptions.on('change', ({ clientAction, id, data }) => {
		data = Subscriptions.findOneById(id, { fields }); // must query to get u._id for the desired channel

		const newdata = {
			...data,
			ns: 'rocketchat_subscription',
			clientAction,
		};
		publishToRedis(`user-${ data?.u?._id }`, newdata);
	});
}

redisMessageHandlers.rocketchat_subscription = handleRedis;
