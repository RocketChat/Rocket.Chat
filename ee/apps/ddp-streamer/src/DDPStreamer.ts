import crypto from 'crypto';

import { MeteorService, Presence, ServiceClass } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Users } from '@rocket.chat/models';
import polka from 'polka';
import { throttle } from 'underscore';
import WebSocket from 'ws';

import { Client, clientMap } from './Client';
import { events, server } from './configureServer';
import { DDP_EVENTS } from './constants';
import { Autoupdate } from './lib/Autoupdate';
import { proxy } from './proxy';
import { ListenersModule } from '../../../../apps/meteor/server/modules/listeners/listeners.module';
import type { NotificationsModule } from '../../../../apps/meteor/server/modules/notifications/notifications.module';
import { StreamerCentral } from '../../../../apps/meteor/server/modules/streamer/streamer.module';

const { PORT = 4000 } = process.env;

export class DDPStreamer extends ServiceClass {
	protected name = 'streamer';

	private app?: polka.Polka;

	private wss?: WebSocket.Server;

	constructor(notifications: NotificationsModule) {
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

			if (data) {
				events.emit('meteor.loginServiceConfiguration', clientAction === 'inserted' ? 'added' : 'changed', data);
			}
		});

		this.onEvent('user.forceLogout', (uid: string) => {
			this.wss?.clients.forEach((ws) => {
				const client = clientMap.get(ws);
				if (client?.userId === uid) {
					ws.terminate();
				}
			});
		});

		this.onEvent('meteor.clientVersionUpdated', (versions): void => {
			Autoupdate.updateVersion(versions);
		});
	}

	// update connections count every 30 seconds
	updateConnections = throttle(() => {
		InstanceStatus.updateConnections(this.wss?.clients.size ?? 0);
	}, 30000);

	async created(): Promise<void> {
		if (!this.context) {
			return;
		}

		const { broker, nodeID } = this.context;
		if (!broker || !nodeID) {
			return;
		}

		const { metrics } = broker;
		if (!metrics) {
			return;
		}

		metrics.register({
			name: 'rocketchat_subscription',
			type: 'histogram',
			labelNames: ['subscription'],
			description: 'Client subscriptions to Rocket.Chat',
			unit: 'millisecond',
			quantiles: true,
		});

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

		server.setMetrics(metrics);

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

		async function sendUserData(client: Client, userId: string) {
			// TODO figure out what fields to send. maybe to to export function getBaseUserFields to a package
			const loggedUser = await Users.findOneById(userId, {
				projection: {
					'name': 1,
					'username': 1,
					'nickname': 1,
					'emails': 1,
					'status': 1,
					'statusDefault': 1,
					'statusText': 1,
					'statusConnection': 1,
					'bio': 1,
					'avatarOrigin': 1,
					'utcOffset': 1,
					'language': 1,
					'settings': 1,
					'enableAutoAway': 1,
					'idleTimeLimit': 1,
					'roles': 1,
					'active': 1,
					'defaultRoom': 1,
					'customFields': 1,
					'requirePasswordChange': 1,
					'requirePasswordChangeReason': 1,
					'statusLivechat': 1,
					'banners': 1,
					'oauth.authorizedClients': 1,
					'_updatedAt': 1,
					'avatarETag': 1,
					'extension': 1,
					'openBusinessHours': 1,
					'services.totp.enabled': 1,
					'services.email2fa.enabled': 1,
				},
			});
			if (!loggedUser) {
				return;
			}

			// using setImmediate here so login's method result is sent before we send the user data
			setImmediate(async () => server.added(client, 'users', userId, loggedUser));
		}
		server.on(DDP_EVENTS.LOGGED, async (info: Client) => {
			const { userId, connection } = info;

			if (!userId) {
				throw new Error('User not logged in');
			}

			await Presence.newConnection(userId, connection.id, nodeID);

			this.updateConnections();

			// mimic Meteor's default publication that sends user data after login
			await sendUserData(info, userId);

			server.emit('presence', { userId, connection });

			this.api?.broadcast('accounts.login', { userId, connection });
		});

		server.on(DDP_EVENTS.LOGGEDOUT, (info) => {
			const { userId, connection } = info;

			this.api?.broadcast('accounts.logout', { userId, connection });

			this.updateConnections();

			if (!userId) {
				return;
			}
			Presence.removeConnection(userId, connection.id, nodeID);
		});

		server.on(DDP_EVENTS.DISCONNECTED, (info) => {
			const { userId, connection } = info;

			this.api?.broadcast('socket.disconnected', connection);

			this.updateConnections();

			if (!userId) {
				return;
			}
			Presence.removeConnection(userId, connection.id, nodeID);
		});

		server.on(DDP_EVENTS.CONNECTED, ({ connection }) => {
			this.api?.broadcast('socket.connected', connection);
		});
	}

	async started(): Promise<void> {
		// TODO this call creates a dependency to MeteorService, should it be a hard dependency? or can this call fail and be ignored?
		try {
			const versions = await MeteorService.getAutoUpdateClientVersions();

			Object.keys(versions || {}).forEach((key) => {
				Autoupdate.updateVersion(versions[key]);
			});

			this.app = polka()
				.use(proxy())
				.get('/health', async (_req, res) => {
					try {
						if (!this.api) {
							throw new Error('API not available');
						}

						await this.api.nodeList();
						res.end('ok');
					} catch (err) {
						console.error('Service not healthy', err);

						res.writeHead(500);
						res.end('not healthy');
					}
				})
				.get('*', function (_req, res) {
					res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Content-Type', 'application/json');

					res.writeHead(200);

					res.end(
						`{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":${crypto.randomBytes(4).readUInt32LE(0)},"ms":true}`,
					);
				})
				.listen(PORT);

			this.wss = new WebSocket.Server({ server: this.app.server });

			this.wss.on('connection', (ws, req) => new Client(ws, req.url !== '/websocket', req));

			InstanceStatus.registerInstance('ddp-streamer', {});
		} catch (err) {
			console.error('DDPStreamer did not start correctly', err);
		}
	}

	async stopped(): Promise<void> {
		this.wss?.clients.forEach(function (client) {
			client.terminate();
		});

		this.app?.server?.close();
		this.wss?.close();
	}
}
