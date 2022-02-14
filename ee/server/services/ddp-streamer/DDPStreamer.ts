import http, { RequestOptions, IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import WebSocket from 'ws';
// import PromService from 'moleculer-prometheus';

import { Client } from './Client';
// import { STREAMER_EVENTS, STREAM_NAMES } from './constants';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { events, server } from './configureServer';
import notifications from './streams/index';
import { StreamerCentral } from '../../../../server/modules/streamer/streamer.module';
import { ListenersModule } from '../../../../server/modules/listeners/listeners.module';
import { DDP_EVENTS } from './constants';

const {
	PORT: port = 4000,
	// 	PROMETHEUS_PORT = 9100,
} = process.env;

const proxy = function (req: IncomingMessage, res: ServerResponse): void {
	// console.log(`request ${ req.url }`);
	req.pause();
	const options: RequestOptions = url.parse(req.url || '');
	options.headers = req.headers;
	options.method = req.method;
	options.agent = false;
	options.hostname = 'localhost';
	options.port = 3000;

	const connector = http.request(options, function (serverResponse) {
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

wss.on('connection', (ws, req) => new Client(ws, req.url !== '/websocket', req));

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

export class DDPStreamer extends ServiceClass {
	protected name = 'streamer';

	constructor() {
		super();

		new ListenersModule(this, notifications);

		// [STREAMER_EVENTS.STREAM]([streamer, eventName, payload]) {
		this.onEvent('stream', ([streamer, eventName, args]): void => {
			const stream = StreamerCentral.instances[streamer];
			return stream?.emitWithoutBroadcast(eventName, ...args);
		});

		this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
			if (clientAction === 'removed') {
				events.emit('meteor.loginServiceConfiguration', 'removed', {
					_id: id,
				});
				return;
			}

			events.emit('meteor.loginServiceConfiguration', clientAction === 'inserted' ? 'added' : 'changed', data);
		});

		this.onEvent('meteor.autoUpdateClientVersionChanged', ({ record }): void => {
			events.emit('meteor.autoUpdateClientVersionChanged', record);
		});
	}

	async created(): Promise<void> {
		if (!this.context) {
			return;
		}

		const { broker, nodeID } = this.context;
		if (!broker) {
			return;
		}

		const { metrics } = broker;
		if (!metrics) {
			return;
		}

		metrics.register({
			name: 'users_connected',
			type: 'gauge',
			labelNames: ['nodeID'],
			description: 'Users connected by streamer',
		});

		metrics.register({
			name: 'users_logged',
			type: 'gauge',
			labelNames: ['nodeID'],
			description: 'Users logged by streamer',
		});

		server.on(DDP_EVENTS.CONNECTED, () => {
			metrics.increment('users_connected', { nodeID }, 1);
		});

		server.on(DDP_EVENTS.LOGGED, () => {
			metrics.increment('users_logged', { nodeID }, 1);
		});

		server.on(DDP_EVENTS.DISCONNECTED, ({ userId }) => {
			metrics.decrement('users_connected', { nodeID }, 1);
			if (userId) {
				metrics.decrement('users_logged', { nodeID }, 1);
			}
		});
	}
}

// broker.start();
