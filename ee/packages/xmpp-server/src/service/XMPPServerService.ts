import { api, Message, Room, ServiceClass } from '@rocket.chat/core-services';
import type { IXMPPServerService, XMPPServerConfiguration } from '@rocket.chat/core-services';
import { isRoomXMPPFederated, isUserXMPPFederated } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { XMPPServer } from '../XMPPServer';
import type { XMPPServerConfig } from '../config';
import type { IncomingChatMessage, IncomingPresence } from '../events';
import type { Logger as CoreLogger } from '../logger';
import { domainOfJid, toBareJid } from './helpers/jid';
import { mapPresenceToStatus, mapStatusToPresence } from './helpers/presence';
import { createOrUpdateXMPPUser } from './helpers/xmppUser';

/** Adapts the RC single-argument Logger to the pino-style logger the protocol core expects. */
function toCoreLogger(logger: Logger): CoreLogger {
	const log = (level: 'debug' | 'info' | 'warn' | 'error') => (obj: unknown, msg?: string) => {
		if (typeof obj === 'string') {
			logger[level](obj);
		} else {
			logger[level]({ ...(obj as object), ...(msg ? { msg } : {}) });
		}
	};
	const adapter: CoreLogger = {
		debug: log('debug'),
		info: log('info'),
		warn: log('warn'),
		error: log('error'),
		child: () => adapter,
	};
	return adapter;
}

/** Fields that require the listener to be restarted when they change. */
type ListenerFingerprint = string;

export class XMPPServerService extends ServiceClass implements IXMPPServerService {
	protected name = 'xmpp-server';

	private readonly logger = new Logger('XMPPServer');

	private server: XMPPServer | undefined;

	private fingerprint: ListenerFingerprint | undefined;

	private presenceEnabled = false;

	override async created(): Promise<void> {
		// Outbound presence: fan a local user's status out to the remote domains they share a DM with.
		this.onEvent('presence.status', async ({ user }): Promise<void> => {
			if (!this.server || !this.presenceEnabled || !user.username || isUserXMPPFederated(user)) {
				return;
			}
			await this.broadcastLocalPresence(user);
		});
	}

	isRunning(): boolean {
		return this.server?.isRunning ?? false;
	}

	async configure(config: XMPPServerConfiguration): Promise<void> {
		if (!config.enabled || !config.domain) {
			await this.stop();
			return;
		}

		const fingerprint = this.fingerprintOf(config);

		// A running server whose listener-affecting settings are unchanged only needs a soft update
		if (this.server?.isRunning && this.fingerprint === fingerprint) {
			this.presenceEnabled = config.presenceEnabled;
			this.logger.debug('XMPP server configuration updated (no restart required)');
			return;
		}

		await this.stop();

		try {
			const server = new XMPPServer(this.toCoreConfig(config));
			this.attachHandlers(server, config);
			await server.start();
			this.server = server;
			this.fingerprint = fingerprint;
			this.presenceEnabled = config.presenceEnabled;
			this.logger.info(`XMPP server started for domain ${config.domain} on port ${config.port}`);
		} catch (error) {
			this.logger.error({ msg: 'Failed to start XMPP server', err: error });
			throw error;
		}
	}

	async stop(): Promise<void> {
		if (!this.server) {
			return;
		}
		const { server } = this;
		this.server = undefined;
		this.fingerprint = undefined;
		try {
			await server.stop();
			this.logger.info('XMPP server stopped');
		} catch (error) {
			this.logger.error({ msg: 'Error stopping XMPP server', err: error });
		}
	}

	async sendMessage(message: IMessage, room: IRoom, user: IUser): Promise<void> {
		if (!this.server || !isRoomXMPPFederated(room) || !user.username) {
			return;
		}

		const { role, muc, with: dmJid } = room.xmppFederation;

		switch (role) {
			case 'dm':
				if (dmJid) {
					await this.server.sendChatMessage({
						from: `${user.username}@${this.server.domain}`,
						to: dmJid,
						body: message.msg,
						id: message._id,
					});
				}
				break;
			case 'host-muc':
				if (muc) {
					this.server.mucBroadcastMessage({ roomId: muc.split('@')[0], fromNick: user.username, body: message.msg, id: message._id });
				}
				break;
			case 'remote-muc':
				if (muc) {
					await this.server.mucSendToRemoteRoom({
						localJid: `${user.username}@${this.server.domain}`,
						roomJid: muc,
						body: message.msg,
						id: message._id,
					});
				}
				break;
		}
	}

	async registerHostedRoom(room: IRoom): Promise<void> {
		if (!this.server || !isRoomXMPPFederated(room) || room.xmppFederation.role !== 'host-muc' || !room.xmppFederation.muc) {
			return;
		}
		this.server.mucCreateRoom({ roomId: room.xmppFederation.muc.split('@')[0], public: room.t === 'c' });
	}

