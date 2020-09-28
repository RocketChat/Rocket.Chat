import http, { RequestOptions, IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import WebSocket from 'ws';
// import PromService from 'moleculer-prometheus';

import { Streams } from './Streamer';
import { Client, MeteorClient } from './Client';
// import { STREAMER_EVENTS, STREAM_NAMES } from './constants';
import { isEmpty } from './lib/utils';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { events } from './configureServer';
import notifications from './streams/index';

const {
	PORT: port = 4000,
// 	PROMETHEUS_PORT = 9100,
} = process.env;

const proxy = function(req: IncomingMessage, res: ServerResponse): void {
	// console.log(`request ${ req.url }`);
	req.pause();
	const options: RequestOptions = url.parse(req.url || '');
	options.headers = req.headers;
	options.method = req.method;
	options.agent = false;
	options.hostname = 'localhost';
	options.port = 3000;

	const connector = http.request(options, function(serverResponse) {
		serverResponse.pause();
		if (serverResponse.statusCode) {
			res.writeHead(serverResponse.statusCode, serverResponse.headers);
		}
		serverResponse.pipe(res);
		serverResponse.resume();
	});
	req.pipe(connector);
	req.resume();
};

const httpServer = http.createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	if (!/^\/sockjs\/info\?cb=/.test(req.url || '')) {
		return proxy(req, res);

		// res.writeHead(404);
		// return res.end();
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });

	res.end('{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":666}');
});

httpServer.listen(port);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => {
	const isMobile = /^RC Mobile/.test(req.headers['user-agent'] || '');

	return isMobile ? new Client(ws) : new MeteorClient(ws);
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

// broker.createService({
// 	settings: {
// 		port: PROMETHEUS_PORT,
// 		metrics: {
// 			streamer_users_connected: {
// 				type: 'Gauge',
// 				labelNames: ['nodeID'],
// 				help: 'Users connecteds by streamer',
// 			},
// 			streamer_users_logged: {
// 				type: 'Gauge',
// 				labelNames: ['nodeID'],
// 				help: 'Users logged by streamer',
// 			},
// 		},
// 	},
// 	mixins: PROMETHEUS_PORT !== 'false' ? [PromService] : [],

export class DDPStreamer extends ServiceClass {
	protected name = 'streamer';

	constructor() {
		super();

		// [STREAM_NAMES.LIVECHAT_INQUIRY]({ action, inquiry }) {
		this.onEvent('livechat-inquiry-queue-observer', ({ action, inquiry }): void => {
			if (!inquiry.department) {
				notifications.streamLivechatQueueData.emit('public', action, inquiry);
				return;
			}
			notifications.streamLivechatQueueData.emit(`department/${ inquiry.department }`, action, inquiry);
			notifications.streamLivechatQueueData.emit(inquiry._id, action, inquiry);
		});

		// [STREAMER_EVENTS.STREAM]([streamer, eventName, payload]) {
		this.onEvent('stream', ([streamer, eventName, payload]): void => {
			const stream = Streams.get(streamer);
			return stream && stream.emitPayload(eventName, payload);
		});

		// message({ message }) {
		this.onEvent('message', ({ message }): void => {
			// roomMessages.emitWithoutBroadcast('__my_messages__', record, {});
			notifications.streamRoomMessage.emit(message.rid, message);
		});

		// userpresence(payload) {
		this.onEvent('userpresence', (payload): void => {
			const STATUS_MAP: {[k: string]: number} = {
				offline: 0,
				online: 1,
				away: 2,
				busy: 3,
			};

			const {
				user: { _id, username, status, statusText },
			} = payload;
			// Streamer.userpresence.emit(_id, status);
			if (status) {
				notifications.notifyLogged('user-status', [_id, username, STATUS_MAP[status], statusText]);
			}
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user); // use this method
		});

		// user(payload) {
		this.onEvent('user', (payload): void => {
			const {
				action,
				user: { _id, ...user },
			} = payload;
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user);

			if (isEmpty(user)) {
				return;
			}

			const data: {
				type: string;
				diff?: object;
				data?: object;
				id?: string;
			} = {
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

			_id && notifications.notifyUser(
				_id,
				'userData',
				data,
			);

			// Notifications.notifyUserInThisInstance(id, 'userData', { diff, type: clientAction });
		});

		// 'user.name'(payload) {
		this.onEvent('user.name', (payload): void => {
			const {
				user: { _id, name, username },
			} = payload;
			// User.emit(`${ STREAMER_EVENTS.USER_CHANGED }/${ _id }`, _id, user);
			notifications.notifyLogged('Users:NameChanged', { _id, name, username });
		});

		// 'setting'() { },
		// subscription({ action, subscription }) {
		this.onEvent('subscription', ({ action, subscription }): void => {
			if (!subscription.u?._id) {
				return;
			}

			notifications.notifyUser(
				subscription.u._id,
				'subscriptions-changed',
				action,
				subscription,
			);

			notifications.streamUser.__emit(subscription.u._id, action, subscription);

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
		});

		// room({ room, action }) {
		this.onEvent('room', ({ room, action }): void => {
			// RocketChat.Notifications.streamUser.__emit(id, clientAction, data);
			if (!room._id) {
				return;
			}
			notifications.streamUser.__emit(room._id, action, room);
			notifications.streamRoomData.emit(room._id, action, room); // TODO REMOVE
		});
		// stream: {
		// 	group: 'streamer',
		// 	handler(payload) {
		// 		const [stream, ev, data] = msgpack.decode(payload);
		// 		Streamer.central.emit(stream, ev, data);
		// 	},
		// },
		// role(payload) {
		this.onEvent('role', (payload): void => {
			notifications.streamRoles.emit('roles', payload);
		});

		this.onEvent('meteor.loginServiceConfiguration', ({ action, record }): void => {
			events.emit('meteor.loginServiceConfiguration', action, record);
		});

		this.onEvent('meteor.autoUpdateClientVersionChanged', ({ record }): void => {
			events.emit('meteor.autoUpdateClientVersionChanged', record);
		});

		this.onEvent('stream.ephemeralMessage', (uid, rid, message): void => {
			notifications.notifyUser(uid, 'message', {
				groupable: false,
				...message,
				_id: String(Date.now()),
				rid,
				ts: new Date(),
			});
		});
	}
}

// broker.start();
