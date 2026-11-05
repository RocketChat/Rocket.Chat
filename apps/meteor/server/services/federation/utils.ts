import { isUserXMPPFederated } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { isBareJid } from '@rocket.chat/tools';
import { normalizeDomain } from '@rocket.chat/xmpp-server';

import { settings } from '../../settings';

export function isFederationEnabled(): boolean {
	return settings.get<boolean>('Federation_Service_Enabled');
}

export function isXMPPServerEnabled(): boolean {
	return settings.get<boolean>('XMPP_Server_Enabled') && isServableDomain(settings.get<string>('XMPP_Server_Domain'));
}

/** Whether the XMPP server would start with `domain`, so a blank or malformed one counts as unset. */
function isServableDomain(domain: string): boolean {
	try {
		normalizeDomain(domain);
		return true;
	} catch {
		return false;
	}
}

/** The usernames that name an XMPP account: shaped like a bare JID, and not held by a user of this server. */
export async function filterXMPPJids(usernames: string[]): Promise<string[]> {
	const jids = usernames.filter(isBareJid);
	if (!jids.length) {
		return [];
	}
	const holders = await Users.findByUsernamesIgnoringCase(jids, { projection: { username: 1, xmppFederation: 1 } }).toArray();
	const heldLocally = new Set(holders.filter((user) => !isUserXMPPFederated(user)).map((user) => user.username?.toLowerCase()));
	return jids.filter((jid) => !heldLocally.has(jid.toLowerCase()));
}

export function throwIfFederationNotEnabled(): void {
	if (!isFederationEnabled()) {
		throw new Error('Federation is not enabled');
	}
}

export class FederationMatrixInvalidConfigurationError extends Error {
	constructor(cause?: string) {
		// oxlint-disable-next-line prefer-template
		const message = 'Federation configuration is invalid' + (cause ? ',' + cause[0].toLowerCase() + cause.slice(1) : '');

		super(message);

		this.name = 'FederationMatrixInvalidConfiguration';
	}
}
