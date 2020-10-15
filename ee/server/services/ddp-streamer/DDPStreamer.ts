import http, { RequestOptions, IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import WebSocket from 'ws';
// import PromService from 'moleculer-prometheus';

import { Client } from './Client';
// import { STREAMER_EVENTS, STREAM_NAMES } from './constants';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { events } from './configureServer';
import notifications from './streams/index';
import { StreamerCentral } from '../../../../server/modules/streamer/streamer.module';
import { ListenersModule } from '../../../../server/modules/listeners/listeners.module';

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

	if (process.env.NODE_ENV !== 'production' && !/^\/sockjs\/info\?cb=/.test(req.url || '')) {
		return proxy(req, res);

		// res.writeHead(404);
		// return res.end();
	}

	res.writeHead(200, { 'Content-Type': 'text/plain' });

	res.end('{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":666}');
});

httpServer.listen(port);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws, req) => new Client(ws, req.url !== '/websocket'));

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

		new ListenersModule(this, notifications);

		// [STREAMER_EVENTS.STREAM]([streamer, eventName, payload]) {
		this.onEvent('stream', ([streamer, eventName, args]): void => {
			const stream = StreamerCentral.instances[streamer];
			return stream && stream.emitWithoutBroadcast(eventName, ...args);
		});

		this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
			if (clientAction === 'removed') {
				events.emit('meteor.loginServiceConfiguration', 'removed', {
					_id: id,
				});
				return;
			}

			events.emit(
				'meteor.loginServiceConfiguration',
				clientAction === 'inserted' ? 'added' : 'changed',
				data,
			);
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
