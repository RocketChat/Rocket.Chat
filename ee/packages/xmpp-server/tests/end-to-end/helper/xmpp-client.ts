import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import { client, xml } from '@xmpp/client';
import type { Client } from '@xmpp/client';

import type { Cleanup } from './cleanup';
import { config, uniqueSuffix } from './config';

export type Stanza = ReturnType<typeof xml>;

export type Predicate = (stanza: Stanza) => boolean;

export const NS = {
	register: 'jabber:iq:register',
	ping: 'urn:xmpp:ping',
	discoInfo: 'http://jabber.org/protocol/disco#info',
	discoItems: 'http://jabber.org/protocol/disco#items',
	muc: 'http://jabber.org/protocol/muc',
	mucUser: 'http://jabber.org/protocol/muc#user',
	mucOwner: 'http://jabber.org/protocol/muc#owner',
	mucAdmin: 'http://jabber.org/protocol/muc#admin',
	dataForms: 'jabber:x:data',
	stanzas: 'urn:ietf:params:xml:ns:xmpp-stanzas',
	correction: 'urn:xmpp:message-correct:0',
	stanzaId: 'urn:xmpp:sid:0',
} as const;

export const bare = (jid = ''): string => jid.split('/')[0].toLowerCase();

const DEFAULT_TIMEOUT_MS = 15_000;

type Waiter = { predicate: Predicate; after: number; resolve: (stanza: Stanza) => void };

/**
 * A real account on the XMPP server under test, registered in-band (XEP-0077) for one suite.
 * Every inbound stanza is recorded from login onward, so a wait never misses one that arrived
 * before it started.
 */
export class XmppUser {
	readonly username: string;

	/** Bare JID. */
	readonly jid: string;

	private readonly xmpp: Client;

	private readonly inbox: Stanza[] = [];

	private readonly waiters = new Set<Waiter>();

	private constructor(username: string, xmpp: Client) {
		this.username = username;
		this.jid = `${username}@${config.xmpp.domain}`;
		this.xmpp = xmpp;
		xmpp.on('stanza', (stanza) => this.record(stanza));
	}

	/** Registers a fresh account, logs in, and queues its removal on cleanup. */
	static async register(label: string, cleanup: Cleanup): Promise<XmppUser> {
		const username = `xe2e-${label}-${uniqueSuffix()}`;
		const password = crypto.randomBytes(12).toString('hex');

		const xmpp: Client = client({
			service: config.xmpp.service,
			domain: config.xmpp.domain,
			resource: 'e2e',
			// Runs after STARTTLS and before SASL, which is where XEP-0077 registration belongs
			credentials: async (authenticate, mechanisms) => {
				await xmpp.iqCaller.set(xml('query', { xmlns: NS.register }, xml('username', {}, username), xml('password', {}, password)));
				await authenticate({ username, password }, mechanisms[0], xml('user-agent', { id: crypto.randomUUID() }));
			},
		});
		// A dropped connection must fail the test that caused it, not heal silently behind it
		xmpp.reconnect.stop();
		// Roster pushes (RFC 6121 §2.1.6) must be acknowledged; the suite never reads the roster
		xmpp.iqCallee.set('jabber:iq:roster', 'query', () => true);
		xmpp.on('error', (error) => {
			if (!/User removed/.test(error.message)) {
				console.warn(`[xmpp ${username}]`, error.message);
			}
		});

		const user = new XmppUser(username, xmpp);
		await xmpp.start();
		await xmpp.send(xml('presence'));
		cleanup.add(() => user.unregister());
		return user;
	}

	/** Position in the inbox; pass it as `after` to only match stanzas that arrive later. */
	cursor(): number {
		return this.inbox.length;
	}

	received(predicate: Predicate, after = 0): Stanza[] {
		return this.inbox.slice(after).filter(predicate);
	}

	waitFor(predicate: Predicate, description: string, { after = 0, timeoutMs = DEFAULT_TIMEOUT_MS } = {}): Promise<Stanza> {
		const [found] = this.received(predicate, after);
		if (found) {
			return Promise.resolve(found);
		}
		return new Promise((resolve, reject) => {
			const waiter: Waiter = {
				predicate,
				after,
				resolve: (stanza) => {
					clearTimeout(timer);
					this.waiters.delete(waiter);
					resolve(stanza);
				},
			};
			const timer = setTimeout(() => {
				this.waiters.delete(waiter);
				reject(new Error(`${this.username} timed out after ${timeoutMs}ms waiting for ${description}`));
			}, timeoutMs);
			this.waiters.add(waiter);
		});
	}

