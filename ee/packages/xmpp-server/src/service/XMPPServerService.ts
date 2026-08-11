import { api, Message, Room, ServiceClass } from '@rocket.chat/core-services';
import type { IXMPPServerService, XMPPServerConfiguration } from '@rocket.chat/core-services';
import { isRoomXMPPFederated, isRoomXMPPHostedMuc, isRoomXMPPRemoteMuc, isUserXMPPFederated } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { XMPPServer } from '../XMPPServer';
import type { MucJoinDecision, XMPPServerConfig } from '../config';
import type { IncomingChatMessage, IncomingPresence } from '../events';
import { normalizeDomain } from '../jid/normalize';
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

/** Everything the hosted-MUC helpers need from a room document. */
const HOSTED_ROOM_PROJECTION = { _id: 1, t: 1, u: 1, topic: 1, xmppFederation: 1 } as const;

/** The room JID's localpart is the MUC room id used by the protocol core. */
const mucLocalpart = (mucJid: string): string => mucJid.split('@')[0];

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

		// MUC state in the core is ephemeral and must be rebuilt from the database on every start.
		// A failure here degrades group chat but must not take the listener down with it.
		await this.restoreMucState().catch((error) => this.logger.error({ msg: 'Failed to restore MUC state', err: error }));
	}

	private async restoreMucState(): Promise<void> {
		await this.registerHostedRooms();
		await this.joinRemoteMucRooms();
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
					// Sessions are per user and never survive a restart; join before speaking
					await this.joinRemoteMUC(user._id, room._id);
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
		this.registerHostedRoomWithCore(room);
	}

	/** Invites a remote XMPP user into a room we host, on behalf of a local member. */
	async inviteToHostedRoom(rid: string, inviterId: string, jid: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [room, inviter] = await Promise.all([
			Rooms.findOneById(rid, { projection: HOSTED_ROOM_PROJECTION }),
			Users.findOneById(inviterId, { projection: { username: 1 } }),
		]);
		if (!room || !isRoomXMPPHostedMuc(room) || !inviter?.username) {
			return;
		}

		// A room created before this server started is not in the (ephemeral) core registry yet
		this.registerHostedRoomWithCore(room);
		this.server.mucInvite({
			roomId: mucLocalpart(room.xmppFederation.muc),
			inviteeJid: toBareJid(jid),
			inviterJid: `${inviter.username}@${this.server.domain}`,
		});
		this.logger.debug({ msg: 'Sent MUC invite', room: room.xmppFederation.muc, to: jid });
	}

	/** Registers a local member as a virtual occupant so remote clients see them in the roster. */
	async addHostedRoomMember(rid: string, userId: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [room, user] = await Promise.all([
			Rooms.findOneById(rid, { projection: HOSTED_ROOM_PROJECTION }),
			Users.findOneById(userId, { projection: { username: 1, federated: 1, xmppFederation: 1 } }),
		]);
		if (!room || !isRoomXMPPHostedMuc(room) || !user?.username || isUserXMPPFederated(user)) {
			return;
		}

		this.registerHostedRoomWithCore(room);
		this.server.mucAddLocalOccupant({
			roomId: mucLocalpart(room.xmppFederation.muc),
			localJid: `${user.username}@${this.server.domain}`,
			nick: user.username,
			role: room.u?._id === user._id ? 'moderator' : 'participant',
		});
	}

	async removeHostedRoomMember(rid: string, userId: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [room, user] = await Promise.all([
			Rooms.findOneById(rid, { projection: HOSTED_ROOM_PROJECTION }),
			Users.findOneById(userId, { projection: { username: 1, federated: 1, xmppFederation: 1 } }),
		]);
		if (!room || !isRoomXMPPHostedMuc(room) || !user?.username) {
			return;
		}

		const roomId = mucLocalpart(room.xmppFederation.muc);
		if (isUserXMPPFederated(user)) {
			this.server.mucKickOccupantByJid({ roomId, bareJid: user.username });
			return;
		}
		this.server.mucRemoveLocalOccupant({ roomId, nick: user.username });
	}

	private registerHostedRoomWithCore(room: Pick<IRoom, 't' | 'topic' | 'xmppFederation'>): void {
		if (!this.server || !isRoomXMPPHostedMuc(room)) {
			return;
		}
		this.server.mucCreateRoom({
			roomId: mucLocalpart(room.xmppFederation.muc),
			public: room.t === 'c',
			subject: room.topic ?? '',
		});
	}

	/** MUC state in the core is ephemeral: rebuild the hosted-room registry from the database. */
	private async registerHostedRooms(): Promise<void> {
		const rooms = await Rooms.find({ 'xmppFederation.role': 'host-muc' }, { projection: HOSTED_ROOM_PROJECTION }).toArray();
		for (const room of rooms) {
			this.registerHostedRoomWithCore(room);
			await this.registerLocalOccupants(room);
		}
		if (rooms.length) {
			this.logger.debug(`Registered ${rooms.length} hosted MUC room(s)`);
		}
	}

	/** Re-publishes the room's local members as virtual occupants after a restart. */
	private async registerLocalOccupants(room: Pick<IRoom, '_id' | 't' | 'u' | 'xmppFederation'>): Promise<void> {
		if (!this.server || !isRoomXMPPHostedMuc(room)) {
			return;
		}
		const roomId = mucLocalpart(room.xmppFederation.muc);
		const subscriptions = await Subscriptions.findByRoomId(room._id, { projection: { 'u._id': 1, 'u.username': 1 } }).toArray();

		for (const { u } of subscriptions) {
			// Remote occupants join by themselves; only Rocket.Chat members are virtual
			if (!u.username || u.username.includes('@')) {
				continue;
			}
			this.server.mucAddLocalOccupant({
				roomId,
				localJid: `${u.username}@${this.server.domain}`,
				nick: u.username,
				role: room.u?._id === u._id ? 'moderator' : 'participant',
			});
		}
	}

	/** Joins a remote MUC on behalf of a local user. Idempotent: an existing session is reused. */
	async joinRemoteMUC(userId: string, rid: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [user, room] = await Promise.all([
			Users.findOneById(userId, { projection: { username: 1, federated: 1, xmppFederation: 1 } }),
			Rooms.findOneById(rid, { projection: { xmppFederation: 1 } }),
		]);
		if (!user?.username || isUserXMPPFederated(user) || !room || !isRoomXMPPRemoteMuc(room)) {
			return;
		}
		await this.server.mucJoinRemoteRoom({
			localJid: `${user.username}@${this.server.domain}`,
			roomJid: room.xmppFederation.muc,
			nick: user.username,
		});
	}

	async leaveRemoteMUC(userId: string, rid: string): Promise<void> {
		if (!this.server) {
			return;
		}
		const [user, room] = await Promise.all([
			Users.findOneById(userId, { projection: { username: 1 } }),
			Rooms.findOneById(rid, { projection: { xmppFederation: 1 } }),
		]);
		if (!user?.username || !room || !isRoomXMPPRemoteMuc(room)) {
			return;
		}
		await this.server.mucLeaveRemoteRoom({
			localJid: `${user.username}@${this.server.domain}`,
			roomJid: room.xmppFederation.muc,
		});
	}

	/**
	 * Remote-MUC sessions are ephemeral client sessions, one per local member: without
	 * this every member would go silent after a restart, and only the invitee could ever talk.
	 */
	private async joinRemoteMucRooms(): Promise<void> {
		const rooms = await Rooms.find({ 'xmppFederation.role': 'remote-muc' }, { projection: { _id: 1, xmppFederation: 1 } }).toArray();

		for (const room of rooms) {
			if (!isRoomXMPPRemoteMuc(room)) {
				continue;
			}
			const subscriptions = await Subscriptions.findByRoomId(room._id, { projection: { 'u._id': 1 } }).toArray();
			for (const { u } of subscriptions) {
				await this.joinRemoteMUC(u._id, room._id).catch((err) =>
					this.logger.warn({ msg: 'Failed to rejoin remote MUC', room: room.xmppFederation.muc, user: u._id, err }),
				);
			}
		}
		if (rooms.length) {
			this.logger.debug(`Rejoined ${rooms.length} remote MUC room(s)`);
		}
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
			delegates: {
				authorizeMucJoin: (params) =>
					this.authorizeMucJoin(normalizeDomain(`${config.mucSubdomain || 'conference'}.${config.domain}`), params),
			},
			logger: toCoreLogger(this.logger),
		};
	}

	/**
	 * Hosted-room join policy: public channels are open to any federated domain,
	 * private groups only to remote users who already hold a subscription (i.e. were invited).
	 */
	private async authorizeMucJoin(mucDomain: string, params: { roomId: string; occupantJid: string }): Promise<MucJoinDecision> {
		const mucJid = `${params.roomId}@${mucDomain}`;
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid }, { projection: { _id: 1, t: 1 } });
		if (!room) {
			this.logger.warn({ msg: 'MUC join refused: no room hosts this JID', muc: mucJid, from: params.occupantJid });
			return { allow: false, reason: 'forbidden' };
		}
		if (room.t === 'c') {
			return { allow: true };
		}

		const user = await Users.findOneByUsername(toBareJid(params.occupantJid), { projection: { _id: 1 } });
		const subscription = user && (await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { _id: 1 } }));
		if (!subscription) {
			this.logger.warn({ msg: 'MUC join refused: not a member of this private room', muc: mucJid, from: params.occupantJid });
			return { allow: false, reason: 'members-only' };
		}
		return { allow: true };
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

		server.on('muc.occupantJoined', (event) => {
			this.onHostedOccupantJoined(`${event.roomId}@${server.mucDomain}`, event.jid).catch((err) =>
				this.logger.error({ msg: 'Failed to handle hosted MUC join', err }),
			);
		});

		// A kick is the echo of a Rocket.Chat removal — only a voluntary leave has to be mirrored back.
		server.on('muc.occupantLeft', (event) => {
			if (event.reason === 'kicked') {
				return;
			}
			this.onHostedOccupantLeft(`${event.roomId}@${server.mucDomain}`, event.jid).catch((err) =>
				this.logger.error({ msg: 'Failed to handle hosted MUC leave', err }),
			);
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

	/**
	 * A remote occupant joined a room we host: materialize them locally and give them a
	 * subscription so they show up in the members list. Invited users already have one.
	 */
	private async onHostedOccupantJoined(mucJid: string, occupantJid: string): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid });
		if (!room) {
			return;
		}

		const user = await createOrUpdateXMPPUser({ jid: toBareJid(occupantJid) });
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { _id: 1 } });
		if (subscription) {
			return;
		}

		// Bypasses addUserToRoom on purpose: this is the echo of a join that already happened
		await Room.createUserSubscription({ room, ts: new Date(), userToBeAdded: user });
	}

	private async onHostedOccupantLeft(mucJid: string, occupantJid: string): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid });
		const user = room && (await Users.findOneByUsername(toBareJid(occupantJid)));
		if (!room || !user) {
			return;
		}
		// performUserRemoval runs no callbacks, so the removal does not bounce back as a kick
		await Room.performUserRemoval(room, user);
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

		// Messages we relayed carry their Rocket.Chat message id and come back reflected to every
		// local member's session — under a nick only the author's own session would recognize.
		if (stanzaId && (await Messages.findOneById(stanzaId, { projection: { _id: 1 } }))) {
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
