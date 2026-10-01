import { api, License, Message, Room, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IXMPPServerService } from '@rocket.chat/core-services';
import {
	isEditedMessage,
	isRoomXMPPFederated,
	isRoomXMPPHostedMuc,
	isRoomXMPPRemoteMuc,
	isUserXMPPFederated,
} from '@rocket.chat/core-typings';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { XMPPServer } from '../XMPPServer';
import type { MucJoinDecision, XMPPServerConfig } from '../config';
import type { IncomingChatMessage, IncomingPresence, XMPPServerEventMap } from '../events';
import type { XMPPServerConfiguration } from './configuration';
import { normalizeDomain } from '../jid/normalize';
import type { Logger as CoreLogger } from '../logger';
import { isXMPPSettingKey, readXMPPServerConfiguration } from './configuration';
import { domainOfJid, toBareJid } from './helpers/jid';
import { deriveInboundMessageId } from './helpers/messageId';
import type { InboundMessageKey } from './helpers/messageId';
import { mapPresenceToStatus, mapStatusToPresence } from './helpers/presence';
import { mirroredRoomDisplayName, mirroredRoomName } from './helpers/remoteRoom';
import { createOrUpdateXMPPUser } from './helpers/xmppUser';
import type { XmppDnsResolver } from '../s2s/dnsResolver';

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

/** A message from the wire, in whichever kind of room it arrived. */
type InboundMessage = {
	rid: string;
	author: IUser;
	/** Identifies the author for corrections; see `deriveInboundMessageId`. */
	authorKey: string;
	/** Scopes the event id: the sender's domain, or the room's for a remote room. */
	originDomain: string;
	body: string;
	/** Deduplicates copies: the room-assigned id when there is one, otherwise the sender's. */
	stanzaId?: string;
	senderId?: string;
	replaceId?: string;
};

const INBOUND_EVENTS = [
	'connection.established',
	'connection.lost',
	'connection.failed',
	'error',
	'message.received',
	'message.error',
	'presence.received',
	'presence.subscriptionRequest',
	'presence.subscribed',
	'presence.unsubscribed',
	'presence.probe',
	'muc.occupantJoined',
	'muc.occupantLeft',
	'muc.messageReceived',
	'muc.subjectChanged',
	'muc.inviteReceived',
	'muc.remoteJoined',
	'muc.remoteJoinFailed',
	'muc.remoteOccupantJoined',
	'muc.remoteOccupantLeft',
	'muc.remoteMessage',
	'muc.remoteSessionLost',
] as const satisfies readonly (keyof XMPPServerEventMap)[];

/** Called when an inbound event starts being handled; the returned callback is called once it settles. */
export type InboundHandlerObserver = (event: keyof XMPPServerEventMap) => (outcome: 'ok' | 'error') => void;

export type XMPPServerServiceOptions = {
	/** When false, inbound traffic is decoded and counted but never reaches Rocket.Chat. Default true. */
	forwardToRocketChat?: boolean;
	/** Lets the host measure how far Rocket.Chat-side handling lags behind what arrives on the wire. */
	observeHandler?: InboundHandlerObserver;
	/** Replaces DNS resolution of remote domains, e.g. to point load-test peers at local ports. */
	resolver?: XmppDnsResolver;
};

export class XMPPServerService extends ServiceClass implements IXMPPServerService {
	protected name = 'xmpp-server';

	private readonly logger = new Logger('XMPPServer');

	private readonly forwardToRocketChat: boolean;

	private readonly observeHandler: InboundHandlerObserver | undefined;

	private readonly resolver: XmppDnsResolver | undefined;

	private readonly inboundEventCounts = new Map<string, number>(INBOUND_EVENTS.map((type) => [type, 0]));

	/** Event ids of inbound messages whose storage is under way. */
	private readonly eventIdsBeingSaved = new Set<string>();

	private server: XMPPServer | undefined;

	private fingerprint: ListenerFingerprint | undefined;

	private presenceEnabled = false;

	private messageIdSecret = '';

	private reconfiguring: Promise<void> = Promise.resolve();

	constructor({ forwardToRocketChat = true, observeHandler, resolver }: XMPPServerServiceOptions = {}) {
		super();
		this.forwardToRocketChat = forwardToRocketChat;
		this.observeHandler = observeHandler;
		this.resolver = resolver;
	}

