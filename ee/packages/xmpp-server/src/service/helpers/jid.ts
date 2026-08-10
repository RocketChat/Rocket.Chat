/** Bare JID (`local@domain`) from any JID, dropping a resource if present. */
export function toBareJid(jid: string): string {
	return jid.split('/')[0];
}

export function domainOfJid(jid: string): string {
	return toBareJid(jid).split('@').pop() ?? '';
}
