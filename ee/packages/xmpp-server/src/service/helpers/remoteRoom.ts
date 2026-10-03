import { createHash } from 'node:crypto';

import { domainOfJid } from './jid';

/** The unique Rocket.Chat room name of the channel that mirrors a remote MUC, readable but distinct for every room JID. */
export function mirroredRoomName(roomJid: string): string {
	const hash = createHash('sha256').update(roomJid).digest('hex').slice(0, 8);
	return `${roomJid.replace(/[^0-9a-zA-Z-_.]/g, '_')}-${hash}`;
}

/** The name users see for the channel that mirrors a remote MUC, written the way Matrix rooms are. */
export function mirroredRoomDisplayName(roomJid: string): string {
	return `${roomJid.split('@')[0]}:${domainOfJid(roomJid)}`;
}