	override async created(): Promise<void> {
		// Outbound presence: fan a local user's status out to the remote domains they share a DM with.
		this.onEvent('presence.status', async ({ user }): Promise<void> => {
			if (!this.server || !this.presenceEnabled || !user.username || isUserXMPPFederated(user)) {
				return;
			}
			await this.broadcastLocalPresence(user);
		});

		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (isXMPPSettingKey(setting._id)) {
				await this.reconfigure();
			}
		});

		this.onEvent('license.module', async ({ module }): Promise<void> => {
			if (module === 'federation') {
				await this.reconfigure();
			}
		});
	}

	override async started(): Promise<void> {
		await this.reconfigure();
	}

	override async stopped(): Promise<void> {
		await this.stopServer();
	}

	isRunning(): boolean {
		return this.server?.isRunning ?? false;
	}

	/** Totals of events decoded by the protocol core since the service was created. */
	getInboundEventCounts(): Record<string, number> {
		return Object.fromEntries(this.inboundEventCounts);
	}

	/** Brings the listener in line with the current settings and license; runs one at a time so a burst of changes cannot race two listeners onto the port. */
	private reconfigure(): Promise<void> {
		this.reconfiguring = this.reconfiguring.then(async () => {
			try {
				const config = await readXMPPServerConfiguration((key) => Settings.get(key), await License.hasModule('federation'));
				await this.applyConfiguration(config);
			} catch (err) {
				this.logger.error({ msg: 'Failed to configure native XMPP server', err });
			}
		});
		return this.reconfiguring;
	}

	private async applyConfiguration(config: XMPPServerConfiguration): Promise<void> {
		if (!config.enabled || !config.domain) {
			await this.stopServer();
			return;
		}

		this.messageIdSecret = config.messageIdSecret;

		const fingerprint = this.fingerprintOf(config);

		// A running server whose listener-affecting settings are unchanged only needs a soft update
		if (this.server?.isRunning && this.fingerprint === fingerprint) {
			this.presenceEnabled = config.presenceEnabled;
			this.logger.debug('XMPP server configuration updated (no restart required)');
			return;
		}

		await this.stopServer();

		try {
			const server = new XMPPServer(this.toCoreConfig(config), { resolver: this.resolver });
			this.observeInboundEvents(server);
			if (this.forwardToRocketChat) {
				this.attachHandlers(server, config);
			} else {
				this.logger.warn('XMPP server running in decode-only mode: inbound traffic will not reach Rocket.Chat');
			}
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

	private async stopServer(): Promise<void> {
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
		// XEP-0308 corrections carry an id of their own and always point back at the original message
		const stanza = isEditedMessage(message) ? { id: Random.id(), replaceId: message._id } : { id: message._id };

		switch (role) {
			case 'dm':
				if (dmJid) {
					await this.server.sendChatMessage({
						from: `${user.username}@${this.server.domain}`,
						to: dmJid,
						body: message.msg,
						...stanza,
					});
				}
				break;
			case 'host-muc':
				if (muc) {
					this.server.mucBroadcastMessage({ roomId: muc.split('@')[0], fromNick: user.username, body: message.msg, ...stanza });
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
						...stanza,
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
			// History catches up on messages missed while offline; decode-only mode has nowhere to store them
			...(!this.forwardToRocketChat && { maxHistoryStanzas: 0 }),
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

		await this.receiveMessage({
			rid,
			author: remoteUser,
			authorKey: remoteJid,
			originDomain: domainOfJid(remoteJid),
			body: event.body,
			stanzaId: event.id,
			senderId: event.id,
			replaceId: event.replaceId,
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
			// Without the delegate the core admits every join, keeping decode-only mode off the database
			...(this.forwardToRocketChat && {
				delegates: {
					authorizeMucJoin: (params) =>
						this.authorizeMucJoin(normalizeDomain(`${config.mucSubdomain || 'conference'}.${config.domain}`), params),
				},
			}),
			logger: toCoreLogger(this.logger),
		};
	}

	/** Counts every inbound event for `/stats` and, at debug level, logs it with the stanza that produced it. */
	private observeInboundEvents(server: XMPPServer): void {
		for (const type of INBOUND_EVENTS) {
			server.on(type, () => {
				this.inboundEventCounts.set(type, (this.inboundEventCounts.get(type) ?? 0) + 1);
				// Serializing stanzas is too costly to pay for when the line would be discarded anyway
				this.logger.debug({ msg: 'XMPP event', event: type });
			});
		}
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
			this.track('message.received', this.onIncomingMessage(event), 'Failed to handle inbound XMPP message');
		});

		server.on('presence.received', (event) => {
			this.track('presence.received', this.onIncomingPresence(event), 'Failed to handle inbound XMPP presence');
		});

		// v1 policy: auto-accept a subscription request only from someone we already share a DM with.
		server.on('presence.subscriptionRequest', (event) => {
			this.track('presence.subscriptionRequest', this.onSubscriptionRequest(event), 'Failed to handle XMPP subscription request');
		});

		server.on('muc.occupantJoined', (event) => {
			this.track(
				'muc.occupantJoined',
				this.onHostedOccupantJoined(`${event.roomId}@${server.mucDomain}`, event.jid, event.nick),
				'Failed to handle hosted MUC join',
			);
		});

		// A kick is the echo of a Rocket.Chat removal — only a voluntary leave has to be mirrored back.
		server.on('muc.occupantLeft', (event) => {
			if (event.reason === 'kicked') {
				return;
			}
			this.track(
				'muc.occupantLeft',
				this.onHostedOccupantLeft(`${event.roomId}@${server.mucDomain}`, event.jid),
				'Failed to handle hosted MUC leave',
			);
		});

		server.on('muc.messageReceived', (event) => {
			this.track(
				'muc.messageReceived',
				this.persistMucMessage(`${event.roomId}@${server.mucDomain}`, event),
				'Failed to persist hosted MUC message',
			);
		});

		server.on('muc.remoteMessage', (event) => {
			this.track('muc.remoteMessage', this.onRemoteMucMessage(event), 'Failed to persist remote MUC message');
		});

		server.on('muc.inviteReceived', (event) => {
			this.track('muc.inviteReceived', this.onMucInvite(event), 'Failed to handle MUC invite');
		});
	}

	/** Handlers run detached from the stanza that triggered them; failures are logged, never thrown back into the stream. */
	private track(event: keyof XMPPServerEventMap, handling: Promise<void>, failureMessage: string): void {
		const settle = this.observeHandler?.(event);
		handling.then(
			() => settle?.('ok'),
			(err) => {
				settle?.('error');
				this.logger.error({ msg: failureMessage, err });
			},
		);
	}

	/**
	 * A remote occupant joined a room we host: materialize them locally and give them a
	 * subscription so they show up in the members list. Invited users already have one.
	 */
	private async onHostedOccupantJoined(mucJid: string, occupantJid: string, nick: string): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid });
		if (!room) {
			return;
		}

		const user = await createOrUpdateXMPPUser({ jid: toBareJid(occupantJid), name: nick });
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
	private async persistMucMessage(
		mucJid: string,
		{ fromJid, fromNick, body, id, replaceId }: XMPPServerEventMap['muc.messageReceived'],
	): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': mucJid }, { projection: { _id: 1 } });
		if (!room) {
			return;
		}
		const authorJid = toBareJid(fromJid);
		const author = await createOrUpdateXMPPUser({ jid: authorJid, name: fromNick });
		await this.receiveMessage({
			rid: room._id,
			author,
			authorKey: authorJid,
			originDomain: domainOfJid(fromJid),
			body,
			stanzaId: id,
			senderId: id,
			replaceId,
		});
	}

	/** Persists a message received in a remote MUC we joined, authored by the occupant's own user record when the room says who they are. */
	private async onRemoteMucMessage({
		roomJid,
		fromNick,
		fromJid,
		body,
		id: stanzaId,
		originId,
		senderId,
		occupantId,
		replaceId,
	}: XMPPServerEventMap['muc.remoteMessage']): Promise<void> {
		const room = await Rooms.findOne({ 'xmppFederation.muc': roomJid }, { projection: { _id: 1 } });
		if (!room) {
			return;
		}

		// Our own relays come back to the other members' sessions, under a nick only the author's session recognizes
		const relayedId = replaceId ?? originId;
		if (relayedId && (await Messages.findOneById(relayedId, { projection: { _id: 1 } }))) {
			return;
		}
		// Without a real JID nothing ties the nick to the same person in another room
		const author = await createOrUpdateXMPPUser({ jid: fromJid ?? `${fromNick}#${roomJid}`, name: fromNick });
		await this.receiveMessage({
			rid: room._id,
			author,
			// XEP-0308 requires the same nick; the occupant id keeps a later holder of the nick from correcting
			authorKey: occupantId ? `${fromNick}\0${occupantId}` : fromNick,
			originDomain: domainOfJid(roomJid),
			body,
			stanzaId,
			senderId,
			replaceId,
		});
	}

	/** Stores an inbound message, or applies it to the one it corrects, once however many copies arrive and however close together. */
	private async receiveMessage(message: InboundMessage): Promise<void> {
		const eventId = `xmpp:${message.originDomain}:${message.stanzaId ?? Random.id()}`;
		if (this.eventIdsBeingSaved.has(eventId)) {
			return;
		}
		this.eventIdsBeingSaved.add(eventId);
		try {
			if (await Messages.findOneByFederationId(eventId)) {
				return;
			}
			if (message.replaceId && (await this.applyCorrection(message, message.replaceId))) {
				return;
			}
			await this.storeMessage(message, eventId);
		} finally {
			this.eventIdsBeingSaved.delete(eventId);
		}
	}

	/** Replaces the text of the message `replaceId` names; false when the author has no such message in the room. */
	private async applyCorrection({ rid, author, authorKey, body }: InboundMessage, replaceId: string): Promise<boolean> {
		const id = this.deriveMessageId({ rid, authorKey, senderId: replaceId });
		const original = id && (await Messages.findOneById(id));
		if (!original || original.rid !== rid || original.u._id !== author._id) {
			return false;
		}
		// Every member session of a remote room delivers its own copy of the correction
		if (original.msg !== body) {
			await Message.updateMessage({ ...original, msg: body }, author, original);
		}
		return true;
	}

	private async storeMessage({ rid, author, authorKey, body, senderId }: InboundMessage, eventId: string): Promise<void> {
		const id = senderId && this.deriveMessageId({ rid, authorKey, senderId });
		// A sender that reuses one of its ids keeps the first message reachable and stores the new one under a random id
		const isIdFree = id && !(await Messages.findOneById(id, { projection: { _id: 1 } }));
		await Message.saveMessageFromFederation({
			...(isIdFree && { _id: id }),
			fromId: author._id,
			rid,
			federation_event_id: eventId,
			msg: body,
			ts: new Date(),
		});
	}

	/** Nothing until the secret is loaded: an id derived without it could be predicted, and would stay that way. */
	private deriveMessageId(key: InboundMessageKey): string | undefined {
		return this.messageIdSecret ? deriveInboundMessageId(this.messageIdSecret, key) : undefined;
	}

	/** Makes the invited local user a member of the remote MUC's shadow room, creating it on first invite, and joins them into the MUC. */
	private async onMucInvite(event: { roomJid: string; toLocalJid: string; fromJid: string }): Promise<void> {
		if (!this.server) {
			return;
		}
		const localUsername = toBareJid(event.toLocalJid).split('@')[0];
		const localUser = await Users.findOneByUsername(localUsername, { projection: { _id: 1, username: 1 } });
		if (!localUser) {
			return;
		}

		const inviter = await createOrUpdateXMPPUser({ jid: toBareJid(event.fromJid) });

		let room = await Rooms.findOne({ 'xmppFederation.muc': event.roomJid }, { projection: { _id: 1, xmppFederation: 1 } });
		if (room) {
			await Room.addUserToRoom(room._id, localUser, inviter);
		} else {
			const created = await Room.create(localUser._id, {
				type: 'c',
				name: mirroredRoomName(event.roomJid),
				members: [localUser.username as string],
				extraData: {
					fname: mirroredRoomDisplayName(event.roomJid),
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
		return [config.domain, config.port, config.mucSubdomain, config.tlsCert, config.tlsKey].join('\0');
	}
}
