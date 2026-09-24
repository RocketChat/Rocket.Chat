import crypto from 'crypto';

import type { AutoUpdateRecord } from '@rocket.chat/core-services';
import { MeteorService, Presence, ServiceClass } from '@rocket.chat/core-services';
import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Users } from '@rocket.chat/models';
import type { NotificationsModule, SettingsReader } from '@rocket.chat/streamer';
import { ListenersModule, invalidatePublicationUserCache } from '@rocket.chat/streamer';
import polka from 'polka';
import { throttle } from 'underscore';
import WebSocket from 'ws';

import type { ConnectionRegistry } from './ddp/ConnectionRegistry';
import type { Server } from './ddp/Server';
import { Session } from './ddp/Session';
import { encodeAdded } from './ddp/codec';
import type { ConnectionLifecycle } from './ddp/lifecycle';
import { proxy } from './http/proxy';
import type { MeteorCollection } from './lib/MeteorCollection';
import type { ClientVersion } from './publications/autoupdate';

const { PORT = 4000 } = process.env;

const CONNECTION_COUNT_REPORT_INTERVAL_MS = 30_000;

// This process never populated the monolith settings cache the listeners used to read,
// so every lookup already resolved to undefined here. Kept explicit until a reader backed
// by Settings.get + onSettingChanged replaces it.
const noSettings: SettingsReader = { get: () => undefined };

export type MeteorCollections = {
	loginServices: MeteorCollection<Partial<LoginServiceConfiguration>>;
	clientVersions: MeteorCollection<ClientVersion>;
};

export class DDPStreamer extends ServiceClass {
	protected name = 'streamer';

	private app?: polka.Polka;

	private wss?: WebSocket.Server;

	constructor(
		private readonly server: Server,
		private readonly lifecycle: ConnectionLifecycle,
		private readonly registry: ConnectionRegistry,
		private readonly collections: MeteorCollections,
		private readonly notifications: NotificationsModule,
	) {
		super();

		new ListenersModule(this, notifications, noSettings);

		// TODO this is triggered by local events too, need to find a way to ignore if it's local
		this.onEvent('stream', ([streamer, eventName, args]): void => {
			this.notifications.getStream(streamer)?._emit(eventName, args, undefined, false);
		});

		this.onEvent('watch.loginServiceConfiguration', ({ clientAction, id, data }) => {
			if (clientAction === 'removed') {
				this.collections.loginServices.remove(id);
				return;
			}

			if (data) {
				this.collections.loginServices.set(id, data);
			}
		});

		this.onEvent('user.forceLogout', (uid: string, sessionId?: string) => {
			if (sessionId) {
				this.registry.closeSession(sessionId);
				return;
			}
			this.registry.closeForUser(uid);
		});

		this.onEvent('meteor.clientVersionUpdated', (record): void => {
			this.setClientVersion(record);
		});

		// The publication user cache lives inside the NotificationsModule process. In a
		// microservices deployment, ddp-streamer hosts that module but does not host
		// MeteorService, so the watch.users invalidation registered in
		// apps/meteor/server/services/meteor/service.ts never reaches this process.
		// Without this listener, role/ban/user changes would only propagate after the
		// 60s TTL expires.
		this.onEvent('watch.users', (data): void => {
			invalidatePublicationUserCache(data.id);
		});
	}

	updateConnections = throttle(() => {
		void InstanceStatus.updateConnections(this.registry.size);
	}, CONNECTION_COUNT_REPORT_INTERVAL_MS);

	override async created(): Promise<void> {
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

		this.server.setMetrics(metrics);

		this.lifecycle.on('connected', ({ connection }) => {
			metrics.increment('users_connected', { nodeID }, 1);
			void this.api?.broadcast('socket.connected', connection);
		});

		this.lifecycle.on('loggedIn', (session) => {
			metrics.increment('users_logged', { nodeID }, 1);
			void this.onLoggedIn(session, nodeID);
		});

		this.lifecycle.on('loggedOut', ({ userId, connection }) => {
			// Anonymous clients can call logout, so userId may be undefined here although the event type says string.
			void this.api?.broadcast('accounts.logout', { userId: userId as string, connection });

			this.updateConnections();

			if (!userId) {
				return;
			}
			void Presence.removeConnection(userId, connection.id, nodeID);
		});

		this.lifecycle.on('disconnected', ({ userId, connection }) => {
			metrics.decrement('users_connected', { nodeID }, 1);
			if (userId) {
				metrics.decrement('users_logged', { nodeID }, 1);
			}

			void this.api?.broadcast('socket.disconnected', connection);

			this.updateConnections();

			if (!userId) {
				return;
			}
			void Presence.removeConnection(userId, connection.id, nodeID);
		});

		this.lifecycle.on('activity', ({ userId, connection }) => {
			if (!userId) {
				return;
			}
			void Presence.updateConnection(userId, connection.id).catch((err) => {
				console.error('Error updating connection presence:', err);
			});
		});
	}

	private async onLoggedIn(session: Session, nodeID: string): Promise<void> {
		const { userId, connection } = session;

		if (!userId) {
			throw new Error('User not logged in');
		}

		await Presence.newConnection(userId, connection.id, nodeID);

		this.updateConnections();

		// mimic Meteor's default publication that sends user data after login
		await this.sendUserData(session, userId);

		void this.api?.broadcast('accounts.login', { userId, connection });
	}

	private async sendUserData(session: Session, userId: string): Promise<void> {
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
				'openBusinessHours': 1,
				'services.totp.enabled': 1,
				'services.email2fa.enabled': 1,
			},
		});
		if (!loggedUser) {
			return;
		}

		// using setImmediate here so login's method result is sent before we send the user data
		setImmediate(() => session.send(encodeAdded('users', userId, loggedUser)));
	}

	// The architecture is the DDP document id, so it is not repeated in the fields, matching Meteor's autoupdate collection.
	private setClientVersion({ _id, ...version }: AutoUpdateRecord): void {
		this.collections.clientVersions.set(_id, version);
	}

	override async started(): Promise<void> {
		void MeteorService.getLoginServiceConfiguration()
			.then((records = []) => records.forEach((record) => this.collections.loginServices.set(record._id, record)))
			.catch((err) => console.error('DDPStreamer not able to retrieve login services configuration', err));

		// TODO this call creates a dependency to MeteorService, should it be a hard dependency? or can this call fail and be ignored?
		try {
			const versions = await MeteorService.getAutoUpdateClientVersions();

			Object.keys(versions || {}).forEach((key) => {
				this.setClientVersion(versions[key]);
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

			this.wss.on('connection', (ws, req) => new Session(this.server, this.lifecycle, ws, req.url !== '/websocket', req));

			void InstanceStatus.registerInstance('ddp-streamer', {});
		} catch (err) {
			console.error('DDPStreamer did not start correctly', err);
		}
	}

	override async stopped(): Promise<void> {
		this.registry.terminateAll();

		this.app?.server?.close();
		this.wss?.close();
	}
}
