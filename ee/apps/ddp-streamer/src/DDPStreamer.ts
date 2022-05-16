import http, { IncomingMessage, RequestOptions, ServerResponse } from 'http';
import url from 'url';

import WebSocket from 'ws';

import { ListenersModule } from '../../../../apps/meteor/server/modules/listeners/listeners.module';
import { StreamerCentral } from '../../../../apps/meteor/server/modules/streamer/streamer.module';
import { MeteorService } from '../../../../apps/meteor/server/sdk';
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { Client } from './Client';
import { events, server } from './configureServer';
import { DDP_EVENTS } from './constants';
import { Autoupdate } from './lib/Autoupdate';
import { notifications } from './streams';

const { PORT: port = 4000 } = process.env;

const proxy = function (req: IncomingMessage, res: ServerResponse): void {
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

export class DDPStreamer extends ServiceClass {
	protected name = 'streamer';

	constructor() {
		super();

		new ListenersModule(this, notifications);

		// TODO this is triggered by local events too, need to find a way to ignore if it's local
		this.onEvent('stream', ([streamer, eventName, args]): void => {
			// TODO rename StreamerCentral to StreamerStore or something to use it only as a store
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

		this.onEvent('meteor.clientVersionUpdated', (versions): void => {
			Autoupdate.updateVersion(versions);
		});
	}

	async started(): Promise<void> {
		// TODO this call creates a dependency to MeteorService, should it be a hard dependency? or can this call fail and be ignored?
		const versions = await MeteorService.getAutoUpdateClientVersions();

		Object.keys(versions).forEach((key) => {
			Autoupdate.updateVersion(versions[key]);
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
