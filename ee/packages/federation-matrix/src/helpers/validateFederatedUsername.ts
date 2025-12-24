import type { UserID } from '@rocket.chat/federation-sdk';

/** helper to validate the username format */
export function validateFederatedUsername(mxid: string): mxid is UserID {
	if (!mxid.startsWith('@')) return false;

	const parts = mxid.substring(1).split(':');
	if (parts.length < 2) return false;

	const localpart = parts[0];
	const domainAndPort = parts.slice(1).join(':');

	const localpartRegex = /^(?:[a-zA-Z0-9._\-]|=[0-9a-fA-F]{2}){1,255}$/;
	if (!localpartRegex.test(localpart)) return false;

	const [domain, port] = domainAndPort.split(':');

	const hostnameRegex = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)*$/i;
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
	const ipv6Regex = /^\[([0-9a-f:.]+)\]$/i;

	if (!(hostnameRegex.test(domain) || ipv4Regex.test(domain) || ipv6Regex.test(domain))) {
		return false;
	}

	if (port !== undefined) {
		const portNum = Number(port);
		if (!/^[0-9]+$/.test(port) || portNum < 1 || portNum > 65535) {
			return false;
		}
	}

	return true;
}