	async joinRemoteMUC(userId: string, rid: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [user, room] = await Promise.all([
			Users.findOneById(userId, { projection: { username: 1 } }),
			Rooms.findOneById(rid, { projection: { xmppFederation: 1 } }),
		]);
		if (!user?.username || !room || !isRoomXMPPFederated(room) || room.xmppFederation.role !== 'remote-muc' || !room.xmppFederation.muc) {
			return;
		}
		await this.server.mucJoinRemoteRoom({
			localJid: `${user.username}@${this.server.domain}`,
			roomJid: room.xmppFederation.muc,
			nick: user.username,
		});
	}

	async ensureXMPPUsersExistLocally(jids: string[]): Promise<void> {
		for (const jid of jids) {
			await createOrUpdateXMPPUser({ jid });
		}
	}

	/** Inbound 1:1 message: materialize the remote user + DM room, then persist deduplicated. */
	private async onIncomingMessage(event: IncomingChatMessage): Promise<void> {
		const localUsername = toBareJid(event.to).split('@')[0];
		const localUser = await Users.findOneByUsername(localUsername, { projection: { _id: 1, username: 1 } });
		if (!localUser) {
			this.logger.debug({ msg: 'XMPP message for unknown local user', to: event.to });
			return;
		}

		const remoteJid = toBareJid(event.from);
		const remoteUser = await createOrUpdateXMPPUser({ jid: remoteJid });

		const { rid } = await Room.createDirectMessage({ to: remoteUser._id, from: localUser._id });

		const room = await Rooms.findOneById(rid, { projection: { xmppFederation: 1 } });
		if (room && !isRoomXMPPFederated(room)) {
			await Rooms.updateOne(
				{ _id: rid },
				{ $set: { xmppFederation: { version: 1, role: 'dm', with: remoteJid, origin: domainOfJid(remoteJid) } } },
			);
		}

		const eventId = `xmpp:${domainOfJid(remoteJid)}:${event.id ?? Random.id()}`;
		if (await Messages.findOneByFederationId(eventId)) {
			return;
		}

		await Message.saveMessageFromFederation({
			fromId: remoteUser._id,
			rid,
			federation_event_id: eventId,
			msg: event.body,
			ts: new Date(),
		});
	}

	private toCoreConfig(config: XMPPServerConfiguration): XMPPServerConfig {
		const tlsProvided = config.tlsCert.trim() !== '' && config.tlsKey.trim() !== '';
		return {
			domain: config.domain,
			port: config.port,
			mucSubdomain: config.mucSubdomain,
			// Without operator-provided TLS material we cannot require TLS; federation still
			// works via dialback with peers that tolerate cleartext, and this keeps a
			// misconfigured install from failing to boot.
			requireTls: tlsProvided,
			tls: tlsProvided ? { cert: config.tlsCert, key: config.tlsKey } : undefined,
			allowedDomains: config.domainAllowList,
			logger: toCoreLogger(this.logger),
		};
	}

	private attachHandlers(server: XMPPServer, _config: XMPPServerConfiguration): void {
		server.on('message.received', (event) => {
			this.onIncomingMessage(event).catch((err) => this.logger.error({ msg: 'Failed to handle inbound XMPP message', err }));
		});

		server.on('presence.received', (event) => {
			this.onIncomingPresence(event).catch((err) => this.logger.error({ msg: 'Failed to handle inbound XMPP presence', err }));
		});

		// v1 policy: auto-accept a subscription request only from someone we already share a DM with.
		server.on('presence.subscriptionRequest', (event) => {
			this.onSubscriptionRequest(event).catch((err) => this.logger.error({ msg: 'Failed to handle XMPP subscription request', err }));
		});

		server.on('muc.messageReceived', (event) => {
			this.persistMucMessage(`${event.roomId}@${server.mucDomain}`, event.fromJid, event.body, event.id).catch((err) =>
				this.logger.error({ msg: 'Failed to persist hosted MUC message', err }),
			);
		});

		server.on('muc.remoteMessage', (event) => {
			this.onRemoteMucMessage(event.roomJid, event.fromNick, event.body, event.id).catch((err) =>
				this.logger.error({ msg: 'Failed to persist remote MUC message', err }),
			);
		});

		server.on('muc.inviteReceived', (event) => {
			this.onMucInvite(event).catch((err) => this.logger.error({ msg: 'Failed to handle MUC invite', err }));
		});
	}

