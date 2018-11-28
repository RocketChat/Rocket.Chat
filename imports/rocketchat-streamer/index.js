const { EXPERIMENTAL_HUB, EXPERIMENTAL } = process.env;
import './startup';
import { Streamer } from './Streamer';
import { STREAM_NAMES } from './constants';

const roomMessages = Streamer[STREAM_NAMES['room-messages']];
const notifyUser = Streamer[STREAM_NAMES['notify-user']];

const events = EXPERIMENTAL || EXPERIMENTAL_HUB ? {
	'message'({ message }) {
		// roomMessages.emitWithoutBroadcast('__my_messages__', record, {});
		roomMessages.emit(message.rid, message);
	},
	'users.*'() {
		// return Streamer.streams[stream] && Streamer.streams[stream].emit(eventName, ...args);
	},
	// 'setting'() { },
	'subscription'({ action, subscription }) {
		RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', action, subscription);
		// notifyUser.emit('subscriptions-changed', action, subscription); TODO REMOVE ID

		// notifyUser.emit(subscription.u._id, 'subscriptions-changed', action, subscription);
		// notifyUser.internals.emit(subscription.u._id, action, subscription);
		// RocketChat.Notifications.streamUser.__emit(subscription.u._id, action, subscription);
		// RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', action, subscription);
	},
	'room'({ room, action }) {
		// RocketChat.Notifications.streamUser.__emit(id, clientAction, data);
		notifyUser.internals.emit(room._id, action, room);
	},
} : {};

export default {
	name: 'streamer',
	events: {
		...events,
		stream({ stream, eventName, args }) {
			return Streamer[STREAM_NAMES[stream]] && Streamer[stream].emit(eventName, ...args);
		},
		stream_internal: {
			handler({ stream, eventName, args }) {
				return Streamer[STREAM_NAMES[stream]] && Streamer[stream].internal.emit(eventName, ...args);
			},
		},
	},
};