	/** Waits for a match, then for late duplicates, and asserts exactly one arrived. */
	async expectOnce(predicate: Predicate, description: string, { after = 0, settleMs = 3000 } = {}): Promise<Stanza> {
		const first = await this.waitFor(predicate, description, { after });
		await sleep(settleMs);
		const matches = this.received(predicate, after);
		assert.equal(
			matches.length,
			1,
			`${this.username} expected ${description} once, got ${matches.length}:\n${matches.map(String).join('\n')}`,
		);
		return first;
	}

	/** Asserts nothing matching arrives within the window. */
	async expectNone(predicate: Predicate, description: string, { after = 0, windowMs = 3000 } = {}): Promise<void> {
		await sleep(windowMs);
		const matches = this.received(predicate, after);
		assert.equal(matches.length, 0, `${this.username} unexpectedly received ${description}: ${matches.map(String).join('\n')}`);
	}

	send(stanza: Stanza): Promise<void> {
		return this.xmpp.send(stanza);
	}

	/** Sends an IQ and resolves with the result; an `error` response rejects with the stanza error condition. */
	iq(type: 'get' | 'set', to: string, child: Stanza, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Stanza> {
		return this.xmpp.iqCaller.request(xml('iq', { type, to }, child), timeoutMs);
	}

	ping(to: string): Promise<Stanza> {
		return this.iq('get', to, xml('ping', { xmlns: NS.ping }));
	}

	discoInfo(to: string): Promise<Stanza> {
		return this.iq('get', to, xml('query', { xmlns: NS.discoInfo }));
	}

	discoItems(to: string): Promise<Stanza> {
		return this.iq('get', to, xml('query', { xmlns: NS.discoItems }));
	}

	sendChat(to: string, body: string, { id = crypto.randomUUID() }: { id?: string | null } = {}): Promise<void> {
		return this.send(xml('message', { to, type: 'chat', id: id ?? undefined }, xml('body', {}, body)));
	}

	sendPresence({ to, type, show }: { to?: string; type?: string; show?: string } = {}): Promise<void> {
		return this.send(xml('presence', { to, type }, ...(show ? [xml('show', {}, show)] : [])));
	}

	/** Creates a room on the XMPP server's MUC service, owned by this user, and returns its JID. */
	async createRoom(localpart: string, { membersOnly = true, archive = true } = {}): Promise<string> {
		const roomJid = `${localpart}@${config.xmpp.mucDomain}`;
		const after = this.cursor();
		await this.send(xml('presence', { to: `${roomJid}/${this.username}` }, xml('x', { xmlns: NS.muc })));
		await this.waitFor(isMucSelfPresence(roomJid), `self-presence in new room ${roomJid}`, { after });

		const field = (name: string, value: string) => xml('field', { var: name }, xml('value', {}, value));
		await this.iq(
			'set',
			roomJid,
			xml(
				'query',
				{ xmlns: NS.mucOwner },
				xml(
					'x',
					{ xmlns: NS.dataForms, type: 'submit' },
					field('FORM_TYPE', 'http://jabber.org/protocol/muc#roomconfig'),
					field('muc#roomconfig_membersonly', membersOnly ? '1' : '0'),
					field('muc#roomconfig_publicroom', membersOnly ? '0' : '1'),
					// ejabberd's name for XEP-0313 room archiving, which also makes the room stamp XEP-0359 stanza ids
					field('mam', archive ? '1' : '0'),
				),
			),
		);
		return roomJid;
	}

	async destroyRoom(roomJid: string): Promise<void> {
		await this.iq('set', roomJid, xml('query', { xmlns: NS.mucOwner }, xml('destroy')));
	}

	/** Joins a room and resolves with the self-presence; a refused join rejects with the error condition. */
	async joinRoom(roomJid: string, nick = this.username): Promise<Stanza> {
		const after = this.cursor();
		await this.send(xml('presence', { to: `${roomJid}/${nick}` }, xml('x', { xmlns: NS.muc })));
		const reply = await this.waitFor(
			(stanza) => isMucSelfPresence(roomJid)(stanza) || (isPresenceFrom(`${roomJid}/${nick}`)(stanza) && stanza.attrs.type === 'error'),
			`join result for ${roomJid}`,
			{ after },
		);
		if (reply.attrs.type === 'error') {
			throw new StanzaError(reply);
		}
		return reply;
	}

	leaveRoom(roomJid: string, nick = this.username): Promise<void> {
		return this.send(xml('presence', { to: `${roomJid}/${nick}`, type: 'unavailable' }));
	}

	/** Adds a JID to a members-only room's member list, which a join from it requires. */
	async grantMembership(roomJid: string, jid: string): Promise<void> {
		await this.iq('set', roomJid, xml('query', { xmlns: NS.mucAdmin }, xml('item', { affiliation: 'member', jid })));
	}

	/** Mediated invitation (XEP-0045 §7.8.2): the room relays it to the invitee. */
	invite(roomJid: string, inviteeJid: string): Promise<void> {
		return this.send(xml('message', { to: roomJid }, xml('x', { xmlns: NS.mucUser }, xml('invite', { to: inviteeJid }))));
	}

	sendGroupchat(roomJid: string, body: string, { id = crypto.randomUUID() }: { id?: string | null } = {}): Promise<void> {
		return this.send(xml('message', { to: roomJid, type: 'groupchat', id: id ?? undefined }, xml('body', {}, body)));
	}

	/** Removes the account; the server then closes the stream, so this never calls stop(). */
	async unregister(): Promise<void> {
		if (this.xmpp.status !== 'online') {
			return;
		}
		const closed = new Promise<void>((resolve) => this.xmpp.once('disconnect', resolve));
		await this.xmpp.iqCaller.set(xml('query', { xmlns: NS.register }, xml('remove'))).catch(() => undefined);
		await Promise.race([closed, sleep(5000)]);
	}

	private record(stanza: Stanza): void {
		this.inbox.push(stanza);
		const index = this.inbox.length - 1;
		for (const waiter of this.waiters) {
			if (index >= waiter.after && waiter.predicate(stanza)) {
				waiter.resolve(stanza);
			}
		}
	}
}

export class StanzaError extends Error {
	readonly condition: string | undefined;

