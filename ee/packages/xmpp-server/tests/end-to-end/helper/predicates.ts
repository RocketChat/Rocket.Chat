import { NS, bare } from './stanza';
import type { Stanza } from './stanza';

export type Predicate = (stanza: Stanza) => boolean;

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

/** The id of the message an XEP-0308 correction replaces; undefined for a plain message. */
export const replacedId = (stanza: Stanza): string | undefined => stanza.getChild('replace', NS.correction)?.attrs.id;

export const isGroupchat =
	({ roomJid, nick, body }: { roomJid: string; nick?: string; body?: string }): Predicate =>
	(stanza) =>
		stanza.name === 'message' &&
		stanza.attrs.type === 'groupchat' &&
		bare(stanza.attrs.from) === bare(roomJid) &&
		(nick === undefined || stanza.attrs.from?.split('/')[1] === nick) &&
		(body === undefined || stanza.getChildText('body') === body);

/** The room telling its occupants its subject (XEP-0045 §8.1). */
export const isRoomSubject =
	({ roomJid, subject }: { roomJid: string; subject: string }): Predicate =>
	(stanza) =>
		isGroupchat({ roomJid })(stanza) && stanza.getChildText('subject') === subject;

/** A mediated (XEP-0045) or direct (XEP-0249) invitation into the given room. */
export const isRoomInvite =
	(roomJid: string): Predicate =>
	(stanza) =>
		stanza.name === 'message' &&
		((bare(stanza.attrs.from) === bare(roomJid) && stanza.getChild('x', NS.mucUser)?.getChild('invite') !== undefined) ||
			bare(stanza.getChild('x', 'jabber:x:conference')?.attrs.jid) === bare(roomJid));
