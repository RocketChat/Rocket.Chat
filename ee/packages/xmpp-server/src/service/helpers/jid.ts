import { escapeLocalpart, unescapeLocalpart } from '../../jid/escaping';

export function toBareJid(jid: string): string {
	return jid.split('/')[0];
}

export function domainOfJid(jid: string): string {
	return toBareJid(jid).split('@').pop() ?? '';
}

/** The JID a local Rocket.Chat user sends from. */
export function localJidOf(username: string, domain: string): string {
	return `${escapeLocalpart(username)}@${domain}`;
}

/** The Rocket.Chat username a JID on our domain addresses. */
export function localUsernameOf(jid: string): string {
	return unescapeLocalpart(toBareJid(jid).split('@')[0]);
}
