import type { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import type { XMPPServerEventMap } from '../events';
import type { MucRoomDescription } from '../iq/disco';
import { normalizeRoomJid, normalizeUserBareJid } from '../jid/normalize';
import type { Logger } from '../logger';
import { MucRoom } from './MucRoom';
import { parseMucInvite, splitOccupantJid } from './stanzas';
import { buildStanzaError } from '../xml/errors';

export type MucServiceDeps = {
	config: ResolvedXMPPServerConfig;
	events: Emitter<XMPPServerEventMap>;
	logger: Logger;
	send: (stanza: Element) => void;
};

/** Registry of hosted rooms: routes MUC-domain stanzas to them and lists the public ones. */
export class MucService {
	private readonly rooms = new Map<string, MucRoom>();

	/** Rooms that disco#items advertises; private ones stay hidden but remain routable. */
	private readonly publicRooms = new Set<string>();

	private readonly logger: Logger;

	constructor(private readonly deps: MucServiceDeps) {
		this.logger = deps.logger.child({ component: 'muc' });
	}

	createRoom(params: { roomId: string; public?: boolean; subject?: string }): MucRoom {
		if (params.public !== undefined) {
			if (params.public) {
				this.publicRooms.add(params.roomId);
			} else {
				this.publicRooms.delete(params.roomId);
			}
		}

		const existing = this.rooms.get(params.roomId);
		if (existing) {
			if (params.subject !== undefined) {
				existing.setSubject(params.subject);
			}
			return existing;
		}

		const roomJid = `${params.roomId}@${this.deps.config.mucDomain}`;
		const room = new MucRoom({
			roomJid,
			subject: params.subject,
			send: this.deps.send,
			authorizeJoin: this.deps.config.delegates.authorizeMucJoin,
			emit: (event, ...args) => this.forwardRoomEvent(params.roomId, event, args),
		});
		this.rooms.set(params.roomId, room);
		return room;
	}

	/** Describes a hosted room for disco#info; undefined when the room is unknown. */
	describeRoom(roomId: string): MucRoomDescription | undefined {
		const room = this.rooms.get(roomId);
		if (!room) {
			return undefined;
		}
		return { roomId, public: this.publicRooms.has(roomId), subject: room.currentSubject };
	}

	destroyRoom(roomId: string): void {
		this.rooms.delete(roomId);
		this.publicRooms.delete(roomId);
	}

	getRoom(roomId: string): MucRoom | undefined {
		return this.rooms.get(roomId);
	}

	listPublicRooms(): { jid: string; name?: string }[] {
		return [...this.rooms.entries()].filter(([roomId]) => this.publicRooms.has(roomId)).map(([, room]) => ({ jid: room.roomJid }));
	}

	/**
	 * Handles a message or presence addressed to the MUC service domain; IQs are left to the
	 * router. Every message and presence is consumed, so none is taken for a DM or a contact's presence.
	 */
	handleStanza(stanza: Element): boolean {
		if (stanza.name !== 'message' && stanza.name !== 'presence') {
			return false;
		}
		// RFC 6120 §8.3.1: an error is never answered
		if (stanza.attrs.type === 'error') {
			return true;
		}

		const [roomJid] = splitOccupantJid(stanza.attrs.to ?? '');
		const at = roomJid.indexOf('@');
		const room = at > 0 ? this.rooms.get(roomJid.slice(0, at)) : undefined;

		if (stanza.name === 'presence') {
			this.handlePresence(stanza, room, at > 0);
		} else if (stanza.attrs.type === 'groupchat' && room) {
			room.handleGroupchatMessage(stanza);
		} else {
			this.deps.send(buildStanzaError(stanza, room ? 'feature-not-implemented' : 'item-not-found', 'cancel'));
		}
		return true;
	}

	/** Joins and leaves only: rooms take part in no presence subscription and answer no probe. */
	private handlePresence(stanza: Element, room: MucRoom | undefined, namesRoom: boolean): void {
		const { type } = stanza.attrs;
		if (type === 'unavailable') {
			room?.handleLeave(stanza);
		} else if (type === undefined && room) {
			void room.handleJoin(stanza).catch((err) => this.logger.error({ err }, 'MUC join failed'));
		} else if (type === undefined && namesRoom) {
			this.deps.send(buildStanzaError(stanza, 'forbidden', 'auth'));
		}
	}

	/** Detects and emits a MUC invitation addressed to a local user. */
	handlePossibleInvite(stanza: Element, localRecipientJid: string): boolean {
		if (stanza.name !== 'message') {
			return false;
		}
		const invite = parseMucInvite(stanza, localRecipientJid);
		if (!invite) {
			return false;
		}
		let roomJid: string;
		try {
			roomJid = normalizeRoomJid(invite.roomJid);
		} catch (err) {
			this.logger.warn({ err, roomJid: invite.roomJid }, 'Dropping MUC invite with an invalid room JID');
			return true;
		}
		this.deps.events.emit('muc.inviteReceived', { ...invite, roomJid, fromJid: this.inviterOf(invite.fromJid, roomJid) });
		return true;
	}

	/** The remote account that sent an invitation; the room stands in when the invitation names none, or names one of ours. */
	private inviterOf(fromJid: string, roomJid: string): string {
		let inviter: string;
		try {
			inviter = normalizeUserBareJid(fromJid);
		} catch {
			return roomJid;
		}
		const domain = inviter.slice(inviter.lastIndexOf('@') + 1);
		return domain === this.deps.config.domain || domain === this.deps.config.mucDomain ? roomJid : inviter;
	}

	private forwardRoomEvent(roomId: string, event: string, args: unknown[]): void {
		switch (event) {
			case 'occupantJoined': {
				const [occupant] = args as [{ nick: string; realJid: string; role: string }];
				this.deps.events.emit('muc.occupantJoined', { roomId, nick: occupant.nick, jid: occupant.realJid, role: occupant.role });
				break;
			}
			case 'occupantLeft': {
				const [occupant, reason] = args as [{ nick: string; realJid: string }, 'left' | 'kicked'];
				this.deps.events.emit('muc.occupantLeft', { roomId, nick: occupant.nick, jid: occupant.realJid, reason });
				break;
			}
			case 'message': {
				const [msg] = args as [{ fromNick: string; fromJid: string; body: string; id?: string; replaceId?: string; raw: Element }];
				this.deps.events.emit('muc.messageReceived', { roomId, ...msg });
				break;
			}
			default:
				break;
		}
	}
}