	readonly stanza: Stanza;

	constructor(stanza: Stanza) {
		const condition = stanza.getChild('error')?.children.find((child): child is Stanza => typeof child !== 'string')?.name;
		super(`stanza error: ${condition ?? 'unknown'}`);
		this.condition = condition;
		this.stanza = stanza;
	}
}

// --- Predicates ---

const matchesJid = (actual: string | undefined, expected: string): boolean =>
	expected.includes('/') ? actual?.toLowerCase() === expected.toLowerCase() : bare(actual) === bare(expected);

export const isPresenceFrom =
	(from: string): Predicate =>
	(stanza) =>
		stanza.name === 'presence' && matchesJid(stanza.attrs.from, from);

export const statusCodes = (stanza: Stanza): string[] =>
	stanza
		.getChild('x', NS.mucUser)
		?.getChildren('status')
		.map((status) => status.attrs.code as string) ?? [];

/** A room's presence for our own occupant (status 110), which completes a join. */
export const isMucSelfPresence =
	(roomJid: string): Predicate =>
	(stanza) =>
		stanza.name === 'presence' &&
		bare(stanza.attrs.from) === bare(roomJid) &&
		stanza.attrs.type !== 'error' &&
		statusCodes(stanza).includes('110');

export const isOccupantPresence =
	(roomJid: string, nick: string, { type }: { type?: 'unavailable' } = {}): Predicate =>
	(stanza) =>
		isPresenceFrom(`${roomJid}/${nick}`)(stanza) && stanza.attrs.type === type;

export const isChat =
	({ from, body }: { from: string; body?: string }): Predicate =>
	(stanza) =>
		stanza.name === 'message' &&
		stanza.attrs.type !== 'groupchat' &&
		stanza.attrs.type !== 'error' &&
		matchesJid(stanza.attrs.from, from) &&
		(body === undefined || stanza.getChildText('body') === body);

export const isGroupchat =
	({ roomJid, nick, body }: { roomJid: string; nick?: string; body?: string }): Predicate =>
	(stanza) =>
		stanza.name === 'message' &&
		stanza.attrs.type === 'groupchat' &&
		bare(stanza.attrs.from) === bare(roomJid) &&
		(nick === undefined || stanza.attrs.from?.split('/')[1] === nick) &&
		(body === undefined || stanza.getChildText('body') === body);

/** A mediated (XEP-0045) or direct (XEP-0249) invitation into the given room. */
export const isRoomInvite =
	(roomJid: string): Predicate =>
	(stanza) =>
		stanza.name === 'message' &&
		((bare(stanza.attrs.from) === bare(roomJid) && stanza.getChild('x', NS.mucUser)?.getChild('invite') !== undefined) ||
			bare(stanza.getChild('x', 'jabber:x:conference')?.attrs.jid) === bare(roomJid));
