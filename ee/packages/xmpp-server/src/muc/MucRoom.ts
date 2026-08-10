import type Element from 'ltx/lib/Element';

import type { MucJoinDecision } from '../config';
import { buildGroupchatMessage, buildOccupantPresence, parseJoinPresence, splitOccupantJid } from './stanzas';
import type { MucRole } from './stanzas';
import { buildStanzaError } from '../xml/errors';

export type MucOccupant = {
	nick: string;
	/** Real JID of the occupant. */
	realJid: string;
	role: MucRole;
	/** Local (Rocket.Chat) occupants receive copies as events, not stanzas. */
	isLocal: boolean;
};

export type MucRoomEvents = {
	occupantJoined: (occupant: MucOccupant) => void;
	occupantLeft: (occupant: MucOccupant, reason: 'left' | 'kicked') => void;
	message: (params: { fromNick: string; fromJid: string; body: string; id?: string; raw: Element }) => void;
};

export type MucRoomDeps = {
	/** Full room JID: `<localpart>@<mucSubdomain>.<domain>`. */
	roomJid: string;
	send: (stanza: Element) => void;
	emit: <K extends keyof MucRoomEvents>(event: K, ...args: Parameters<MucRoomEvents[K]>) => void;
	authorizeJoin?: (params: { roomId: string; occupantJid: string; nick: string }) => Promise<MucJoinDecision>;
};

/**
 * Hosted MUC room state machine (XEP-0045 subset). Tracks occupants, resolves
 * nick conflicts, broadcasts presence and messages, and reflects groupchat
 * messages. Rocket.Chat members are registered as "local" virtual occupants:
 * visible in the roster, but their inbound copies are delivered via events.
 */
export class MucRoom {
	private readonly occupants = new Map<string, MucOccupant>();

	private created = false;

	constructor(private readonly deps: MucRoomDeps) {}

	get roomJid(): string {
		return this.deps.roomJid;
	}

	get roomId(): string {
		return this.deps.roomJid.split('@')[0];
	}

	listOccupants(): MucOccupant[] {
		return [...this.occupants.values()];
	}

	/** Registers a Rocket.Chat member as a virtual occupant (roster-visible, event-delivered). */
	addLocalOccupant(params: { nick: string; realJid: string; role?: MucRole }): void {
		const occupant: MucOccupant = { nick: params.nick, realJid: params.realJid, role: params.role ?? 'participant', isLocal: true };
		this.occupants.set(params.nick, occupant);
		this.broadcastPresence(occupant);
	}

	removeLocalOccupant(nick: string): void {
		const occupant = this.occupants.get(nick);
		if (occupant) {
			this.occupants.delete(nick);
			this.broadcastPresence(occupant, 'unavailable');
		}
	}

	async handleJoin(presence: Element): Promise<void> {
		const parsed = parseJoinPresence(presence);
		const realJid = presence.attrs.from;
		if (!parsed || !realJid) {
			return;
		}

		const existing = this.occupants.get(parsed.nick);
		if (existing && existing.realJid !== realJid) {
			// Nick already taken by a different JID → 409 conflict
			this.deps.send(buildStanzaError(presence, 'conflict', 'cancel'));
			return;
		}

		if (this.deps.authorizeJoin) {
			const decision = await this.deps.authorizeJoin({ roomId: this.roomId, occupantJid: realJid, nick: parsed.nick });
			if (!decision.allow) {
				this.deps.send(buildStanzaError(presence, decision.reason === 'banned' ? 'forbidden' : 'registration-required', 'auth'));
				return;
			}
		}

		const role: MucRole = this.deps.authorizeJoin ? 'participant' : 'participant';
		const occupant: MucOccupant = { nick: parsed.nick, realJid, role, isLocal: false };

		// Send the current roster to the newcomer, then announce the newcomer to everyone
		for (const other of this.occupants.values()) {
			this.deps.send(
				buildOccupantPresence({ roomJid: this.roomJid, nick: other.nick, to: realJid, realJid: other.realJid, role: other.role }),
			);
		}

		this.occupants.set(parsed.nick, occupant);
		this.broadcastPresence(occupant);

		// Self-presence with status 110 (self) and 201 when the room was just created
		const selfCodes = this.created ? [110] : [110, 201];
		this.created = true;
		this.deps.send(
			buildOccupantPresence({
				roomJid: this.roomJid,
				nick: occupant.nick,
				to: realJid,
				realJid,
				role: occupant.role,
				statusCodes: selfCodes,
			}),
		);

		this.deps.emit('occupantJoined', occupant);
	}

	handleLeave(presence: Element): void {
		const [, nick] = splitOccupantJid(presence.attrs.to ?? '');
		const occupant = nick && this.occupants.get(nick);
		if (!occupant || occupant.realJid !== presence.attrs.from) {
			return;
		}
		this.occupants.delete(occupant.nick);
		this.broadcastPresence(occupant, 'unavailable');
		this.deps.emit('occupantLeft', occupant, 'left');
	}

	handleGroupchatMessage(message: Element): void {
		// A participant addresses the room with their real JID as `from`; identify the occupant by it.
		const from = message.attrs.from ?? '';
		const body = message.getChildText('body');
		const occupant = [...this.occupants.values()].find((o) => o.realJid === from);
		if (!occupant || !body) {
			return;
		}

		this.broadcastMessage(occupant.nick, body, message.attrs.id);
		this.deps.emit('message', { fromNick: occupant.nick, fromJid: occupant.realJid, body, id: message.attrs.id, raw: message });
	}

	/** Broadcasts a message authored on the Rocket.Chat side into the room. */
	broadcastFromLocal(params: { fromNick: string; body: string; id?: string }): void {
		this.broadcastMessage(params.fromNick, params.body, params.id);
	}

	kick(nick: string, _reason?: string): void {
		const occupant = this.occupants.get(nick);
		if (!occupant) {
			return;
		}
		this.occupants.delete(nick);
		// Status 307: the occupant was kicked
		for (const recipient of this.remoteOccupants()) {
			this.deps.send(
				buildOccupantPresence({
					roomJid: this.roomJid,
					nick: occupant.nick,
					to: recipient.realJid,
					role: occupant.role,
					type: 'unavailable',
					statusCodes: [307],
				}),
			);
		}
		this.deps.emit('occupantLeft', occupant, 'kicked');
	}

	private broadcastPresence(occupant: MucOccupant, type?: 'unavailable'): void {
		for (const recipient of this.remoteOccupants()) {
			this.deps.send(
				buildOccupantPresence({
					roomJid: this.roomJid,
					nick: occupant.nick,
					to: recipient.realJid,
					realJid: occupant.realJid,
					role: occupant.role,
					type,
				}),
			);
		}
	}

	private broadcastMessage(fromNick: string, body: string, id?: string): void {
		for (const recipient of this.remoteOccupants()) {
			this.deps.send(buildGroupchatMessage({ roomJid: this.roomJid, fromNick, to: recipient.realJid, body, id }));
		}
	}

	private remoteOccupants(): MucOccupant[] {
		return [...this.occupants.values()].filter((occupant) => !occupant.isLocal);
	}
}
