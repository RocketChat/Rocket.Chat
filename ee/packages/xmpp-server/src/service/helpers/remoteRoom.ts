import { createHash } from 'node:crypto';

import { domainOfJid } from './jid';
import { escapeLocalpart } from '../../jid/escaping';

/** The unique Rocket.Chat room name of the channel that mirrors a remote MUC, readable but distinct for every room JID. */
export function mirroredRoomName(roomJid: string): string {
	const hash = createHash('sha256').update(roomJid).digest('hex').slice(0, 8);
	return `${roomJid.replace(/[^0-9a-zA-Z-_.]/g, '_')}-${hash}`;
}

/** The name users see for the channel that mirrors a remote MUC, written the way Matrix rooms are. */
export function mirroredRoomDisplayName(roomJid: string): string {
	return `${roomJid.split('@')[0]}:${domainOfJid(roomJid)}`;
}

/** The address standing for a remote-room occupant whose real JID the room never disclosed; one per nick and room. */
export function perRoomOccupantJid(nick: string, roomJid: string): string {
	// Bracketed so escaping keeps the nick's outer whitespace: `alice` and `alice ` are different occupants
	const escapedNick = escapeLocalpart(`[${nick}]`).slice(1, -1);
	return `${escapedNick.replaceAll('#', '\\23')}#${roomJid}`;
}
