import type Element from 'ltx/lib/Element';

import { xml } from '../xml/build';
import { NS_CONFERENCE, NS_MUC, NS_MUC_USER } from '../xml/namespaces';

export type MucRole = 'moderator' | 'participant';
export type MucAffiliation = 'owner' | 'admin' | 'member' | 'none';

const roleAffiliation = (role: MucRole): MucAffiliation => (role === 'moderator' ? 'owner' : 'member');

/**
 * Builds an occupant presence for a hosted room: `from` is the occupant's
 * in-room JID (`room@service/nick`), `to` is the recipient's real JID.
 * `statusCodes` carries MUC status codes (110 self, 201 room created, etc).
 */
export function buildOccupantPresence(params: {
	roomJid: string;
	nick: string;
	to: string;
	realJid?: string;
	role: MucRole;
	type?: 'unavailable';
	statusCodes?: number[];
}): Element {
	const item = xml('item', {
		affiliation: roleAffiliation(params.role),
		role: params.type === 'unavailable' ? 'none' : params.role,
		jid: params.realJid,
	});

	const x = xml('x', { xmlns: NS_MUC_USER }, item);
	for (const code of params.statusCodes ?? []) {
		x.cnode(xml('status', { code: String(code) }));
	}

	return xml('presence', { from: `${params.roomJid}/${params.nick}`, to: params.to, type: params.type }, x);
}

/** Builds a groupchat message reflected from a room occupant to a recipient. */
export function buildGroupchatMessage(params: { roomJid: string; fromNick: string; to: string; body: string; id?: string }): Element {
	return xml(
		'message',
		{ from: `${params.roomJid}/${params.fromNick}`, to: params.to, type: 'groupchat', id: params.id },
		xml('body', {}, params.body),
	);
}

/**
 * The room subject, which XEP-0045 §7.2.1 requires as the last step of a join —
 * many clients keep showing "joining…" until it arrives, empty subject included.
 */
export function buildSubjectMessage(params: { roomJid: string; to: string; subject?: string }): Element {
	return xml('message', { from: params.roomJid, to: params.to, type: 'groupchat' }, xml('subject', {}, params.subject ?? ''));
}

export type ParsedJoin = { nick: string; roomJid: string };

/** Parses a join presence to a room: `to` is `room@service/nick` with a MUC `<x/>` child. */
export function parseJoinPresence(presence: Element): ParsedJoin | undefined {
	const { to } = presence.attrs;
	if (!to || presence.attrs.type === 'unavailable') {
		return undefined;
	}
	if (!presence.getChild('x', NS_MUC)) {
		return undefined;
	}
	const [roomJid, nick] = splitOccupantJid(to);
	if (!roomJid || !nick) {
		return undefined;
	}
	return { nick, roomJid };
}

export function splitOccupantJid(jid: string): [room: string, nick: string | undefined] {
	const slash = jid.indexOf('/');
	if (slash === -1) {
		return [jid, undefined];
	}
	return [jid.slice(0, slash), jid.slice(slash + 1)];
}

/**
 * Builds a mediated invitation (XEP-0045 §7.8.2): the *room* invites the target,
 * carrying the inviter's JID inside `<invite/>`. This is what a hosted room must
 * send — the invitee's server sees the room as the sender.
 */
export function buildMediatedInvite(params: { roomJid: string; inviterJid: string; to: string; reason?: string }): Element {
	const invite = xml('invite', { from: params.inviterJid });
	if (params.reason) {
		invite.cnode(xml('reason', {}, params.reason));
	}
	return xml('message', { from: params.roomJid, to: params.to, type: 'normal' }, xml('x', { xmlns: NS_MUC_USER }, invite));
}

export type ParsedMucInvite = {
	roomJid: string;
	toLocalJid: string;
	fromJid: string;
	reason?: string;
	password?: string;
};

/**
 * Parses both mediated (XEP-0045 §7.8, `<x muc#user><invite/>`) and direct
 * (XEP-0249, `<x jabber:x:conference>`) MUC invitations. Returns undefined if
 * the message is not an invite.
 */
export function parseMucInvite(message: Element, localRecipientJid: string): ParsedMucInvite | undefined {
	// Direct invite (XEP-0249): the message is addressed to the invitee, room JID in the x element
	const direct = message.getChild('x', NS_CONFERENCE);
	if (direct?.attrs.jid) {
		return {
			roomJid: direct.attrs.jid,
			toLocalJid: localRecipientJid,
			fromJid: message.attrs.from,
			reason: direct.attrs.reason,
			password: direct.attrs.password,
		};
	}

	// Mediated invite (XEP-0045 §7.8): message is from the room, invite element carries the inviter
	const userX = message.getChild('x', NS_MUC_USER);
	const invite = userX?.getChild('invite');
	if (invite) {
		return {
			roomJid: message.attrs.from,
			toLocalJid: localRecipientJid,
			fromJid: invite.attrs.from ?? message.attrs.from,
			reason: invite.getChildText('reason') ?? undefined,
			password: userX?.getChildText('password') ?? undefined,
		};
	}

	return undefined;
}
