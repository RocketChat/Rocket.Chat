import crypto from 'crypto';

import { MeteorService, ServiceClass } from '@rocket.chat/core-services';
import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { ClientVersion, ConnectionLifecycle, ConnectionRegistry, MeteorCollection, Server } from '@rocket.chat/ddp-server';
import { Session, applyLoginServiceConfigurationChange, encodeAdded, setClientVersion, trackPresence } from '@rocket.chat/ddp-server';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Users } from '@rocket.chat/models';
import type { NotificationsModule, SettingsReader } from '@rocket.chat/streamer';
import { ListenersModule, invalidatePublicationUserCache } from '@rocket.chat/streamer';
import polka from 'polka';
import { throttle } from 'underscore';
import WebSocket from 'ws';

import { proxy } from './http/proxy';

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
		notifications: NotificationsModule,
	) {
		super();

		new ListenersModule(this, notifications, noSettings);

		this.onEvent('watch.loginServiceConfiguration', (change) =>
			applyLoginServiceConfigurationChange(this.collections.loginServices, change),
		);

		this.onEvent('user.forceLogout', (uid: string, sessionId?: string) => this.registry.forceLogout(uid, sessionId));

		this.onEvent('meteor.clientVersionUpdated', (record) => setClientVersion(this.collections.clientVersions, record));

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
		const nodeID = this.context?.nodeID;
		if (!nodeID) {
			// presence is recorded per node, and the login handler below is what sends a
			// client its own user document, so there is nothing safe to do without one
			console.error('DDPStreamer has no broker context: presence and post login user data are disabled');
			return;
		}

		// metrics are optional - a broker that does not collect them must not stop the
		// lifecycle handlers below from being registered
		const metrics = this.context?.broker?.metrics;

		if (metrics) {
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
		}

		trackPresence(this.lifecycle, nodeID);

		this.lifecycle.on('connected', ({ connection }) => {
			metrics?.increment('users_connected', { nodeID }, 1);
			void this.api?.broadcast('socket.connected', connection);
		});

		this.lifecycle.on('loggedIn', (session) => {
			metrics?.increment('users_logged', { nodeID }, 1);
			void this.onLoggedIn(session);
		});

		this.lifecycle.on('loggedOut', ({ userId, connection }) => {
			// Anonymous clients can call logout, so userId may be undefined here although the event type says string.
			void this.api?.broadcast('accounts.logout', { userId: userId as string, connection });

			this.updateConnections();
		});

		this.lifecycle.on('disconnected', ({ userId, connection }) => {
			metrics?.decrement('users_connected', { nodeID }, 1);
			if (userId) {
				metrics?.decrement('users_logged', { nodeID }, 1);
			}

			void this.api?.broadcast('socket.disconnected', connection);

			this.updateConnections();
		});
	}

	private async onLoggedIn(session: Session): Promise<void> {
		const { userId, connection } = session;

		if (!userId) {
			throw new Error('User not logged in');
		}

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

	override async started(): Promise<void> {
		void MeteorService.getLoginServiceConfiguration()
			.then((records = []) => records.forEach((record) => this.collections.loginServices.set(record._id, record)))
			.catch((err) => console.error('DDPStreamer not able to retrieve login services configuration', err));

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

				res.end(`{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":${crypto.randomBytes(4).readUInt32LE(0)},"ms":true}`);
			})
			.listen(PORT);

		this.wss = new WebSocket.Server({ server: this.app.server });

		this.wss.on('connection', (ws, req) => new Session(this.server, this.lifecycle, ws, req.url !== '/websocket', req));

		void InstanceStatus.registerInstance('ddp-streamer', {});

		// deliberately last and non fatal: traefik routes /websocket to this process, so
		// one that is up but not listening takes down every realtime feature
		await MeteorService.getAutoUpdateClientVersions()
			.then((versions) => Object.values(versions ?? {}).forEach((version) => setClientVersion(this.collections.clientVersions, version)))
			.catch((err) => console.error('DDPStreamer could not load client versions', err));
	}

	override async stopped(): Promise<void> {
		this.registry.terminateAll();

		this.app?.server?.close();
		this.wss?.close();
	}
}
