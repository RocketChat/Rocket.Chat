import http from 'http';

import {
	ServiceBroker,
} from 'moleculer';
// import msgpack from 'msgpack-lite';
import WebSocket from 'ws';
// import PromService from 'moleculer-prometheus';
// import config from 'moleculer.config';
import msgpack5 from 'msgpack5';

import * as Streamer from './streams';
import { Client, MeteorClient } from './Client';
import { server } from './Server';
import { STREAMER_EVENTS, DDP_EVENTS, STREAM_NAMES } from './constants';
import { isEmpty } from './lib/utils';
import { Presence } from '../../../../server/sdk';

const msgpack = msgpack5();

const broker = new ServiceBroker(config);
const {
	PORT: port = 4000,
	PROMETHEUS_PORT = 9100,
} = process.env;

const httpServer = http.createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	if (!/^\/sockjs\/info\?cb=/.test(req.url)) {
		return;
	}
	res.writeHead(200, { 'Content-Type': 'text/plain' });

	res.end('{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":666}');
});

httpServer.listen(port);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
	const isMobile = /^RC Mobile/.test(req.headers['user-agent'] || '');

	return isMobile ? new Client(ws, broker) : new MeteorClient(ws, broker);
});

// export default {
// 	name: 'streamer',
// 	events: {
// 		...events,
// 		stream({ stream, eventName, args }) {
// 			return (
// 				Streamer[STREAM_NAMES[stream]]
//         && Streamer[stream].emit(eventName, ...args)
// 			);
// 		},
// 		stream_internal: {
// 			handler({ stream, eventName, args }) {
// 				return (
// 					Streamer[STREAM_NAMES[stream]]
//           && Streamer[stream].internal.emit(eventName, ...args)
// 				);
// 			},
// 		},
// 	},
// };
broker.createService({
	name: 'streamer',
	// settings: {
	// 	port: PROMETHEUS_PORT,
	// 	metrics: {
	// 		streamer_users_connected: {
	// 			type: 'Gauge',
	// 			labelNames: ['nodeID'],
	// 			help: 'Users connecteds by streamer',
	// 		},
	// 		streamer_users_logged: {
	// 			type: 'Gauge',
	// 			labelNames: ['nodeID'],
	// 			help: 'Users logged by streamer',
	// 		},
	// 	},
	// },
	// mixins: PROMETHEUS_PORT !== 'false' ? [PromService] : [],
	events: {
		[STREAM_NAMES.LIVECHAT_INQUIRY]({ action, inquiry }) {
			if (!inquiry.department) {
				return Streamer.streamLivechatInquiry.emit('public', action, inquiry);
			}
			Streamer.streamLivechatInquiry.emit(`department/${ inquiry.department }`, action, inquiry);
			Streamer.streamLivechatInquiry.emit(inquiry._id, action, inquiry);
		},
		[STREAMER_EVENTS.STREAM]([streamer, eventName, payload]) {
			const stream = Streamer.Streams.get(streamer);
			return stream && stream.emitPayload(eventName, payload);
		},
		message({ message }) {
			// roomMessages.emitWithoutBroadcast('__my_messages__', record, {});
			Streamer.roomMessages.emit(message.rid, message);
		},
		userpresence(payload) {
			const STATUS_MAP = {
				offline: 0,
				online: 1,
				away: 2,
				busy: 3,
			};

			const {
				user: { _id, username, status, statusText },
			} = msgpack.decode(payload);
			// Streamer.userpresence.emit(_id, status);
			Streamer.notifyLogged.emit('user-status', [_id, username, STATUS_MAP[status], statusText]);
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user); // use this method
		},
		user(payload) {
			const {
				action,
				user: { _id, _updatedAt, ...user },
			} = msgpack.decode(payload);
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user);

			if (isEmpty(user)) {
				return;
			}

			const data = {
				type: action,
			};

			switch (action) {
				case 'updated':
					data.diff = user;
					break;
				case 'inserted':
					data.data = user;
					break;
				case 'removed':
					data.id = _id;
					break;
			}

			Streamer.notifyUser.emit(
				`${ _id }/userData`,
				data,
			);

			// Notifications.notifyUserInThisInstance(id, 'userData', { diff, type: clientAction });
		},
		'user.name'(payload) {
			const {
				user: { _id, name, username },
			} = msgpack.decode(payload);
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user);
			Streamer.notifyLogged.emit('Users:NameChanged', { _id, name, username });
		},
		// 'setting'() { },
		subscription({ action, subscription }) {
			Streamer.notifyUser.emit(
				`${ subscription.u._id }/subscriptions-changed`,
				action,
				subscription,
			);

			Streamer.notifyUser.__emit(subscription.u._id, action, subscription);

			// RocketChat.Notifications.notifyUserInThisInstance(
			// 	subscription.u._id,
			// 	'subscriptions-changed',
			// 	action,
			// 	subscription
			// );
			// notifyUser.emit('subscriptions-changed', action, subscription); TODO REMOVE ID

			// notifyUser.emit(subscription.u._id, 'subscriptions-changed', action, subscription);
			// RocketChat.Notifications.streamUser.__emit(subscription.u._id, action, subscription);
			// RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'subscriptions-changed', action, subscription);
		},
		room({ room, action }) {
			// RocketChat.Notifications.streamUser.__emit(id, clientAction, data);
			Streamer.notifyUser.__emit(room._id, action, room);
			Streamer.streamRoomData.emit(room._id, action, room); // TODO REMOVE
		},
		// stream: {
		// 	group: 'streamer',
		// 	handler(payload) {
		// 		const [stream, ev, data] = msgpack.decode(payload);
		// 		Streamer.central.emit(stream, ev, data);
		// 	},
		// },
		role(payload) {
			Streamer.streamRoles.emit('roles', payload);
		},
	},
});

broker.start();

server.on(DDP_EVENTS.LOGGED, ({ uid, session }) => {
	Presence.newConnection(uid, session);
});

server.on(DDP_EVENTS.DISCONNECTED, ({ uid, session }) => {
	if (!uid) {
		return;
	}
	Presence.removeConnection(uid, session);
});

server.on(DDP_EVENTS.CONNECTED, () => {
	broker.emit('metrics.update', {
		name: 'streamer_users_connected',
		method: 'inc',
		labels: {
			nodeID: broker.nodeID,
		},
	});
});

server.on(DDP_EVENTS.LOGGED, (/* client*/) => {
	broker.emit('metrics.update', {
		name: 'streamer_users_logged',
		method: 'inc',
		labels: {
			nodeID: broker.nodeID,
		},
	});
});

server.on(DDP_EVENTS.DISCONNECTED, ({ uid }) => {
	broker.emit('metrics.update', {
		name: 'streamer_users_connected',
		method: 'dec',
		labels: {
			nodeID: broker.nodeID,
		},
	});
	if (uid) {
		broker.emit('metrics.update', {
			name: 'streamer_users_logged',
			method: 'dec',
			labels: {
				nodeID: broker.nodeID,
			},
		});
	}
});
