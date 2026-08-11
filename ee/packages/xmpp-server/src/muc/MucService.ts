import type { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import type { XMPPServerEventMap } from '../events';
import type { MucRoomDescription } from '../iq/disco';
import type { Logger } from '../logger';
import { MucRoom } from './MucRoom';
import { parseMucInvite, splitOccupantJid } from './stanzas';

export type MucServiceDeps = {
	config: ResolvedXMPPServerConfig;
	events: Emitter<XMPPServerEventMap>;
	logger: Logger;
	send: (stanza: Element) => void;
	/** Routes an invite addressed to a local user (a room we might join as a client). */
	onLocalDirectedStanza?: (stanza: Element) => boolean;
};

/**
 * Registry and router for hosted MUC rooms. Owns the `<localpart>` → MucRoom map
 * and answers service-level disco#items with the public room list.
 */
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

	/** Handles a stanza addressed to the MUC service domain. Returns true if consumed. */
	handleStanza(stanza: Element): boolean {
		const { to } = stanza.attrs;
		if (!to) {
			return false;
		}

		const [roomJid] = splitOccupantJid(to);
		const roomId = roomJid.split('@')[0];
		const room = this.rooms.get(roomId);
		if (!room) {
			// An invite may be addressed to a local user via the service (rare); let the caller decide
			return false;
		}

		switch (stanza.name) {
			case 'presence':
				if (stanza.attrs.type === 'unavailable') {
					room.handleLeave(stanza);
				} else {
					void room.handleJoin(stanza).catch((err) => this.logger.error({ err }, 'MUC join failed'));
				}
				return true;
			case 'message':
				if (stanza.attrs.type === 'groupchat') {
					room.handleGroupchatMessage(stanza);
					return true;
				}
				return false;
			default:
				return false;
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
		this.deps.events.emit('muc.inviteReceived', invite);
		return true;
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
				const [msg] = args as [{ fromNick: string; fromJid: string; body: string; id?: string; raw: Element }];
				this.deps.events.emit('muc.messageReceived', { roomId, ...msg });
				break;
			}
			default:
				break;
		}
	}
}