	/** Persists a message received in a hosted MUC room (author addressed by real JID). */
	private async persistMucMessage(mucJid: string, fromJid: string, body: string, stanzaId?: string): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid }, { projection: { _id: 1 } });
		if (!room) {
			return;
		}
		const author = await createOrUpdateXMPPUser({ jid: toBareJid(fromJid) });
		await this.saveFederatedMessage(room._id, author._id, domainOfJid(fromJid), body, stanzaId);
	}

	/** Persists a message received in a remote MUC we joined (author is an opaque nick). */
	private async onRemoteMucMessage(roomJid: string, fromNick: string, body: string, stanzaId?: string): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': roomJid }, { projection: { _id: 1 } });
		if (!room) {
			return;
		}
		// Remote occupants rarely disclose a real JID; synthesize a stable per-nick JID
		const syntheticJid = `${fromNick}#${roomJid}`;
		const author = await createOrUpdateXMPPUser({ jid: syntheticJid, name: fromNick });
		await this.saveFederatedMessage(room._id, author._id, domainOfJid(roomJid), body, stanzaId);
	}

	private async saveFederatedMessage(rid: string, fromId: string, originDomain: string, body: string, stanzaId?: string): Promise<void> {
		const eventId = `xmpp:${originDomain}:${stanzaId ?? Random.id()}`;
		if (await Messages.findOneByFederationId(eventId)) {
			return;
		}
		await Message.saveMessageFromFederation({ fromId, rid, federation_event_id: eventId, msg: body, ts: new Date() });
	}

	/** Materializes a remote MUC as a shadow room and joins it on behalf of the invited local user. */
	private async onMucInvite(event: { roomJid: string; toLocalJid: string; fromJid: string }): Promise<void> {
		if (!this.server) {
			return;
		}
		const localUsername = toBareJid(event.toLocalJid).split('@')[0];
		const localUser = await Users.findOneByUsername(localUsername, { projection: { _id: 1, username: 1 } });
		if (!localUser) {
			return;
		}

		await createOrUpdateXMPPUser({ jid: toBareJid(event.fromJid) });

		let room = await Rooms.findOne({ 'xmppFederation.muc': event.roomJid }, { projection: { _id: 1, xmppFederation: 1 } });
		if (!room) {
			const roomName = event.roomJid.split('@')[0];
			const created = await Room.create(localUser._id, {
				type: 'c',
				name: `xmpp_${roomName}`,
				members: [localUser.username as string],
				extraData: {
					xmppFederation: { version: 1, role: 'remote-muc', muc: event.roomJid, origin: domainOfJid(event.roomJid) },
				},
			});
			room = await Rooms.findOneById(created._id, { projection: { _id: 1, xmppFederation: 1 } });
		}

		if (room) {
			await this.joinRemoteMUC(localUser._id, room._id);
		}
	}

	private async broadcastLocalPresence(user: Pick<IUser, '_id' | 'username' | 'status'>): Promise<void> {
		if (!this.server || !user.username) {
			return;
		}
		const from = `${user.username}@${this.server.domain}`;
		const { availability, show } = mapStatusToPresence(user.status);

		const rooms = await Rooms.find({ 'xmppFederation.role': 'dm', 'uids': user._id }, { projection: { xmppFederation: 1 } }).toArray();

		for (const room of rooms) {
			const to = room.xmppFederation?.with;
			if (to) {
				await this.server.sendPresence({ from, to, availability, show }).catch(() => undefined);
			}
		}
	}

	private async onIncomingPresence(event: IncomingPresence): Promise<void> {
		if (!this.presenceEnabled) {
			return;
		}
		const remoteJid = toBareJid(event.from);
		const user = await Users.findOneByUsername(remoteJid, { projection: { _id: 1, username: 1, statusText: 1, roles: 1, name: 1 } });
		if (!user || !isUserXMPPFederated(user)) {
			return;
		}

		const status = mapPresenceToStatus(event);
		await Users.updateOne({ _id: user._id }, { $set: { status, statusDefault: status } });

		void api.broadcast('presence.status', {
			user: { ...user, status },
			previousStatus: undefined,
		});
	}

	private async onSubscriptionRequest(event: { from: string; to: string }): Promise<void> {
		if (!this.server) {
			return;
		}
		const localUsername = toBareJid(event.to).split('@')[0];
		const remoteJid = toBareJid(event.from);

		const localUser = await Users.findOneByUsername(localUsername, { projection: { _id: 1 } });
		const remoteUser = localUser && (await Users.findOneByUsername(remoteJid, { projection: { _id: 1 } }));
		const sharesDm =
			localUser &&
			remoteUser &&
			(await Rooms.findOne(
				{ 'xmppFederation.role': 'dm', 'xmppFederation.with': remoteJid, 'uids': localUser._id },
				{ projection: { _id: 1 } },
			));

		if (sharesDm) {
			await this.server.sendSubscription({ from: event.to, to: event.from, type: 'subscribed' });
			await this.server.sendSubscription({ from: event.to, to: event.from, type: 'subscribe' });
		} else {
			await this.server.sendSubscription({ from: event.to, to: event.from, type: 'unsubscribed' });
		}
	}

	private fingerprintOf(config: XMPPServerConfiguration): ListenerFingerprint {
		return [config.domain, config.port, config.mucSubdomain, config.tlsCert, config.tlsKey].join(' ');
	}
}
